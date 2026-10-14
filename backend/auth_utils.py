import jwt
import random
import string
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def check_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

def generate_token(user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id),
        'role': role,
        'iat': now,
        'exp': now + timedelta(days=7)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def decode_token(token: str):
    try:
        return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except Exception as e:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization token is missing'}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization header format. Expected Bearer <token>'}), 401

        token = parts[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or has expired'}), 401

        user_id = int(payload['sub'])
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401

        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def role_required(required_role: str):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'current_user') or request.current_user.role != required_role:
                return jsonify({'error': f'Access restricted to {required_role} role'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def generate_pickup_code() -> str:
    # 5-character readable code prefixed with FG- (avoid confusing letters 0/O, 1/I)
    charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    suffix = ''.join(random.choices(charset, k=5))
    return f"FG-{suffix}"
