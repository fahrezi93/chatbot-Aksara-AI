import os
import requests
import json # Impor library json
from flask import Flask, render_template, request, Response, jsonify, session, redirect, url_for
from dotenv import load_dotenv
import google.generativeai as genai
import markdown
import firebase_admin
from firebase_admin import credentials, auth, firestore

# --- KONFIGURASI ---
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "ganti-dengan-kunci-rahasia-yang-kuat")

# --- INISIALISASI SEMUA LAYANAN ---
try:
    # ✅ PERBAIKAN: Inisialisasi Firebase dari Environment Variable ATAU File
    firebase_sdk_json_str = os.getenv("FIREBASE_ADMIN_SDK_JSON")
    cred = None
    if firebase_sdk_json_str:
        # Metode untuk Vercel/Render (membaca dari env var)
        print("Memuat kredensial Firebase dari Environment Variable...")
        cred_dict = json.loads(firebase_sdk_json_str)
        cred = credentials.Certificate(cred_dict)
    else:
        # Metode fallback untuk pengembangan lokal (membaca dari file)
        print("Mencari file 'firebase-admin-sdk.json' untuk pengembangan lokal...")
        if os.path.exists("firebase-admin-sdk.json"):
            cred = credentials.Certificate("firebase-admin-sdk.json")
        else:
            # Jika keduanya tidak ada, hentikan aplikasi
            raise ValueError("Kredensial Firebase tidak ditemukan. Atur FIREBASE_ADMIN_SDK_JSON atau letakkan firebase-admin-sdk.json di direktori root.")
            
    firebase_admin.initialize_app(cred)
    
    db = firestore.client()

    # Inisialisasi Gemini
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key: raise ValueError("Kunci API Gemini tidak ditemukan.")
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')

    # Ambil kunci API OpenWeatherMap
    weather_api_key = os.getenv("OPENWEATHER_API_KEY")
    if not weather_api_key: print("PERINGATAN: Kunci API OpenWeatherMap tidak ditemukan.")

except Exception as e:
    print(f"Error saat inisialisasi: {e}")
    exit()

# ... sisa kode app.py tidak ada yang berubah ...
# (Semua route dan fungsi lainnya tetap sama persis seperti sebelumnya)

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
        return jsonify({"error": str(e)}), 500

@app.route("/save_message", methods=['POST'])
def save_message():
    if 'user_id' not in session: return jsonify({"status": "guest"}), 200
    user_id = session['user_id']
    data = request.json
    conversation_id = data.get('conversationId')
    message_data = data.get('messageData')
    try:
        if not conversation_id:
            conv_ref = db.collection('chats').document(user_id).collection('conversations').document()
            conversation_id = conv_ref.id
            conv_ref.set({"title": message_data.get('text'), "last_updated": firestore.SERVER_TIMESTAMP})
        msg_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id).collection('messages').document()
        msg_ref.set({**message_data, 'timestamp': firestore.SERVER_TIMESTAMP})
        db.collection('chats').document(user_id).collection('conversations').document(conversation_id).update({"last_updated": firestore.SERVER_TIMESTAMP})
        return jsonify({"status": "success", "conversationId": conversation_id})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/send_message", methods=["POST"])
def send_message():
    user_message = request.json['message']
    prompt_to_gemini = ( "Kamu adalah 'Asisten Cerdas' yang ramah dan sopan. Format jawabanmu menggunakan Markdown. Jawab pertanyaan ini:\n\n" f"{user_message}")
    def stream_response():
        try:
            chat_session = gemini_model.start_chat(history=[])
            response_stream = chat_session.send_message(prompt_to_gemini, stream=True)
            for chunk in response_stream:
                if chunk.text: yield chunk.text
        except Exception as e:
            yield "Maaf, terjadi kesalahan."
    return Response(stream_response(), mimetype='text/plain')

if __name__ == "__main__":
    app.run(debug=True) 
