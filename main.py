import os
import json
import base64
import requests
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

@app.route("/webhook", methods=["POST"])
def webhook():
    user_input = request.get_json().get("text", "").strip()
    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    # Gemini API call
    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [{
            "parts": [{"text": user_input}]
        }]
    }

    response = requests.post(
        f"{gemini_url}?key={os.environ.get('GEMINI_API_KEY')}",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        reply = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({"response": reply})
    else:
        return jsonify({"error": response.text}), response.status_code

if __name__ == "__main__":
    app.run(debug=True)
