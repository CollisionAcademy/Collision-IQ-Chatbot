from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/', methods=['POST'])
def handle_webhook():
    return jsonify({
        "fulfillment_response": {
            "messages": [{"text": {"text": ["✅ Webhook reached successfully!"]}}]
        }
    })

if __name__ == '__main__':
    app.run(debug=True)

