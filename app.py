import os
import time
import requests
import json
from flask import Flask, render_template, request, Response, jsonify, session, redirect, url_for, send_from_directory
from dotenv import load_dotenv
import google.generativeai as genai
import markdown
from deepseek_api import DeepSeekAPI
import firebase_admin
from firebase_admin import credentials, auth, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import mimetypes
from PIL import Image
import io
import base64
from datetime import datetime

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "ganti-dengan-kunci-rahasia-yang-kuat")

# Aktifkan debug mode untuk auto-reload
app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

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
            
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
        
    db = firestore.client()

    # Initialize Gemini
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key: raise ValueError("Kunci API Gemini tidak ditemukan.")
    genai.configure(api_key=gemini_api_key)
    
    # Initialize DeepSeek
    deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
    if not deepseek_api_key: raise ValueError("Kunci API DeepSeek tidak ditemukan.")
    deepseek = DeepSeekAPI(deepseek_api_key)
    
    current_date = datetime.now().strftime("%A, %d %B %Y")
    system_instruction = (
        "Kamu adalah 'Aksara AI', sebuah asisten cerdas dari Indonesia. Tujuan utamamu adalah membantu pengguna dengan memberikan informasi yang akurat, jawaban yang mendalam, dan ide-ide kreatif. Selalu bersikap ramah, sopan, dan profesional namun tetap mudah didekati.\n\n"
        "## Konteks Penting:\n"
        f"Tanggal hari ini adalah {current_date}. Gunakan informasi ini jika pengguna bertanya tentang waktu atau hal-hal yang relevan dengan hari ini.\n\n"
        "## Aturan & Gaya Komunikasi:\n"
        "1.  **Bahasa:** Selalu gunakan Bahasa Indonesia yang baik dan benar. Boleh menggunakan istilah populer atau bahasa gaul jika konteksnya santai, tapi tetap jaga kesopanan.\n"
        "2.  **Format Jawaban:** Selalu format jawabanmu menggunakan Markdown untuk keterbacaan yang lebih baik. Gunakan heading, bullet points, dan bold jika diperlukan untuk menyusun informasi.\n"
        "3.  **Kejujuran & Keterbatasan:** Jika kamu tidak yakin atau tidak tahu jawaban dari suatu pertanyaan, jujur saja. Katakan sesuatu seperti, 'Maaf, saya belum memiliki informasi mengenai hal itu.' Jangan mengarang jawaban.\n"
        "4.  **Klarifikasi:** Jika pertanyaan pengguna ambigu atau kurang jelas, jangan langsung menjawab. Ajukan pertanyaan klarifikasi terlebih dahulu. Contoh: 'Maksud Anda A atau B? Bisa tolong diperjelas lagi pertanyaannya?'\n"
        "5.  **Proaktif:** Jangan hanya menjawab pertanyaan. Jika memungkinkan, berikan informasi tambahan yang relevan atau ajukan pertanyaan lanjutan untuk memancing diskusi yang lebih dalam. Contoh: Setelah menjelaskan resep, tanyakan 'Apakah Anda ingin tahu tips memasaknya atau informasi nilai gizinya?'"
    )
    
    gemini_model = genai.GenerativeModel(
        'gemini-1.5-flash',
        system_instruction=system_instruction
    )

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

@app.route("/")
def index():
    return render_template('chat.html')

