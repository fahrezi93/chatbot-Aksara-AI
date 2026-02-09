"""
Conversations API - CRUD operations for chat history
Uses Firebase Firestore
"""
from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

import firebase_admin
from firebase_admin import credentials, firestore


# Initialize Firebase Admin
def get_firestore_client():
    try:
        if not firebase_admin._apps:
            firebase_sdk_json = os.environ.get("FIREBASE_ADMIN_SDK_JSON")
            if firebase_sdk_json:
                cred_dict = json.loads(firebase_sdk_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
            else:
                raise ValueError("Firebase credentials not found")
        return firestore.client()
    except Exception as e:
        print(f"Firebase init error: {e}")
        return None


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _get_user_id(self) -> str | None:
        """Get user ID from query params or headers"""
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        return params.get('userId', [None])[0] or self.headers.get('X-User-Id')
    
    def do_GET(self):
        """Get conversations or messages"""
        try:
            db = get_firestore_client()
            if not db:
                self._send_json(500, {"error": "Database not available"})
                return
            
            user_id = self._get_user_id()
            if not user_id:
                self._send_json(401, {"error": "Unauthorized"})
                return
            
            parsed = urlparse(self.path)
            path_parts = parsed.path.strip('/').split('/')
            
            # GET /api/conversations?userId=xxx - List conversations
            if len(path_parts) == 2 and path_parts[1] == 'conversations':
                convs_ref = db.collection('chats').document(user_id).collection('conversations')
                convs = convs_ref.order_by('last_updated', direction=firestore.Query.DESCENDING).stream()
                
                conversations = []
                for conv in convs:
                    data = conv.to_dict()
                    conversations.append({
                        "id": conv.id,
                        "title": data.get("title", "Tanpa Judul"),
                        "lastUpdated": data.get("last_updated")
                    })
                
                self._send_json(200, {"conversations": conversations})
                return
            
            # GET /api/conversations/[id]?userId=xxx - Get messages
            if len(path_parts) == 3 and path_parts[1] == 'conversations':
                conv_id = path_parts[2]
                msgs_ref = db.collection('chats').document(user_id).collection('conversations').document(conv_id).collection('messages')
                msgs = msgs_ref.order_by('timestamp').stream()
                
                messages = []
                for msg in msgs:
                    data = msg.to_dict()
                    messages.append({
                        "id": msg.id,
                        "isUser": data.get("isUser"),
                        "text": data.get("text"),
                        "htmlContent": data.get("htmlContent"),
                        "imageData": data.get("imageData"),
                        "timestamp": str(data.get("timestamp"))
                    })
                
                self._send_json(200, {"messages": messages})
                return
            
            self._send_json(404, {"error": "Not found"})
            
        except Exception as e:
            self._send_json(500, {"error": str(e)})
    
    def do_POST(self):
        """Create conversation or save message"""
        try:
            db = get_firestore_client()
            if not db:
                self._send_json(500, {"error": "Database not available"})
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            user_id = data.get('userId') or self._get_user_id()
            if not user_id:
                self._send_json(401, {"error": "Unauthorized"})
                return
            
            conversation_id = data.get('conversationId')
            message_data = data.get('messageData')
            
            # Create new conversation if needed
            if not conversation_id:
                conv_ref = db.collection('chats').document(user_id).collection('conversations').document()
                conversation_id = conv_ref.id
                
                title = " ".join(message_data.get('text', '').split()[:5]) if message_data else "Obrolan Baru"
                if message_data and message_data.get('imageData'):
                    title = "Gambar: " + title
                
                conv_ref.set({
                    "title": title or "Obrolan Baru",
                    "last_updated": firestore.SERVER_TIMESTAMP
                })
            
            # Save message if provided
            if message_data:
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
                
                # Update conversation timestamp
                db.collection('chats').document(user_id).collection('conversations').document(conversation_id).update({
                    "last_updated": firestore.SERVER_TIMESTAMP
                })
            
            self._send_json(200, {"status": "success", "conversationId": conversation_id})
            
        except Exception as e:
            self._send_json(500, {"error": str(e)})
    
    def do_PUT(self):
        """Update conversation title"""
        try:
            db = get_firestore_client()
            if not db:
                self._send_json(500, {"error": "Database not available"})
                return
            
            parsed = urlparse(self.path)
            path_parts = parsed.path.strip('/').split('/')
            
            if len(path_parts) != 3:
                self._send_json(404, {"error": "Not found"})
                return
            
            conv_id = path_parts[2]
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            user_id = data.get('userId') or self._get_user_id()
            new_title = data.get('title')
            
            if not user_id or not new_title:
                self._send_json(400, {"error": "Missing required fields"})
                return
            
            conv_ref = db.collection('chats').document(user_id).collection('conversations').document(conv_id)
            conv_ref.update({"title": new_title})
            
            self._send_json(200, {"status": "success"})
            
        except Exception as e:
            self._send_json(500, {"error": str(e)})
    
    def do_DELETE(self):
        """Delete conversation"""
        try:
            db = get_firestore_client()
            if not db:
                self._send_json(500, {"error": "Database not available"})
                return
            
            parsed = urlparse(self.path)
            path_parts = parsed.path.strip('/').split('/')
            
            if len(path_parts) != 3:
                self._send_json(404, {"error": "Not found"})
                return
            
            conv_id = path_parts[2]
            user_id = self._get_user_id()
            
            if not user_id:
                self._send_json(401, {"error": "Unauthorized"})
                return
            
            conv_ref = db.collection('chats').document(user_id).collection('conversations').document(conv_id)
            
            # Delete all messages first
            messages = conv_ref.collection('messages').stream()
            for msg in messages:
                msg.reference.delete()
            
            # Delete conversation
            conv_ref.delete()
            
            self._send_json(200, {"status": "success"})
            
        except Exception as e:
            self._send_json(500, {"error": str(e)})
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-User-Id')
        self.end_headers()
