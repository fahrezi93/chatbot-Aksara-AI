document.addEventListener('DOMContentLoaded', () => {
    // ✅ GANTI DENGAN KONFIGURASI FIREBASE ANDA
    const firebaseConfig = {
        apiKey: "AIzaSyCN8AIpL_S-P8UFLx3lxHibiNVdP5el_nY",
        authDomain: "chatbot-gemini-bccf8.firebaseapp.com",
        projectId: "chatbot-gemini-bccf8",
        storageBucket: "chatbot-gemini-bccf8.firebasestorage.app",
        messagingSenderId: "7609111858",
        appId: "1:7609111858:web:20971142e3ac924fb8732b",
        measurementId: "G-ELGM0XYPDF"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    const errorMessageElement = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle-icon');
    const googleSignInBtn = document.getElementById('google-signin-btn');

    if (toggleButton && passwordInput) {
        toggleButton.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleButton.classList.add('visible');
                toggleButton.setAttribute('aria-label', 'Sembunyikan password');
            } else {
                passwordInput.type = 'password';
                toggleButton.classList.remove('visible');
                toggleButton.setAttribute('aria-label', 'Tampilkan password');
            }
        });
    }
    
    function getFriendlyErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/weak-password': return 'Password harus terdiri dari minimal 6 karakter.';
            case 'auth/email-already-in-use': return 'Email ini sudah terdaftar. Silakan login.';
            case 'auth/invalid-email': return 'Format email yang Anda masukkan tidak valid.';
            case 'auth/user-not-found': case 'auth/wrong-password': return 'Email atau password yang Anda masukkan salah.';
            case 'auth/popup-closed-by-user': return 'Jendela login ditutup sebelum selesai.';
            case 'auth/cancelled-popup-request': return 'Beberapa permintaan login dibuka. Coba lagi.';
            default: return 'Terjadi kesalahan. Silakan coba lagi nanti.';
        }
    }

    function handleError(error) {
        // ✅ Tampilkan error lengkap di konsol untuk debugging
        console.error("Firebase Auth Error:", error);
        // Tampilkan pesan yang ramah ke pengguna
        errorMessageElement.textContent = getFriendlyErrorMessage(error.code);
    }

    function sendTokenToBackend(idToken) {
        const formData = new FormData();
        formData.append('id_token', idToken);
        return fetch('/login', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.href = data.redirect;
            } else {
                // Tampilkan error dari backend jika ada
                errorMessageElement.textContent = data.message || "Gagal memverifikasi di server.";
            }
        });
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => result.user.getIdToken())
                .then(idToken => sendTokenToBackend(idToken))
                .catch(handleError); // Gunakan fungsi error yang baru
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            auth.createUserWithEmailAndPassword(document.getElementById('email').value, passwordInput.value)
                .then(() => { window.location.href = '/login'; })
                .catch(handleError); // Gunakan fungsi error yang baru
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            auth.signInWithEmailAndPassword(document.getElementById('email').value, passwordInput.value)
                .then((userCredential) => userCredential.user.getIdToken())
                .then(idToken => sendTokenToBackend(idToken))
                .catch(handleError); // Gunakan fungsi error yang baru
        });
    }
});
