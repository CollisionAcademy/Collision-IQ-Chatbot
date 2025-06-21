from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)  # ✅ Add this line

@app.route('/', methods=['POST'])
def webhook():
    req = request.get_json()
    user_input = req.get("text", {}).get("text", [""])[0]
    logging.info(f"User said: {user_input}")  # ✅ Replace print()

    response = {
        "fulfillment_response": {
            "messages": [
                {
                    "text": {
                        "text": ["✅ Webhook reached successfully!"]
                    }
                }
            ]
        }
    }

    return jsonify(response)

@app.route('/', methods=['GET'])
def index():
    return "✅ Flask app is running on Heroku!"
