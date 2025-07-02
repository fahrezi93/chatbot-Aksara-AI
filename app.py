import os
import requests
from flask import Flask, render_template, request, Response, jsonify, session, redirect, url_for
from dotenv import load_dotenv
import google.generativeai as genai
import markdown
import firebase_admin
from firebase_admin import credentials, auth, firestore
import datetime

# --- KONFIGURASI ---
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "ganti-dengan-kunci-rahasia-yang-kuat")

# --- INISIALISASI ---
try:
    cred = credentials.Certificate("firebase-admin-sdk.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key: raise ValueError("Kunci API Gemini tidak ditemukan.")
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Error saat inisialisasi: {e}")
    exit()

# --- HALAMAN & AUTENTIKASI (Tidak berubah) ---
@app.route("/")
def index(): return render_template('chat.html')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            decoded_token = auth.verify_id_token(request.form.get('id_token'))
            session['user_id'] = decoded_token['uid']
            session['user_email'] = decoded_token.get('email', '')
            return jsonify({"status": "success", "redirect": url_for('index')})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 401
    return render_template('login.html')
@app.route('/register')
def register(): return render_template('register.html')
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))
@app.route('/check_auth')
def check_auth():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "email": session.get('user_email')})
    return jsonify({"logged_in": False})

# --- ✅ API BARU UNTUK MANAJEMEN PERCAKAPAN ---

@app.route("/get_conversations")
def get_conversations():
    if 'user_id' not in session: return jsonify([]), 200
    user_id = session['user_id']
    try:
        convs_ref = db.collection('chats').document(user_id).collection('conversations').order_by('last_updated', direction=firestore.Query.DESCENDING).stream()
        conversations = [{"id": conv.id, "title": conv.to_dict().get("title")} for conv in convs_ref]
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
        print(f"Error get_conversation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/save_message", methods=['POST'])
def save_message():
    if 'user_id' not in session: return jsonify({"status": "guest"}), 200
    user_id = session['user_id']
    data = request.json
    conversation_id = data.get('conversationId')
    message_data = data.get('messageData')
    
    try:
        # Jika tidak ada ID percakapan, buat yang baru
        if not conversation_id:
            conversation_id = db.collection('chats').document(user_id).collection('conversations').document().id
            # Simpan pesan pertama sebagai judul
            conv_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id)
            conv_ref.set({
                "title": message_data.get('text'),
                "last_updated": firestore.SERVER_TIMESTAMP
            })
        
        # Simpan pesan di dalam sub-koleksi
        msg_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id).collection('messages').document()
        msg_ref.set({**message_data, 'timestamp': firestore.SERVER_TIMESTAMP})

        # Update timestamp percakapan
        db.collection('chats').document(user_id).collection('conversations').document(conversation_id).update({
            "last_updated": firestore.SERVER_TIMESTAMP
        })

        return jsonify({"status": "success", "conversationId": conversation_id})
    except Exception as e:
        print(f"Error save_message: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/send_message", methods=["POST"])
def send_message():
    # Fungsi ini sekarang hanya fokus untuk mendapatkan respons dari Gemini
    user_message = request.json['message']
    prompt_to_gemini = ( "Kamu adalah 'Asisten Cerdas' yang ramah dan sopan. Format jawabanmu menggunakan Markdown. Jawab pertanyaan ini:\n\n" f"{user_message}")

    def stream_response():
        try:
            chat_session = gemini_model.start_chat(history=[])
            response_stream = chat_session.send_message(prompt_to_gemini, stream=True)
            for chunk in response_stream:
                if chunk.text: yield chunk.text
        except Exception as e:
            print(f"Error saat streaming: {e}")
            yield "Maaf, terjadi kesalahan."

    return Response(stream_response(), mimetype='text/plain')
