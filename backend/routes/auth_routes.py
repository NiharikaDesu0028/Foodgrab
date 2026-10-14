from flask import Blueprint, request, jsonify
from models import db, User, Restaurant
from auth_utils import hash_password, check_password, generate_token, token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    name = data.get('name', '').strip()
    role = data.get('role', '').strip().lower()

    if not email or not password or not name or not role:
        return jsonify({'error': 'Email, password, name, and role are required'}), 400

    if role not in ['restaurant', 'buyer']:
        return jsonify({'error': 'Role must be either "restaurant" or "buyer"'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
        role=role
    )
    db.session.add(user)
    db.session.flush()  # to obtain user.id

    if role == 'restaurant':
        restaurant_name = data.get('restaurant_name', '').strip() or name
        address = data.get('address', '').strip()
        phone = data.get('phone', '').strip()
        description = data.get('description', '').strip()

        if not address:
            db.session.rollback()
            return jsonify({'error': 'Restaurant address is required for restaurant accounts'}), 400

        restaurant = Restaurant(
            user_id=user.id,
            name=restaurant_name,
            address=address,
            phone=phone,
            description=description
        )
        db.session.add(restaurant)

    db.session.commit()

    token = generate_token(user.id, user.role)
    return jsonify({
        'message': 'Signup successful',
        'token': token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = generate_token(user.id, user.role)
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    return jsonify({'user': request.current_user.to_dict()}), 200
