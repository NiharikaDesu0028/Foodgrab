from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db, Order, Listing, Restaurant
from auth_utils import token_required, role_required, generate_pickup_code

order_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@order_bp.route('', methods=['POST'])
@token_required
@role_required('buyer')
def create_order():
    data = request.get_json() or {}
    listing_id = data.get('listing_id')
    quantity = data.get('quantity', 1)

    if not listing_id:
        return jsonify({'error': 'listing_id is required'}), 400

    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Quantity must be a valid integer'}), 400

    if quantity <= 0:
        return jsonify({'error': 'Quantity must be greater than zero'}), 400

    # Retrieve listing with locking for concurrency safety
    listing = Listing.query.with_for_update().filter_by(id=listing_id).first()
    if not listing:
        return jsonify({'error': 'Listing not found'}), 404

    if listing.status != 'available' or listing.quantity < quantity:
        return jsonify({
            'error': f'Item unavailable or insufficient quantity. Only {listing.quantity} remaining.'
        }), 400

    # Reduce quantity
    listing.quantity -= quantity
    if listing.quantity == 0:
        listing.status = 'sold_out'

    # Generate unique pickup code
    pickup_code = generate_pickup_code()
    while Order.query.filter_by(pickup_code=pickup_code).first():
        pickup_code = generate_pickup_code()

    total_price = round(listing.price * quantity, 2)

    order = Order(
        listing_id=listing.id,
        buyer_id=request.current_user.id,
        quantity=quantity,
        total_price=total_price,
        pickup_code=pickup_code,
        status='reserved'
    )

    db.session.add(order)
    db.session.commit()

    return jsonify({
        'message': 'Order reserved successfully',
        'order': order.to_dict()
    }), 201


@order_bp.route('/mine', methods=['GET'])
@token_required
@role_required('buyer')
def get_buyer_orders():
    orders = Order.query.filter_by(buyer_id=request.current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify({
        'orders': [o.to_dict() for o in orders]
    }), 200


@order_bp.route('/restaurant', methods=['GET'])
@token_required
@role_required('restaurant')
def get_restaurant_orders():
    restaurant = request.current_user.restaurant
    if not restaurant:
        return jsonify({'error': 'No restaurant profile found'}), 400

    # Orders for this restaurant's listings
    orders = Order.query.join(Listing).filter(
        Listing.restaurant_id == restaurant.id
    ).order_by(Order.created_at.desc()).all()

    return jsonify({
        'orders': [o.to_dict() for o in orders]
    }), 200


@order_bp.route('/pickup', methods=['POST'])
@token_required
def mark_order_picked_up_by_code():
    data = request.get_json() or {}
    pickup_code = data.get('pickup_code', '').strip().upper()

    if not pickup_code:
        return jsonify({'error': 'Pickup code is required'}), 400

    order = Order.query.filter_by(pickup_code=pickup_code).first()
    if not order:
        return jsonify({'error': 'No order found with this pickup code'}), 404

    # If user is a restaurant, ensure order belongs to this restaurant
    if request.current_user.role == 'restaurant':
        restaurant = request.current_user.restaurant
        if not restaurant or order.listing.restaurant_id != restaurant.id:
            return jsonify({'error': 'This order does not belong to your restaurant'}), 403

    if order.status == 'picked_up':
        return jsonify({
            'error': 'This order has already been marked as picked up',
            'order': order.to_dict()
        }), 400

    order.status = 'picked_up'
    order.picked_up_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'message': f'Order for {order.listing.item_name} (Code: {order.pickup_code}) successfully marked as picked up!',
        'order': order.to_dict()
    }), 200


@order_bp.route('/<int:order_id>/pickup', methods=['POST'])
@token_required
def mark_order_picked_up_by_id(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    # Check restaurant ownership if restaurant role
    if request.current_user.role == 'restaurant':
        restaurant = request.current_user.restaurant
        if not restaurant or order.listing.restaurant_id != restaurant.id:
            return jsonify({'error': 'This order does not belong to your restaurant'}), 403

    data = request.get_json() or {}
    pickup_code = data.get('pickup_code', '').strip().upper()

    if pickup_code and pickup_code != order.pickup_code.upper():
        return jsonify({'error': 'Pickup code does not match this order'}), 400

    if order.status == 'picked_up':
        return jsonify({'error': 'This order has already been marked as picked up'}), 400

    order.status = 'picked_up'
    order.picked_up_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Order successfully marked as picked up!',
        'order': order.to_dict()
    }), 200
