from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify

# Load Firebase credentials from base64 environment variable
base64_key = os.environ.get('GOOGLE_APPLICATION_KEY')
if not base64_key:
    raise Exception("GOOGLE_APPLICATION_KEY environment variable not set.")

decoded_key = base64.b64decode(base64_key).decode('utf-8')
service_account_info = json.loads(decoded_key)
import json
import os
from firebase_admin import credentials

cred_json = json.loads(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
cred = credentials.Certificate(cred_json)
firebase_admin.initialize_app(cred)

# Initialize Firestore client
db = firestore.client()

# Set up Flask app
app = Flask(__name__)

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
