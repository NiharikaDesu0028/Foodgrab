from flask import Blueprint, request, jsonify
from models import db, Listing, Restaurant
from auth_utils import token_required, role_required

listing_bp = Blueprint('listings', __name__, url_prefix='/api/listings')

@listing_bp.route('', methods=['GET'])
def get_available_listings():
    query_str = request.args.get('q', '').strip().lower()

    # Query listings that are available and have quantity > 0
    query = Listing.query.filter(Listing.status == 'available', Listing.quantity > 0)

    listings = query.order_by(Listing.created_at.desc()).all()

    results = []
    for item in listings:
        # If search query is provided, filter by item name, restaurant name, or description
        if query_str:
            item_match = query_str in item.item_name.lower() or (item.description and query_str in item.description.lower())
            rest_match = item.restaurant and query_str in item.restaurant.name.lower()
            if not (item_match or rest_match):
                continue
        results.append(item.to_dict())

    return jsonify({'listings': results, 'count': len(results)}), 200


@listing_bp.route('', methods=['POST'])
@token_required
@role_required('restaurant')
def create_listing():
    restaurant = request.current_user.restaurant
    if not restaurant:
        return jsonify({'error': 'No restaurant profile found for this user'}), 400

    data = request.get_json() or {}
    item_name = data.get('item_name', '').strip()
    description = data.get('description', '').strip()
    original_price = data.get('original_price')
    price = data.get('price')
    quantity = data.get('quantity')
    pickup_by = data.get('pickup_by', '').strip()

    if not item_name or original_price is None or price is None or quantity is None or not pickup_by:
        return jsonify({'error': 'Item name, original price, discounted price, quantity, and pickup-by time are required'}), 400

    try:
        original_price = float(original_price)
        price = float(price)
        quantity = int(quantity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid numerical values for price or quantity'}), 400

    if original_price < 0 or price < 0:
        return jsonify({'error': 'Prices cannot be negative'}), 400

    if quantity <= 0:
        return jsonify({'error': 'Quantity must be at least 1'}), 400

    listing = Listing(
        restaurant_id=restaurant.id,
        item_name=item_name,
        description=description,
        original_price=original_price,
        price=price,
        quantity=quantity,
        pickup_by=pickup_by,
        status='available'
    )

    db.session.add(listing)
    db.session.commit()

    return jsonify({
        'message': 'Listing created successfully',
        'listing': listing.to_dict()
    }), 201


@listing_bp.route('/mine', methods=['GET'])
@token_required
@role_required('restaurant')
def get_restaurant_listings():
    restaurant = request.current_user.restaurant
    if not restaurant:
        return jsonify({'error': 'No restaurant profile found'}), 400

    listings = Listing.query.filter_by(restaurant_id=restaurant.id).order_by(Listing.created_at.desc()).all()
    return jsonify({
        'listings': [l.to_dict(include_restaurant=False) for l in listings]
    }), 200


@listing_bp.route('/<int:listing_id>', methods=['DELETE'])
@token_required
@role_required('restaurant')
def delete_listing(listing_id):
    restaurant = request.current_user.restaurant
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify({'error': 'Listing not found'}), 404

    if listing.restaurant_id != restaurant.id:
        return jsonify({'error': 'Unauthorized to modify this listing'}), 403

    db.session.delete(listing)
    db.session.commit()
    return jsonify({'message': 'Listing deleted successfully'}), 200


@listing_bp.route('/<int:listing_id>/status', methods=['PATCH'])
@token_required
@role_required('restaurant')
def update_listing_status(listing_id):
    restaurant = request.current_user.restaurant
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify({'error': 'Listing not found'}), 404

    if listing.restaurant_id != restaurant.id:
        return jsonify({'error': 'Unauthorized to modify this listing'}), 403

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ['available', 'sold_out', 'closed']:
        return jsonify({'error': 'Invalid status'}), 400

    listing.status = new_status
    db.session.commit()
    return jsonify({'message': 'Listing status updated', 'listing': listing.to_dict()}), 200
