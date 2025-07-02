import os
import json
import base64
import requests
from flask import Flask, request, jsonify
from firebase_admin import credentials, firestore, initialize_app

# Decode base64-encoded credentials
encoded = os.environ["GOOGLE_APPLICATION_KEY"]
cred_json = json.loads(base64.b64decode(encoded).decode("utf-8"))

# Initialize Firebase
cred = credentials.Certificate(cred_json)
initialize_app(cred)
db = firestore.client()

# Flask app setup
app = Flask(__name__)

# Conversation memory
conversation = []

@app.route("/", methods=["GET"])
def home():
    return "✅ Flask app is running!"

# Gemini Conversational Route
@app.route("/webhook", methods=["POST"])
def webhook():
    user_input = request.get_json().get("text", "").strip()
    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    conversation.append({"role": "user", "parts": [{"text": user_input}]})

    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {"contents": conversation}

    response = requests.post(
        f"{gemini_url}?key={os.environ.get('GEMINI_API_KEY')}",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        reply = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        conversation.append({"role": "model", "parts": [{"text": reply}]})
        return jsonify({"response": reply})
    else:
        return jsonify({"error": response.text}), response.status_code

# Gemini Summarization Route
@app.route("/summarize", methods=["POST"])
def summarize():
    user_input = request.get_json().get("text", "").strip()
    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"Summarize this:\n{user_input}"}]
            }
        ]
    }

    response = requests.post(
        f"{gemini_url}?key={os.environ.get('GEMINI_API_KEY')}",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        summary = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({"summary": summary})
    else:
        return jsonify({"error": response.text}), response.status_code

if __name__ == "__main__":
    app.run(debug=True)