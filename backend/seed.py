import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from models import db, User, Restaurant, Listing, Order
from auth_utils import hash_password, generate_pickup_code

def seed_database():
    app = create_app()
    with app.app_context():
        # Clear existing data for fresh seed if desired
        db.drop_all()
        db.create_all()

        print("Creating demo users & restaurants...")

        # Restaurant 1: Green Garden Bistro
        rest1_user = User(
            email='bistro@foodgrab.com',
            password_hash=hash_password('bistro123'),
            role='restaurant',
            name='Chef Marco'
        )
        db.session.add(rest1_user)
        db.session.flush()

        rest1 = Restaurant(
            user_id=rest1_user.id,
            name='Green Garden Bistro',
            address='104 Market Street, Downtown',
            phone='+1 (555) 234-5678',
            description='Farm-to-table organic eatery specializing in fresh salads, artisanal pasta, and sourdough.'
        )
        db.session.add(rest1)

        # Restaurant 2: Sunrise Bakery & Cafe
        rest2_user = User(
            email='bakery@foodgrab.com',
            password_hash=hash_password('bakery123'),
            role='restaurant',
            name='Sarah Jenkins'
        )
        db.session.add(rest2_user)
        db.session.flush()

        rest2 = Restaurant(
            user_id=rest2_user.id,
            name='Sunrise Bakery & Cafe',
            address='250 Pine Avenue, Westside',
            phone='+1 (555) 876-5432',
            description='Freshly baked daily pastries, croissants, artisan sourdough loaves, and premium espresso.'
        )
        db.session.add(rest2)

        # Buyer 1: Alex Johnson
        buyer1 = User(
            email='alex@foodgrab.com',
            password_hash=hash_password('buyer123'),
            role='buyer',
            name='Alex Johnson'
        )
        db.session.add(buyer1)

        # Buyer 2: Emma Watson
        buyer2 = User(
            email='emma@foodgrab.com',
            password_hash=hash_password('buyer123'),
            role='buyer',
            name='Emma Watson'
        )
        db.session.add(buyer2)
        db.session.flush()

        print("Creating surplus food listings...")

        listing1 = Listing(
            restaurant_id=rest1.id,
            item_name='Artisanal Pasta & Tuscan Salad Bag',
            description='Surplus evening batch of handmade fettuccine al pesto paired with a fresh organic Tuscan garden salad and garlic focaccia bread.',
            original_price=22.00,
            price=6.99,
            quantity=4,
            pickup_by='Today, 8:30 PM - 9:30 PM',
            status='available'
        )

        listing2 = Listing(
            restaurant_id=rest1.id,
            item_name='Harvest Grain Bowl Surprise',
            description='Nutritious roasted sweet potato, quinoa, spiced chickpeas, and avocado tahini dressing. Freshly made today.',
            original_price=16.50,
            price=5.50,
            quantity=3,
            pickup_by='Today, 8:45 PM - 9:30 PM',
            status='available'
        )

        listing3 = Listing(
            restaurant_id=rest2.id,
            item_name='French Pastry & Croissant Box (4 pcs)',
            description='Assorted morning-baked butter croissants, chocolate pain au chocolat, and almond danishes.',
            original_price=18.00,
            price=5.00,
            quantity=5,
            pickup_by='Today, 6:00 PM - 7:30 PM',
            status='available'
        )

        listing4 = Listing(
            restaurant_id=rest2.id,
            item_name='Country Sourdough Loaf & Bagels',
            description='One whole rustic sourdough loaf and 3 seed bagels baked this morning with organic flour.',
            original_price=14.00,
            price=4.50,
            quantity=2,
            pickup_by='Today, 6:30 PM - 7:30 PM',
            status='available'
        )

        db.session.add_all([listing1, listing2, listing3, listing4])
        db.session.flush()

        print("Creating sample test order...")
        test_order = Order(
            listing_id=listing3.id,
            buyer_id=buyer1.id,
            quantity=1,
            total_price=5.00,
            pickup_code='FG-7B4K2',
            status='reserved'
        )
        # reduce listing3 quantity by 1
        listing3.quantity -= 1

        db.session.add(test_order)
        db.session.commit()

        print("Database seeded successfully!")
        print("\nDemo Accounts:")
        print("  Restaurant 1: bistro@foodgrab.com / bistro123")
        print("  Restaurant 2: bakery@foodgrab.com / bakery123")
        print("  Buyer 1:      alex@foodgrab.com   / buyer123")
        print("  Buyer 2:      emma@foodgrab.com   / buyer123")
        print("  Sample Code:  FG-7B4K2 (for French Pastry Box)")

if __name__ == '__main__':
    seed_database()
