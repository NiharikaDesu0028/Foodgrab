from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def utc_now():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'restaurant' or 'buyer'
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    # Relationships
    restaurant = db.relationship('Restaurant', backref='user', uselist=False, cascade="all, delete-orphan")
    orders = db.relationship('Order', backref='buyer', lazy=True)

    def to_dict(self):
        data = {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if self.role == 'restaurant' and self.restaurant:
            data['restaurant'] = self.restaurant.to_dict()
        return data


class Restaurant(db.Model):
    __tablename__ = 'restaurants'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now)

    # Relationships
    listings = db.relationship('Listing', backref='restaurant', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Listing(db.Model):
    __tablename__ = 'listings'

    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    item_name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    original_price = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)  # Discounted / surplus price
    quantity = db.Column(db.Integer, nullable=False)
    pickup_by = db.Column(db.String(100), nullable=False)  # pickup-by time
    status = db.Column(db.String(20), default='available', nullable=False)  # 'available', 'sold_out', 'closed'
    created_at = db.Column(db.DateTime, default=utc_now)

    # Relationships
    orders = db.relationship('Order', backref='listing', lazy=True)

    def to_dict(self, include_restaurant=True):
        data = {
            'id': self.id,
            'restaurant_id': self.restaurant_id,
            'item_name': self.item_name,
            'description': self.description,
            'original_price': self.original_price,
            'price': self.price,
            'quantity': self.quantity,
            'pickup_by': self.pickup_by,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_restaurant and self.restaurant:
            data['restaurant'] = {
                'id': self.restaurant.id,
                'name': self.restaurant.name,
                'address': self.restaurant.address,
                'phone': self.restaurant.phone,
                'description': self.restaurant.description
            }
        return data


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    pickup_code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), default='reserved', nullable=False)  # 'reserved', 'picked_up', 'cancelled'
    created_at = db.Column(db.DateTime, default=utc_now)
    picked_up_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'listing_id': self.listing_id,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer.name if self.buyer else None,
            'buyer_email': self.buyer.email if self.buyer else None,
            'item_name': self.listing.item_name if self.listing else None,
            'pickup_by': self.listing.pickup_by if self.listing else None,
            'restaurant_name': self.listing.restaurant.name if self.listing and self.listing.restaurant else None,
            'restaurant_address': self.listing.restaurant.address if self.listing and self.listing.restaurant else None,
            'restaurant_id': self.listing.restaurant_id if self.listing else None,
            'quantity': self.quantity,
            'total_price': self.total_price,
            'pickup_code': self.pickup_code,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'picked_up_at': self.picked_up_at.isoformat() if self.picked_up_at else None
        }
