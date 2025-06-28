from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Set up Flask
app = Flask(__name__)

# Load Firebase credentials from environment variable
try:
    cred_json = json.loads(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
    cred = credentials.Certificate(cred_json)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase initialized successfully.")
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    db = None

# Webhook (POST)
@app.route('/', methods=['POST'])
def webhook():
    req = request.get_json()
    user_input = req.get('text', 'No input')
    print(f"🗣️ User said: {user_input}")

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

# Firestore test (GET)
@app.route('/get-todo', methods=['GET'])
def get_todo():
    if db is None:
        return jsonify({"error": "Firestore not initialized"}), 500
    try:
        doc_ref = db.collection('todos').document('3apQDtlrQA46w43ON2Ul')
        doc = doc_ref.get()
        if doc.exists:
            return jsonify(doc.to_dict())
        else:
            return jsonify({"error": "Document not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check (GET /)
@app.route('/', methods=['GET'])
def index():
    return "✅ Flask app is running!"

# Run app locally or in Render container
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Starting Flask server on port {port}")
    app.run(host="0.0.0.0", port=port)
