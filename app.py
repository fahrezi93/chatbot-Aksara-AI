import os
import requests
import json
from flask import Flask, render_template, request, Response, jsonify, session, redirect, url_for
from dotenv import load_dotenv
import google.generativeai as genai
import markdown
import firebase_admin
from firebase_admin import credentials, auth, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

# --- KONFIGURASI ---
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "ganti-dengan-kunci-rahasia-yang-kuat")

# --- INISIALISASI SEMUA LAYANAN ---
try:
    firebase_sdk_json_str = os.getenv("FIREBASE_ADMIN_SDK_JSON")
    cred = None
    if firebase_sdk_json_str:
        cred_dict = json.loads(firebase_sdk_json_str)
        cred = credentials.Certificate(cred_dict)
    else:
        if os.path.exists("firebase-admin-sdk.json"):
            cred = credentials.Certificate("firebase-admin-sdk.json")
        else:
            raise ValueError("Kredensial Firebase tidak ditemukan.")
            
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key: raise ValueError("Kunci API Gemini tidak ditemukan.")
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')

except Exception as e:
    print(f"Error saat inisialisasi: {e}")
    exit()

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1
    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

# --- ROUTES ---

@app.route("/")
def index():
    return render_template('chat.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            id_token = request.form.get('id_token') or request.json.get('id_token')
            decoded_token = auth.verify_id_token(id_token)
            session['user_id'] = decoded_token['uid']
            session['user_email'] = decoded_token.get('email', '')
            return jsonify({"status": "success", "redirect": url_for('index')})
        except Exception as e:
            print(f"Login error: {e}")
            return jsonify({"status": "error", "message": str(e)}), 401
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/forgot_password')
def forgot_password():
    return render_template('forgot-password.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/check_auth')
def check_auth():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "email": session.get('user_email')})
    return jsonify({"logged_in": False})

@app.route("/get_conversations")
def get_conversations():
    if 'user_id' not in session: return jsonify([]), 200
    user_id = session['user_id']
    try:
        convs_ref = db.collection('chats').document(user_id).collection('conversations').order_by('last_updated', direction=firestore.Query.DESCENDING).stream()
        conversations = [{"id": conv.id, "title": conv.to_dict().get("title", "Tanpa Judul")} for conv in convs_ref]
        return jsonify(conversations)
    except Exception as e:
        print(f"Error get_conversations: {e}")
        return jsonify([])

@app.route("/get_conversation/<conversation_id>")
def get_conversation(conversation_id):
    if 'user_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    user_id = session['user_id']
    try:
        messages_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id).collection('messages').order_by('timestamp').stream()
        messages = [msg.to_dict() for msg in messages_ref]
        return jsonify(messages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/save_message", methods=['POST'])
def save_message():
    if 'user_id' not in session:
        return jsonify({"status": "guest"}), 200
    user_id = session['user_id']
    data = request.json
    conversation_id = data.get('conversationId')
    message_data = data.get('messageData')
    try:
        if not conversation_id:
            conv_ref = db.collection('chats').document(user_id).collection('conversations').document()
            conversation_id = conv_ref.id
            title = " ".join(message_data.get('text', '').split()[:5])
            conv_ref.set({"title": title or "Obrolan Baru", "last_updated": firestore.SERVER_TIMESTAMP})
        msg_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id).collection('messages').document()
        msg_ref.set({
            'isUser': message_data.get('isUser'),
            'text': message_data.get('text'),
            'htmlContent': message_data.get('htmlContent'),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        db.collection('chats').document(user_id).collection('conversations').document(conversation_id).update({"last_updated": firestore.SERVER_TIMESTAMP})
        return jsonify({"status": "success", "conversationId": conversation_id})
    except Exception as e:
        print(f"Error save_message: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.json
    user_message = data['message']
    history = data.get('history', [])
    gemini_history = []
    for msg in history:
        role = "user" if msg.get("isUser") else "model"
        gemini_history.append({"role": role, "parts": [{"text": msg.get("text")}]})

    system_prompt = "Kamu adalah 'Aksara AI', sebuah asisten cerdas yang ramah, sopan, dan selalu menjawab dalam bahasa Indonesia. Format jawabanmu menggunakan Markdown."
    
    # ✅ PERBAIKAN: Baris yang hilang ini ditambahkan kembali
    full_prompt = f"{system_prompt}\n\nJawab pertanyaan ini:\n{user_message}"

    def stream_response():
        try:
            chat_session = gemini_model.start_chat(history=gemini_history)
            response_stream = chat_session.send_message(full_prompt, stream=True)
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Error streaming from Gemini: {e}")
            yield "Maaf, terjadi kesalahan saat menghubungi AI."
            
    return Response(stream_response(), mimetype='text/plain')

@app.route('/delete_conversation/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    user_id = session['user_id']
    try:
        conv_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id)
        messages_coll_ref = conv_ref.collection('messages')
        delete_collection(messages_coll_ref, 50)
        conv_ref.delete()
        return jsonify({"status": "success", "message": "Conversation deleted successfully"})
    except Exception as e:
        print(f"Error deleting conversation {conversation_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
