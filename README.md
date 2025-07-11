# Aksara AI - Chatbot Cerdas Berbasis Gemini

![Aksara AI Demo](https://firebasestorage.googleapis.com/v0/b/chatbot-gemini-bccf8.appspot.com/o/aksara-ai-cover.png?alt=media&token=8624a0d9-9b93-4e78-8370-d5a239f60b45)

**Aksara AI** adalah aplikasi web chatbot interaktif yang dirancang untuk memberikan pengalaman percakapan yang cerdas dan dinamis. Ditenagai oleh model AI generatif canggih dari Google, **Gemini 1.5 Flash**, Aksara AI mampu memahami konteks, menjawab pertanyaan secara mendalam, membantu tugas kreatif, dan bahkan menganalisis gambar yang diunggah oleh pengguna.

Proyek ini dibangun sebagai *Full-Functioning Web Application* yang menunjukkan integrasi antara frontend modern, backend yang kuat, layanan database cloud, dan API kecerdasan buatan.

**[Link Deployment (Vercel)](https://URL_DEPLOYMENT_ANDA)**

---

## 🚀 Fitur Utama

Aksara AI dilengkapi dengan serangkaian fitur lengkap untuk memberikan pengalaman pengguna yang utuh:

* **Autentikasi Pengguna Lengkap:**
    * Registrasi dan Login menggunakan Email/Password.
    * Login mudah dengan akun Google (Google OAuth).
    * Fitur "Lupa Password" untuk pemulihan akun.
    * Manajemen sesi yang aman.

* **Percakapan Cerdas dengan AI:**
    * Interaksi *real-time* dengan model **Google Gemini 1.5 Flash**.
    * Respons yang dihasilkan secara *streaming* untuk pengalaman chat yang lebih cepat.
    * Kemampuan untuk memahami dan mengingat konteks percakapan sebelumnya.

* **Input Multimodal (Teks & Gambar):**
    * Pengguna dapat mengirimkan pertanyaan tidak hanya dalam bentuk teks, tetapi juga dengan **mengunggah gambar** untuk dianalisis oleh AI.

* **Manajemen Riwayat Percakapan (CRUD):**
    * Semua percakapan disimpan secara otomatis di cloud (Firestore).
    * Pengguna dapat melihat daftar riwayat, membuka kembali percakapan lama, mengedit judul percakapan, dan menghapusnya secara permanen.

* **Manajemen Profil Pengguna:**
    * Pengguna dapat mengedit nama dan email mereka.
    * Opsi untuk menghapus akun secara permanen, yang juga akan menghapus semua data terkait.

* **Antarmuka Pengguna Modern & Responsif:**
    * Desain yang bersih, modern, dan dapat beradaptasi di berbagai perangkat (desktop, tablet, dan mobile).
    * Pilihan **Tema Terang & Gelap (Light/Dark Mode)**.
    * Animasi dan transisi yang halus untuk meningkatkan pengalaman pengguna.

* **Fitur Tambahan:**
    * **Input Suara (Speech-to-Text):** Memungkinkan pengguna untuk memberikan perintah suara.
    * **Sistem Masukan (Feedback):** Pengguna dapat mengirimkan saran dan masukan untuk pengembangan aplikasi.
    * **Copy-to-Clipboard:** Mudah menyalin respons dari AI.

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan tumpukan teknologi modern yang terintegrasi untuk menciptakan aplikasi yang andal dan skalabel.

| Kategori      | Teknologi                                                                                                                                                             |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | `HTML5`, `CSS3`, `JavaScript (ES6+)`                                                                                                                                  |
| **Backend** | `Python 3.11`, `Flask`                                                                                                                                                |
| **AI Model** | `Google Gemini 1.5 Flash API`                                                                                                                                         |
| **Database** | `Google Firebase (Firestore)`                                                                                                                                         |
| **Otentikasi**| `Google Firebase (Authentication)`                                                                                                                                    |
| **Deployment**| `Vercel`                                                                                                                                                              |
| **Lainnya** | `Requests`, `Pillow`, `python-dotenv`, `Markdown`                                                                                                                     |

---

## ⚙️ Panduan Setup & Instalasi Lokal

Untuk menjalankan proyek ini di lingkungan lokal Anda, ikuti langkah-langkah berikut:

1.  **Clone Repositori**
    ```bash
    git clone [https://github.com/NAMA_USER_ANDA/NAMA_REPO_ANDA.git](https://github.com/NAMA_USER_ANDA/NAMA_REPO_ANDA.git)
    cd NAMA_REPO_ANDA
    ```

2.  **Buat dan Aktifkan Lingkungan Virtual (Virtual Environment)**
    ```bash
    # Untuk Windows
    python -m venv venv
    .\venv\Scripts\activate

    # Untuk macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependensi Python**
    Semua pustaka yang dibutuhkan tercantum dalam file `requirements.txt`.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Konfigurasi Firebase**
    * Buat sebuah proyek baru di [Firebase Console](https://console.firebase.google.com/).
    * Aktifkan layanan **Authentication** (dengan provider Email/Password dan Google) dan **Firestore**.
    * **Untuk Sisi Server (Backend):**
        * Di Pengaturan Proyek, buka tab *Service Accounts*.
        * Klik "Generate new private key" untuk mengunduh file JSON.
        * Ganti nama file tersebut menjadi `firebase-admin-sdk.json` dan letakkan di direktori utama proyek.
    * **Untuk Sisi Klien (Frontend):**
        * Di Pengaturan Proyek, scroll ke bawah ke bagian "Your apps".
        * Buat aplikasi web baru dan salin konfigurasi Firebase (variabel `firebaseConfig`).
        * Tempel konfigurasi tersebut ke dalam file `static/firebase-config.js`.

5.  **Konfigurasi Environment Variables**
    * Buat file bernama `.env` di direktori utama.
    * Dapatkan kunci API Anda dari [Google AI Studio](https://aistudio.google.com/app/apikey).
    * Isi file `.env` dengan variabel berikut:
    ```
    GEMINI_API_KEY="KUNCI_API_GEMINI_ANDA"
    FLASK_SECRET_KEY="KUNCI_RAHASIA_UNTUK_SESI_FLASK"
    FIREBASE_ADMIN_SDK_JSON='KONTEN_LENGKAP_DARI_FILE_firebase-admin-sdk.json'
    ```
    > **Catatan:** Untuk `FIREBASE_ADMIN_SDK_JSON`, salin seluruh isi dari file `firebase-admin-sdk.json` dan tempel sebagai string.

6.  **Jalankan Aplikasi Flask**
    ```bash
    flask run
    ```
    Aplikasi sekarang akan berjalan di `http://127.0.0.1:5000`.

---

## 🤖 Penjelasan Dukungan AI

Sesuai dengan brief proyek, AI dimanfaatkan dalam dua kapasitas utama: sebagai **akselerator pengembangan** dan sebagai **fitur inti aplikasi**.

### 1. AI sebagai Akselerator Pengembangan

Selama proses pengembangan, saya secara ekstensif menggunakan AI generatif (dalam hal ini, Gemini) untuk mempercepat berbagai tugas, memecahkan masalah, dan mengoptimalkan kode.

* **Pembuatan Kode (Code Generation):**
    * **Boilerplate Backend:** AI membantu membuat struktur dasar untuk *routing* di Flask, seperti membuat fungsi untuk `@app.route('/login')`, `@app.route('/profile')`, dll. Ini menghemat waktu dalam penulisan kode berulang.
    * **Logika Frontend:** Saya meminta AI untuk membuat fungsi-fungsi JavaScript yang kompleks, seperti logika untuk menangani *event listener* pada form, menampilkan/menyembunyikan elemen DOM, dan mengelola status UI.
    * **Contoh Spesifik:** Fungsi `loadConversationsList()` di `script.js` yang mengambil data dari backend dan secara dinamis membuat elemen HTML untuk setiap item riwayat, lengkap dengan *event listener* untuk edit dan klik, awalnya dibuat dengan bantuan AI dan kemudian disesuaikan.

* **Debugging dan Pemecahan Masalah:**
    * Ketika menghadapi *bug*, seperti *error* pada saat menyimpan data ke Firestore atau masalah *rendering* pada CSS, saya memberikan potongan kode yang bermasalah beserta pesan *error* kepada AI. AI mampu menganalisis masalah dan memberikan saran perbaikan yang akurat.
    * **Contoh Spesifik:** Awalnya, ada masalah di mana email pengguna tidak muncul di modal *feedback*. AI membantu mengidentifikasi bahwa variabel untuk elemen DOM tersebut belum dideklarasikan di JavaScript, dan memberikan solusi yang tepat.

* **Optimalisasi dan Refactoring:**
    * AI membantu menyarankan cara-cara untuk membuat kode lebih efisien. Misalnya, mengubah cara pengiriman token dari *form data* menjadi JSON di `auth.js` untuk konsistensi API.
    * AI juga membantu dalam membuat animasi CSS yang halus, seperti animasi `fadeInItem` pada daftar riwayat, lengkap dengan penjelasan `@keyframes` dan `animation-delay`.

### 2. AI sebagai Fitur Inti Aplikasi

Berbeda dari sekadar alat bantu, proyek ini melangkah lebih jauh dengan mengintegrasikan **Google Gemini API** sebagai jantung dari fungsionalitasnya.

* **Pemrosesan Bahasa Alami:** Setiap pesan yang dikirim oleh pengguna diteruskan ke Gemini API. Model AI kemudian menganalisis teks tersebut, memahami maksud dan konteksnya (berdasarkan riwayat percakapan), dan menghasilkan respons yang relevan dan koheren.
* **Kemampuan Multimodal:** Integrasi ini tidak terbatas pada teks. Ketika pengguna mengunggah gambar, gambar tersebut diproses dan dikirim bersama dengan *prompt* teks ke model Gemini, memungkinkan AI untuk "melihat" dan memberikan analisis atau jawaban berdasarkan konten visual.
* **Pengalaman Pengguna Dinamis:** Dengan AI sebagai intinya, setiap interaksi dengan Aksara AI menjadi unik. Aplikasi ini bukan sekadar aplikasi CRUD biasa, melainkan platform percakapan dinamis yang kemampuannya terus berkembang seiring dengan kemajuan model AI yang digunakannya.
