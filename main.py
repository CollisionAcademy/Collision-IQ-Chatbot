from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import os

app = Flask(__name__)

# Initialize Firebase Admin SDK using a local service account key
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

# Initialize Firestore client
db = firestore.client()

# Webhook endpoint (Dialogflow CX or other POST services)
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

# Firestore test route (GET a specific document)
@app.route('/get-todo', methods=['GET'])
def get_todo():
    try:
        # Update this with your actual collection/document path
        doc_ref = db.collection('todos').document('3apQDtlrQA46w43ON2Ul')
        doc = doc_ref.get()
        if doc.exists:
            return jsonify(doc.to_dict())
        else:
            return jsonify({"error": "Document not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Root route for health check
@app.route('/', methods=['GET'])
def index():
    return "✅ Flask app is running on Heroku!"
