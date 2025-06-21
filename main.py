from flask import Flask, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# Webhook route
@app.route('/', methods=['POST'])
def webhook():
    req = request.get_json()
    user_input = req.get('text', 'No input')
    print(f"User said: {user_input}")

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

# Default route
@app.route('/', methods=['GET'])
def index():
    return "✅ Flask app is running on Heroku!"
