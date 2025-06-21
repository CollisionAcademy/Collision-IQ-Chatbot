from flask import Flask, request, jsonify
from google.cloud import firestore
import os

# ✅ Authenticate Firestore if running on Heroku
if "GOOGLE_APPLICATION_CREDENTIALS_JSON" in os.environ:
    with open("key.json", "w") as f:
        f.write(os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"])
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"

# ✅ Initialize Firestore
db = firestore.Client()

app = Flask(__name__)

@app.route("/get-todo", methods=["GET"])
def get_todo():
    try:
        doc_ref = db.collection("todos").document("3apQDtlrQA46w43ON2Ul")
        doc = doc_ref.get()

        if doc.exists:
            return jsonify(doc.to_dict())
        else:
            return jsonify({"error": "Document not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