@app.route('/google54e4da985dedde82.html')
def google_verification():
    return send_from_directory('.', 'google54e4da985dedde82.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            id_token = request.json.get('id_token')
            if not id_token:
                return jsonify({"status": "error", "message": "Token tidak ditemukan."}), 400

            # Verifikasi token Firebase dari klien dengan retry kecil untuk clock skew
            last_error = None
            for attempt in range(3):
                try:
                    decoded_token = auth.verify_id_token(id_token)
                    break
                except auth.InvalidIdTokenError as e:
                    last_error = e
                    # Jika token dianggap "terlalu awal", tunggu sebentar dan coba lagi
                    if "Token used too early" in str(e) and attempt < 2:
                        time.sleep(1)
                        continue
                    raise
                except Exception as e:
                    last_error = e
                    if "Token used too early" in str(e) and attempt < 2:
                        time.sleep(1)
                        continue
                    raise

            uid = decoded_token['uid']
            
            user_record = auth.get_user(uid)

            # Pastikan dokumen user ada di Firestore
            user_doc_ref = db.collection('users').document(uid)
            if not user_doc_ref.get().exists:
                user_doc_ref.set({
                    'email': user_record.email,
                    'displayName': user_record.display_name or user_record.email.split('@')[0],
                    'created_at': firestore.SERVER_TIMESTAMP
                }, merge=True)
            
            # Set session di server
            session['user_id'] = user_record.uid
            session['user_email'] = user_record.email
            
            display_name = user_record.display_name
            session['user_full_name'] = display_name or user_record.email.split('@')[0]

            if display_name:
                first_name = display_name.split(' ')[0]
                session['user_name'] = first_name
            else:
                session['user_name'] = user_record.email.split('@')[0]

            return jsonify({"status": "success", "redirect": url_for('index')})
        except auth.InvalidIdTokenError as e:
            # Mengembalikan pesan error yang lebih spesifik jika token tidak valid
            print(f"Login error (InvalidIdTokenError): {e}")
            return jsonify({"status": "error", "message": "Token tidak valid atau kedaluwarsa. Silakan coba lagi."}), 401
        except Exception as e:
            print(f"Login error: {e}")
            # Cek jika error adalah karena clock skew
            if "Token used too early" in str(e):
                return jsonify({"status": "error", "message": "Jam di server tidak sinkron. Coba lagi sebentar."}), 401
            return jsonify({"status": "error", "message": str(e)}), 500
            
    # Untuk metode GET, tampilkan halaman login
    return render_template('login.html')


@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/forgot_password')
def forgot_password():
    return render_template('forgot-password.html')

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('profile.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/check_auth')
def check_auth():
    if 'user_id' in session:
        return jsonify({
            "logged_in": True, 
            "email": session.get('user_email'),
            "username": session.get('user_name'),
            "user_full_name": session.get('user_full_name')
        })
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
            if message_data.get('imageData'):
                title = "Gambar: " + title
            conv_ref.set({"title": title or "Obrolan Baru", "last_updated": firestore.SERVER_TIMESTAMP})
        
        msg_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id).collection('messages').document()
        
        doc_to_save = {
            'isUser': message_data.get('isUser'),
            'text': message_data.get('text'),
            'htmlContent': message_data.get('htmlContent'),
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        if message_data.get('imageData'):
            doc_to_save['imageData'] = message_data.get('imageData')

        msg_ref.set(doc_to_save)
        
        db.collection('chats').document(user_id).collection('conversations').document(conversation_id).update({"last_updated": firestore.SERVER_TIMESTAMP})
        return jsonify({"status": "success", "conversationId": conversation_id})
    except Exception as e:
        print(f"Error save_message: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

def format_chat_history_for_deepseek(history):
    """Format chat history untuk DeepSeek API"""
    formatted_history = []
    for msg in history:
        role = "user" if msg.get("isUser") else "assistant"
        formatted_history.append({
            "role": role,
            "content": msg.get("text", "")
        })
    return formatted_history

@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.json
    user_message = data['message']
    history = data.get('history', [])
    image_data_b64 = data.get('imageData')
    model_id = data.get('modelId', 'gemini')  # Default ke Gemini jika tidak ada

    if model_id == 'deepseek':
        # Format history untuk DeepSeek
        formatted_history = format_chat_history_for_deepseek(history)
        # Tambahkan pesan user saat ini
        formatted_history.append({
            "role": "user",
            "content": user_message
        })
        
        def generate():
            try:
                response_stream = deepseek.create_completion(
                    messages=formatted_history,
                    stream=True
                )
                
                for line in response_stream:
                    if line:
                        try:
                            line_text = line.decode('utf-8')
                            if line_text.startswith('data: '):
                                json_str = line_text[6:]  # Hapus 'data: '
                                if json_str.strip() == '[DONE]':
                                    break
                                response_json = json.loads(json_str)
                                content = response_json['choices'][0]['delta'].get('content', '')
                                if content:
                                    yield f"data: {content}\n\n"
                        except Exception as e:
                            print(f"Error processing DeepSeek response: {e}")
                            continue
            except Exception as e:
                print(f"Error with DeepSeek API: {e}")
                yield f"data: Error: {str(e)}\n\n"
        
        return Response(generate(), mimetype='text/event-stream')
    
    else:  # Gemini model
        gemini_history = []
        for msg in history:
            role = "user" if msg.get("isUser") else "model"
            gemini_history.append({"role": role, "parts": [{"text": msg.get("text")}]})

    prompt_parts = []
    
    if image_data_b64:
        try:
            image_data_string = image_data_b64.split(',')[1]
            image_bytes = base64.b64decode(image_data_string)
            img = Image.open(io.BytesIO(image_bytes))
            prompt_parts.append(img)
        except Exception as e:
            print(f"Error processing image: {e}")
            return Response("Maaf, format gambar tidak valid.", status=400)

    if user_message:
        prompt_parts.append(user_message)

    if not prompt_parts:
         return Response("Maaf, saya tidak menerima pesan atau gambar.", status=400)

    def stream_response():
        try:
            chat_session = gemini_model.start_chat(history=gemini_history)
            response_stream = chat_session.send_message(prompt_parts, stream=True)
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

@app.route('/update_title/<conversation_id>', methods=['POST'])
def update_title(conversation_id):
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    user_id = session['user_id']
    data = request.json
    new_title = data.get('title')

    if not new_title:
        return jsonify({"status": "error", "message": "Title is required"}), 400

    try:
        conv_ref = db.collection('chats').document(user_id).collection('conversations').document(conversation_id)
        conv_ref.update({"title": new_title})
        return jsonify({"status": "success", "message": "Title updated"})
    except Exception as e:
        print(f"Error updating title for {conversation_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/update_username', methods=['POST'])
def update_username():
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    user_id = session['user_id']
    data = request.json
    new_username = data.get('new_username')

    if not new_username:
        return jsonify({"status": "error", "message": "Nama pengguna tidak boleh kosong"}), 400
    
    try:
        auth.update_user(user_id, display_name=new_username)
        session['user_name'] = new_username.split(' ')[0]
        session['user_full_name'] = new_username
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error updating username for {user_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/delete_account', methods=['DELETE'])
def delete_account():
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    try:
        user_chats_ref = db.collection('chats').document(user_id)
        conversations_ref = user_chats_ref.collection('conversations')
        
        docs = conversations_ref.stream()
        for doc in docs:
            messages_subcollection = doc.reference.collection('messages')
            delete_collection(messages_subcollection, 50)
        
        delete_collection(conversations_ref, 50)
        user_chats_ref.delete()
        auth.delete_user(user_id)
        session.clear()
        
        return jsonify({"status": "success", "message": "Akun berhasil dihapus."})
    except Exception as e:
        print(f"Error deleting account for {user_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    feedback_text = data.get('feedback')
    user_id = session.get('user_id', 'guest')
    user_email = session.get('user_email', 'guest')

    if not feedback_text:
        return jsonify({"status": "error", "message": "Teks masukan tidak boleh kosong"}), 400

    try:
        feedback_data = {
            'text': feedback_text,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'user_id': user_id,
            'user_email': user_email
        }

        db.collection('feedback').add(feedback_data)
        
        google_script_url = os.getenv("GOOGLE_SCRIPT_URL")
        if google_script_url:
            try:
                payload = {
                    "timestamp": datetime.now().isoformat(),
                    "email": user_email,
                    "feedback": feedback_text
                }
                requests.post(google_script_url, json=payload, timeout=5)
            except requests.exceptions.RequestException as e:
                print(f"Peringatan: Gagal mengirim feedback ke Google Sheets: {e}")

        return jsonify({"status": "success", "message": "Masukan berhasil dikirim"})
    except Exception as e:
        print(f"Error submitting feedback: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)