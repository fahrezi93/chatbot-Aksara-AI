"""
Chat API - Send messages to AI models (Gemini/DeepSeek)
Supports streaming responses
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import base64
import io
from datetime import datetime

import google.generativeai as genai
import requests
from PIL import Image


# Initialize Gemini
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

# DeepSeek API config
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

# System instruction
current_date = datetime.now().strftime("%A, %d %B %Y")
SYSTEM_INSTRUCTION = f"""Kamu adalah 'Aksara AI', sebuah asisten cerdas dari Indonesia. Tujuan utamamu adalah membantu pengguna dengan memberikan informasi yang akurat, jawaban yang mendalam, dan ide-ide kreatif. Selalu bersikap ramah, sopan, dan profesional namun tetap mudah didekati.

## Konteks Penting:
Tanggal hari ini adalah {current_date}. Gunakan informasi ini jika pengguna bertanya tentang waktu atau hal-hal yang relevan dengan hari ini.

## Aturan & Gaya Komunikasi:
1. **Bahasa:** Selalu gunakan Bahasa Indonesia yang baik dan benar. Boleh menggunakan istilah populer atau bahasa gaul jika konteksnya santai, tapi tetap jaga kesopanan.
2. **Format Jawaban:** Selalu format jawabanmu menggunakan Markdown untuk keterbacaan yang lebih baik. Gunakan heading, bullet points, dan bold jika diperlukan untuk menyusun informasi.
3. **Kejujuran & Keterbatasan:** Jika kamu tidak yakin atau tidak tahu jawaban dari suatu pertanyaan, jujur saja. Katakan sesuatu seperti, 'Maaf, saya belum memiliki informasi mengenai hal itu.' Jangan mengarang jawaban.
4. **Klarifikasi:** Jika pertanyaan pengguna ambigu atau kurang jelas, jangan langsung menjawab. Ajukan pertanyaan klarifikasi terlebih dahulu.
5. **Proaktif:** Jangan hanya menjawab pertanyaan. Jika memungkinkan, berikan informasi tambahan yang relevan atau ajukan pertanyaan lanjutan untuk memancing diskusi yang lebih dalam."""


def send_gemini_message(message: str, history: list, image_data: str | None = None) -> str:
    """Send message to Gemini API"""
    try:
        model = genai.GenerativeModel(
            'gemini-2.0-flash',
            system_instruction=SYSTEM_INSTRUCTION
        )
        
        # Build history for Gemini
        gemini_history = []
        for msg in history:
            role = "user" if msg.get("isUser") else "model"
            gemini_history.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
        
        # Build prompt parts
        prompt_parts = []
        
        # Handle image if present
        if image_data:
            try:
                image_data_string = image_data.split(',')[1] if ',' in image_data else image_data
                image_bytes = base64.b64decode(image_data_string)
                img = Image.open(io.BytesIO(image_bytes))
                prompt_parts.append(img)
            except Exception as e:
                print(f"Error processing image: {e}")
        
        if message:
            prompt_parts.append(message)
        
        if not prompt_parts:
            return "Maaf, saya tidak menerima pesan atau gambar."
        
        # Start chat and send message
        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(prompt_parts)
        
        return response.text
        
    except Exception as e:
        print(f"Gemini error: {e}")
        return f"Maaf, terjadi kesalahan saat menghubungi AI: {str(e)}"


def send_deepseek_message(message: str, history: list) -> str:
    """Send message to DeepSeek API"""
    try:
        if not DEEPSEEK_API_KEY:
            return "DeepSeek API key tidak dikonfigurasi."
        
        # Build messages for DeepSeek
        messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
        
        for msg in history:
            role = "user" if msg.get("isUser") else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})
        
        messages.append({"role": "user", "content": message})
        
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-reasoner",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4096
        }
        
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
        
    except Exception as e:
        print(f"DeepSeek error: {e}")
        return f"Maaf, terjadi kesalahan saat menghubungi DeepSeek: {str(e)}"


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            message = data.get('message', '')
            history = data.get('history', [])
            model = data.get('model', 'gemini')
            image_data = data.get('imageData')
            
            # Select model and get response
            if model == 'deepseek':
                response_text = send_deepseek_message(message, history)
            else:
                response_text = send_gemini_message(message, history, image_data)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "status": "success",
                "response": response_text,
                "model": model
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = {
                "status": "error",
                "message": str(e)
            }
            
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
