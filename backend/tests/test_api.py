import unittest
import os
import sys

# Add parent dir to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, Restaurant, Listing, Order

class FoodGrabTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_file = os.path.join(os.path.dirname(__file__), 'test_run.db')
        os.environ['DATABASE_URL'] = f'sqlite:///{cls.db_file}'
        os.environ['SECRET_KEY'] = 'test-secret-key-foodgrab'

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.db_file):
            try:
                os.remove(cls.db_file)
            except Exception:
                pass

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

        with self.app.app_context():
            db.drop_all()
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()

    def test_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        self.assertIn('healthy', res.get_json()['status'])

    def test_signup_and_login_restaurant(self):
        # Signup restaurant
        signup_data = {
            'email': 'pizza@test.com',
            'password': 'secretpassword',
            'name': 'Mario',
            'role': 'restaurant',
            'restaurant_name': 'Mario Pizza Co',
            'address': '123 Mozzarella Way'
        }
        res = self.client.post('/api/auth/signup', json=signup_data)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'restaurant')
        self.assertEqual(data['user']['restaurant']['name'], 'Mario Pizza Co')

        # Login restaurant
        login_res = self.client.post('/api/auth/login', json={
            'email': 'pizza@test.com',
            'password': 'secretpassword'
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertIn('token', login_data)

    def test_signup_buyer(self):
        res = self.client.post('/api/auth/signup', json={
            'email': 'buyer@test.com',
            'password': 'buyerpassword',
            'name': 'Lucy Buyer',
            'role': 'buyer'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['user']['role'], 'buyer')

    def test_listing_lifecycle_and_order_pickup(self):
        # 1. Register restaurant
        rest_res = self.client.post('/api/auth/signup', json={
            'email': 'cafe@test.com',
            'password': 'password123',
            'name': 'Cafe Owner',
            'role': 'restaurant',
            'restaurant_name': 'Corner Cafe',
            'address': '45 Elm Street'
        })
        rest_token = rest_res.get_json()['token']
        rest_headers = {'Authorization': f'Bearer {rest_token}'}

        # 2. Register buyer
        buyer_res = self.client.post('/api/auth/signup', json={
            'email': 'hungry@test.com',
            'password': 'password123',
            'name': 'Hungry Bob',
            'role': 'buyer'
        })
        buyer_token = buyer_res.get_json()['token']
        buyer_headers = {'Authorization': f'Bearer {buyer_token}'}

        # 3. Create listing
        listing_payload = {
            'item_name': 'Surplus Muffin Box',
            'description': 'Delicious blueberry and bran muffins',
            'original_price': 15.00,
            'price': 4.50,
            'quantity': 2,
            'pickup_by': 'Today 7:00 PM - 8:00 PM'
        }
        create_res = self.client.post('/api/listings', json=listing_payload, headers=rest_headers)
        self.assertEqual(create_res.status_code, 201)
        listing_id = create_res.get_json()['listing']['id']

        # 4. List available listings
        get_res = self.client.get('/api/listings')
        self.assertEqual(get_res.status_code, 200)
        listings = get_res.get_json()['listings']
        self.assertEqual(len(listings), 1)
        self.assertEqual(listings[0]['item_name'], 'Surplus Muffin Box')

        # 5. Buyer reserves 1 item
        order_res = self.client.post('/api/orders', json={
            'listing_id': listing_id,
            'quantity': 1
        }, headers=buyer_headers)
        self.assertEqual(order_res.status_code, 201)
        order_data = order_res.get_json()['order']
        self.assertEqual(order_data['status'], 'reserved')
        self.assertTrue(order_data['pickup_code'].startswith('FG-'))
        pickup_code = order_data['pickup_code']

        # 6. Verify listing quantity was reduced from 2 to 1
        get_res_after = self.client.get('/api/listings')
        self.assertEqual(get_res_after.get_json()['listings'][0]['quantity'], 1)

        # 7. Check buyer orders
        buyer_orders_res = self.client.get('/api/orders/mine', headers=buyer_headers)
        self.assertEqual(buyer_orders_res.status_code, 200)
        self.assertEqual(len(buyer_orders_res.get_json()['orders']), 1)
        self.assertEqual(buyer_orders_res.get_json()['orders'][0]['pickup_code'], pickup_code)

        # 8. Restaurant marks order as picked up using the short pickup code
        pickup_res = self.client.post('/api/orders/pickup', json={
            'pickup_code': pickup_code
        }, headers=rest_headers)
        self.assertEqual(pickup_res.status_code, 200)
        self.assertEqual(pickup_res.get_json()['order']['status'], 'picked_up')

        # 9. Verify order is now marked picked_up for buyer
        buyer_orders_res2 = self.client.get('/api/orders/mine', headers=buyer_headers)
        self.assertEqual(buyer_orders_res2.get_json()['orders'][0]['status'], 'picked_up')

        # 10. Attempting to pick up again returns 400
        repeat_pickup = self.client.post('/api/orders/pickup', json={
            'pickup_code': pickup_code
        }, headers=rest_headers)
        self.assertEqual(repeat_pickup.status_code, 400)

if __name__ == '__main__':
    unittest.main()
