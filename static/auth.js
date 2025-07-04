document.addEventListener('DOMContentLoaded', () => {

    // --- INISIALISASI ---
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Error inisialisasi Firebase. Pastikan firebaseConfig sudah benar.", e);
        return;
    }
    const auth = firebase.auth();

    // --- ELEMEN DOM ---
    const errorMessageElement = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle-icon');
    const googleSignInBtn = document.getElementById('google-signin-btn');

    // --- FUNGSI & EVENT LISTENERS ---
    if (toggleButton && passwordInput) {
        toggleButton.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            toggleButton.classList.toggle('visible', isPassword);
        });
    }
    
    // ✅ FUNGSI PESAN ERROR YANG DIPERBARUI
    function getFriendlyErrorMessage(errorCode) {
        console.log("Menerima kode error:", errorCode); // Untuk debugging
        switch (errorCode) {
            case 'auth/weak-password':
                return 'Password harus terdiri dari minimal 6 karakter.';
            case 'auth/email-already-in-use':
                return 'Email ini sudah terdaftar. Silakan login.';
            case 'auth/invalid-email':
                return 'Format email yang Anda masukkan tidak valid.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
            case 'auth/invalid-login-credentials': // Menambahkan kode error yang spesifik
                return 'Email atau password yang Anda masukkan salah.';
            case 'auth/popup-closed-by-user':
                return 'Jendela login ditutup sebelum selesai.';
            case 'auth/cancelled-popup-request':
                return 'Beberapa permintaan login dibuka. Coba lagi.';
            case 'auth/network-request-failed':
                return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
            default:
                return 'Terjadi kesalahan tidak terduga. Silakan coba lagi nanti.';
        }
    }

    function handleError(error) {
        console.error("Firebase Auth Error:", error);
        if (errorMessageElement) {
            errorMessageElement.textContent = getFriendlyErrorMessage(error.code);
        }
    }

    function sendTokenToBackend(idToken) {
        const formData = new FormData();
        formData.append('id_token', idToken);
        return fetch('/login', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                window.location.href = data.redirect;
            } else {
                throw new Error(data.message || "Gagal memverifikasi di server.");
            }
        });
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => result.user.getIdToken())
                .then(idToken => sendTokenToBackend(idToken))
                .catch(handleError);
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => { window.location.href = '/login'; })
                .catch(handleError);
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => userCredential.user.getIdToken())
                .then(idToken => sendTokenToBackend(idToken))
                .catch(handleError);
        });
    }
});
