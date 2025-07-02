from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import firebase_admin
from firebase_admin import credentials

# Load base64-encoded string from environment variable
encoded = os.environ["GOOGLE_APPLICATION_KEY"]

# Decode base64 to JSON string
decoded = base64.b64decode(encoded).decode("utf-8")

# Parse the JSON string
cred_json = json.loads(decoded)

# Initialize Firebase app with credentials
cred = credentials.Certificate(cred_json)
firebase_admin.initialize_app(cred)

# Initialize Flask
app = Flask("main")

# Load Firebase credentials from environment
cred_json = json.loads(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
cred = credentials.Certificate(cred_json)
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()

@app.route("/", methods=["POST"])
def webhook():
    req = request.get_json()
    user_input = req.get("text", "").lower().strip()

    # Firestore query
    docs = db.collection("oem_procedures").where("keyword", "==", user_input).stream()
    response = "❌ No matching procedure found."

    for doc in docs:
        data = doc.to_dict()
        response = data.get("procedure", response)
        break

    return jsonify({
        "fulfillment_response": {
            "messages": [{"text": {"text": [response]}}]
        }
    })

# Optional health check route
@app.route("/", methods=["GET"])
def index():
    return "✅ Flask app is running!"

# Enable direct execution
if __name__ == "__main__":
    app.run(debug=True)
