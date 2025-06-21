from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/', methods=['POST'])
def webhook():
    req = request.get_json()
    logging.info(f"Received request: {req}")

    # Step 2: CX-style response (change logic here as needed)
    response = {
        "fulfillment_response": {
            "messages": [
                {
                    "text": {
                        "text": [f"✅ Echo: You said '{req.get('text', 'nothing')}''"]
                    }
                }
            ]
        }
    }

    return jsonify(response)

@app.route('/', methods=['GET'])
def index():
    return "✅ Flask app is running on Heroku!"

