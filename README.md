# Aksara AI Chatbot

Aksara AI adalah chatbot cerdas yang mendukung multiple AI models dengan interface yang modern dan responsif.

## Fitur Utama

### 🤖 Multi-Model AI Support
- **Gemini 2.5 Flash**: Model yang cocok untuk multitasking dan percakapan umum
- **Deepseek R1**: Model yang cocok untuk coding dan tugas teknis

### 🎨 UI/UX Modern
- **Clean & Minimalist Design**: Interface yang bersih dengan flat design
- **Model Selector Dropdown**: Pemilihan model AI yang intuitif dengan highlight biru pada model yang dipilih
- **Responsive Design**: Tampilan yang optimal di desktop dan mobile
- **Dark/Light Mode**: Dukungan tema gelap dan terang
- **Smooth Animations**: Transisi yang halus dan modern

### 💬 Chat Features
- **Real-time Chat**: Percakapan real-time dengan AI
- **Image Upload**: Dukungan upload gambar untuk analisis
- **Voice Input**: Input suara untuk kemudahan penggunaan
- **Chat History**: Riwayat percakapan yang tersimpan
- **Export Chat**: Kemampuan untuk mengekspor percakapan

### 🔐 Authentication
- **User Registration**: Pendaftaran pengguna baru
- **Login/Logout**: Sistem autentikasi yang aman
- **Profile Management**: Manajemen profil pengguna
- **Guest Mode**: Mode tamu tanpa login

## Teknologi

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI Models**: Google Gemini, DeepSeek
- **Styling**: Custom CSS dengan CSS Variables

## Instalasi

1. Clone repository ini
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Setup Firebase configuration di `static/firebase-config.js`
4. Jalankan aplikasi:
   ```bash
   python app.py
   ```

## Struktur Proyek

```
chatbot/
├── app.py                 # Flask application
├── deepseek_api.py        # DeepSeek API integration
├── requirements.txt       # Python dependencies
├── static/               # Static files
│   ├── style.css         # Main stylesheet
│   ├── model-selector.css # Model selector styles
│   ├── model-selector.js  # Model selector logic
│   ├── script.js         # Main JavaScript
│   └── ...               # Other static assets
└── templates/            # HTML templates
    ├── chat.html         # Main chat interface
    ├── login.html        # Login page
    ├── register.html     # Registration page
    └── profile.html      # Profile page
```

## Model Selector Features

### Design Principles
- **Minimalist**: Clean, flat design dengan rounded corners
- **Intuitive**: Highlight biru pada model yang dipilih
- **Responsive**: Adaptif untuk berbagai ukuran layar
- **Accessible**: Keyboard navigation dan screen reader support

### UI Components
- **Model Button**: Menampilkan model yang sedang dipilih dengan ikon dan nama
- **Dropdown Menu**: Daftar model dengan deskripsi masing-masing
- **Hover Effects**: Feedback visual saat interaksi
- **Smooth Animations**: Transisi yang halus saat membuka/menutup dropdown

### Model Options
1. **Gemini 2.5 Flash**
   - Deskripsi: "Model yang cocok untuk multitasking"
   - Ikon: Google Gemini icon
   - Warna: Multi-color gradient

2. **Deepseek R1**
   - Deskripsi: "Model yang cocok untuk coding"
   - Ikon: DeepSeek whale icon
   - Warna: Blue theme

## Contributing

1. Fork repository ini
2. Buat branch untuk fitur baru
3. Commit perubahan Anda
4. Push ke branch
5. Buat Pull Request

## License

MIT License - lihat file LICENSE untuk detail lebih lanjut.
