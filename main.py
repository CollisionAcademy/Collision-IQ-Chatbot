from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/', methods=['POST'])
def webhook():
    req = request.get_json()

    # Example CX logic
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

@app.route('/', methods=['GET'])
def index():
    return "✅ Flask app is running on Heroku!"

