from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/', methods=['POST'])
def handle_webhook():
    return jsonify({
        "fulfillment_response": {
            "messages": [{"text": {"text": ["✅ Webhook reached successfully!"]}}]
        }
    })

@app.route('/', methods=['GET'])
def home():
    return "✅ Flask app is running on Heroku!"

if __name__ == '__main__':
    app.run()
