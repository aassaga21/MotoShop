from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
import time
import datetime

app = Flask(__name__)
CORS(app)

MONGO_HOST = os.environ.get('MONGO_HOST', 'localhost')
MONGO_USER = os.environ.get('MONGO_USERNAME', '')
MONGO_PASS = os.environ.get('MONGO_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'ecommerce')

if MONGO_USER and MONGO_PASS:
    MONGO_URI = f'mongodb://{MONGO_USER}:{MONGO_PASS}@{MONGO_HOST}:27017/{DB_NAME}?authSource=admin'
else:
    MONGO_URI = f'mongodb://{MONGO_HOST}:27017'

SEED_PRODUCTS = [
    {
        "name": "Yamaha MT-07", "brand": "Yamaha", "category": "Naked", "price": 8499,
        "description": "La MT-07 est une moto naked polyvalente avec son moteur bicylindre en ligne 689cc CP2.",
        "image": "/images/yamaha-mt07.jpg",
        "stock": 5, "engine": "689cc bicylindre", "power": "73 ch", "weight": "184 kg", "max_speed": "180 km/h",
        "year": 2024, "rating": 4.7
    },
    {
        "name": "Honda CB650R", "brand": "Honda", "category": "Naked", "price": 9299,
        "description": "La CB650R est une Neo-Sports Cafe avec son moteur 4 cylindres de 649cc.",
        "image": "/images/honda-cb650r.jpg",
        "stock": 3, "engine": "649cc 4 cylindres", "power": "95 ch", "weight": "202 kg", "max_speed": "195 km/h",
        "year": 2024, "rating": 4.5
    },
    {
        "name": "Kawasaki Z900", "brand": "Kawasaki", "category": "Naked", "price": 10299,
        "description": "La Z900 est l'hyper naked de Kawasaki avec son moteur 4 cylindres de 948cc.",
        "image": "/images/kawasaki-z900.jpg",
        "stock": 4, "engine": "948cc 4 cylindres", "power": "125 ch", "weight": "210 kg", "max_speed": "240 km/h",
        "year": 2024, "rating": 4.6
    },
    {
        "name": "Ducati Monster", "brand": "Ducati", "category": "Naked", "price": 13495,
        "description": "Le Monster redefinit la moto naked avec son design iconique et son moteur Testastretta 937cc.",
        "image": "/images/ducati-monster.jpg",
        "stock": 2, "engine": "937cc Testastretta", "power": "111 ch", "weight": "188 kg", "max_speed": "230 km/h",
        "year": 2024, "rating": 4.8
    },
    {
        "name": "Suzuki GSX-R750", "brand": "Suzuki", "category": "Sport", "price": 12990,
        "description": "La GSX-R750 est la supersportive legendaire de Suzuki.",
        "image": "/images/suzuki-gsx-r750.jpg",
        "stock": 3, "engine": "749cc 4 cylindres", "power": "150 ch", "weight": "190 kg", "max_speed": "270 km/h",
        "year": 2024, "rating": 4.7
    },
    {
        "name": "Kawasaki Ninja ZX-10R", "brand": "Kawasaki", "category": "Sport", "price": 17999,
        "description": "La Ninja ZX-10R est la reference des supersportives de serie.",
        "image": "/images/kawasaki-ninja-zx-10r.jpg",
        "stock": 2, "engine": "998cc 4 cylindres", "power": "203 ch", "weight": "206 kg", "max_speed": "300 km/h",
        "year": 2024, "rating": 4.9
    },
    {
        "name": "BMW R 1250 GS", "brand": "BMW", "category": "Trail", "price": 18990,
        "description": "Le R 1250 GS est le roi des trails avec son moteur boxer 1254cc.",
        "image": "/images/bmw-r1250gs.jpg",
        "stock": 2, "engine": "1254cc Boxer", "power": "136 ch", "weight": "249 kg", "max_speed": "220 km/h",
        "year": 2024, "rating": 4.8
    },
    {
        "name": "Honda Africa Twin", "brand": "Honda", "category": "Trail", "price": 14999,
        "description": "L'Africa Twin est une trail adventure dotee d'un moteur bicylindre parallele 1084cc.",
        "image": "/images/honda-africa-twin.jpg",
        "stock": 3, "engine": "1084cc bicylindre", "power": "102 ch", "weight": "226 kg", "max_speed": "210 km/h",
        "year": 2024, "rating": 4.6
    },
    {
        "name": "Harley-Davidson Sportster S", "brand": "Harley-Davidson", "category": "Cruiser", "price": 16995,
        "description": "Le Sportster S incarne la nouvelle generation Harley avec son moteur Revolution Max 1250T.",
        "image": "/images/harley-davidson-sportster-s.jpg",
        "stock": 2, "engine": "1250cc Revolution Max", "power": "121 ch", "weight": "228 kg", "max_speed": "200 km/h",
        "year": 2024, "rating": 4.5
    },
    {
        "name": "KTM 890 Duke", "brand": "KTM", "category": "Naked", "price": 11299,
        "description": "La 890 Duke est une naked legere et agile avec son bicylindre parallele de 889cc.",
        "image": "/images/ktm-890-duke.jpg",
        "stock": 4, "engine": "889cc bicylindre", "power": "121 ch", "weight": "166 kg", "max_speed": "230 km/h",
        "year": 2024, "rating": 4.7
    },
    {
        "name": "Yamaha Tenere 700", "brand": "Yamaha", "category": "Trail", "price": 11499,
        "description": "La Tenere 700 est une trail accessible avec son moteur CP2 689cc.",
        "image": "/images/yamaha-tenere-700.jpg",
        "stock": 5, "engine": "689cc bicylindre", "power": "73 ch", "weight": "204 kg", "max_speed": "185 km/h",
        "year": 2024, "rating": 4.6
    },
    {
        "name": "Indian Scout", "brand": "Indian", "category": "Cruiser", "price": 14499,
        "description": "La Scout est le joyau d'Indian Motorcycle avec son V-twin 1133cc.",
        "image": "/images/indian-scout.jpg",
        "stock": 3, "engine": "1133cc V-Twin", "power": "100 ch", "weight": "253 kg", "max_speed": "195 km/h",
        "year": 2024, "rating": 4.5
    },
]

# Variable globale pour la DB
_db = None

def get_db():
    global _db
    if _db is not None:
        return _db
    for attempt in range(30):
        try:
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            client.server_info()
            print("MongoDB connected.")
            _db = client[DB_NAME]
            # Seed si vide
            if _db.products.count_documents({}) == 0:
                _db.products.insert_many(SEED_PRODUCTS)
                print(f"Database seeded with {len(SEED_PRODUCTS)} products.")
            return _db
        except Exception as e:
            print(f"MongoDB not ready ({attempt + 1}/30): {e}")
            time.sleep(2)
    raise RuntimeError("Cannot connect to MongoDB after 30 attempts")


def serialize(doc):
    doc['_id'] = str(doc['_id'])
    return doc


@app.route('/api/health', methods=['GET'])
def health():
    get_db()
    return jsonify({'status': 'ok', 'db': 'connected'})


@app.route('/api/products', methods=['GET'])
def get_products():
    db = get_db()
    category = request.args.get('category')
    query = {'category': category} if category else {}
    products = [serialize(p) for p in db.products.find(query).sort('name', 1)]
    return jsonify(products)


@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    db = get_db()
    try:
        product = db.products.find_one({'_id': ObjectId(product_id)})
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(serialize(product))


@app.route('/api/orders', methods=['POST'])
def create_order():
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    order = {
        'customer': data.get('customer', {}),
        'items': data.get('items', []),
        'total': data.get('total', 0),
        'status': 'pending',
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    result = db.orders.insert_one(order)
    return jsonify({'id': str(result.inserted_id), 'status': 'success'}), 201


@app.route('/api/orders', methods=['GET'])
def get_orders():
    db = get_db()
    orders = [serialize(o) for o in db.orders.find().sort('created_at', -1)]
    return jsonify(orders)


@app.route('/api/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    db = get_db()
    data = request.get_json()
    new_status = data.get('status') if data else None
    valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if new_status not in valid:
        return jsonify({'error': f'Status must be one of {valid}'}), 400
    try:
        result = db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': {'status': new_status}}
        )
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400
    if result.matched_count == 0:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify({'status': 'updated'})


@app.route('/api/contact', methods=['POST'])
def contact():
    db = get_db()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    message = {
        'name': data.get('name', ''),
        'email': data.get('email', ''),
        'subject': data.get('subject', ''),
        'message': data.get('message', ''),
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    result = db.contacts.insert_one(message)
    return jsonify({'id': str(result.inserted_id), 'status': 'sent'}), 201


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)