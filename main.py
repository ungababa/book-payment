from flask import Flask, request, jsonify, send_from_directory
import stripe
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__,
            static_url_path='',
            static_folder='public')

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
UNIT_PRICE = 1000 

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

def validate_shipping_details(shipping_details):
    required_fields = ['name', 'address', 'city', 'country']
    return all(shipping_details.get(field) for field in required_fields)

def calculate_shipping(country, quantity):
    if country == "HK":
        if quantity == 1:
            return 2000
        elif quantity == 2:
            return 2500
        elif quantity <= 4:
            return 5000
        elif quantity <= 99:
            return 7000
    else:
        if quantity == 1:
            return 2500
        elif quantity == 2:
            return 4000
        elif quantity <= 4:
            return 7000
        elif quantity <= 10:
            return 10000
    return 2000

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json() or {}
        quantity = int(data.get('quantity', 1))
        country = str(data.get('country', 'HK'))
        if quantity < 1:
            quantity = 1
        if quantity > 10:
            quantity = 10

        subtotal = UNIT_PRICE * quantity
        packaging_fee = 1000
        shipping_fee = calculate_shipping(country, quantity)
        total_amount = subtotal + packaging_fee + shipping_fee

        payment_intent = stripe.PaymentIntent.create(
            amount=total_amount,
            currency="hkd",
            automatic_payment_methods={"enabled": True},
            metadata={
                "quantity": str(quantity),
                "country": country,
                "subtotal": str(subtotal),
                "packaging_fee": str(packaging_fee),
                "shipping_fee": str(shipping_fee)
            }
        )

        return jsonify(
            clientSecret=payment_intent.client_secret,
            amount_total=payment_intent.amount,
            currency=payment_intent.currency,
            quantity=quantity,
            unit_price=UNIT_PRICE,
            subtotal=subtotal,
            packaging_fee=packaging_fee,
            shipping_fee=shipping_fee,
            total=total_amount
        )
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route('/calculate-shipping', methods=['POST'])
def calculate_shipping_route():
    """Calculate shipping fee for a given country and quantity."""
    try:
        data = request.get_json() or {}
        country = str(data.get('country', 'HK'))
        quantity = int(data.get('quantity', 1))
        if quantity < 1:
            quantity = 1
        if quantity > 10:
            quantity = 10

        shipping_fee = calculate_shipping(country, quantity)
        subtotal = UNIT_PRICE * quantity
        packaging_fee = 1000
        total = subtotal + packaging_fee + shipping_fee

        return jsonify(
            country=country,
            quantity=quantity,
            unit_price=UNIT_PRICE,
            subtotal=subtotal,
            packaging_fee=packaging_fee,
            shipping_fee=shipping_fee,
            total=total
        )
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route('/session-status', methods=['GET'])
def session_status():
    session_id = request.args.get('session_id')
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return jsonify(
            id=session.id,
            status=session.payment_status,
            amount_total=session.amount_total
        )
    except Exception as e:
        return jsonify(error=str(e)), 400


@app.route('/payment-status', methods=['GET'])
def payment_status():
    pi = request.args.get('payment_intent') or request.args.get('payment_intent_client_secret')
    if not pi:
        return jsonify(error='missing payment_intent'), 400

    if '_secret_' in pi:
        pi = pi.split('_secret_')[0]

    try:
        intent = stripe.PaymentIntent.retrieve(pi)
        customer_email = None
        if getattr(intent, 'charges', None) and getattr(intent.charges, 'data', None):
            first_charge = intent.charges.data[0]
            if getattr(first_charge, 'billing_details', None):
                customer_email = getattr(first_charge.billing_details, 'email', None)

        shipping = None
        if getattr(intent, 'shipping', None):
            try:
                shipping = {
                    'name': intent.shipping.name,
                    'address': {
                        'line1': intent.shipping.address.line1 if intent.shipping.address else None,
                        'city': intent.shipping.address.city if intent.shipping.address else None,
                        'country': intent.shipping.address.country if intent.shipping.address else None,
                    }
                }
            except Exception:
                shipping = None

        return jsonify(
            id=intent.id,
            status=intent.status,
            amount_total=intent.amount,
            currency=intent.currency,
            customer_email=customer_email,
            shipping=shipping
        )
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route('/get-session-total', methods=['GET'])
def get_session_total():
    client_secret = request.args.get('clientSecret')
    try:
        session = stripe.checkout.Session.list(limit=1)
        if session.data:
            return jsonify(
                amount_total=session.data[0].amount_total,
                currency=session.data[0].currency
            )
        return jsonify(amount_total=0, currency='hkd')
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route('/return')
def return_page():
    return send_from_directory('public', 'return.html')

if __name__ == '__main__':
    app.run(port=10000)
