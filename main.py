import os
import json
import base64
from firebase_admin import credentials, firestore, initialize_app
from flask import Flask, request, jsonify

# Decode base64-encoded credentials from environment
encoded = os.environ["GOOGLE_APPLICATION_KEY"]
decoded = base64.b64decode(encoded).decode("utf-8")
cred_json = json.loads(decoded)

# Initialize Firebase
cred = credentials.Certificate(cred_json)
initialize_app(cred)

# Firestore client
db = firestore.client()

# Flask app setup
app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    return "✅ Flask app is running!"

@app.route("/", methods=["POST"])
def webhook():
    req = request.get_json()
    user_input = req.get("text", "").lower().strip()

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

if __name__ == "__main__":
    app.run(debug=True)

