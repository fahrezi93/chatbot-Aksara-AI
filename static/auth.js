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
    // ✅ ELEMEN BARU UNTUK LUPA PASSWORD
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const messageElement = document.getElementById('message-element');


    // --- FUNGSI & EVENT LISTENERS ---
    if (toggleButton && passwordInput) {
        toggleButton.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            toggleButton.classList.toggle('visible', isPassword);
        });
    }
    
    function getFriendlyErrorMessage(errorCode) {
        console.log("Menerima kode error:", errorCode);
        switch (errorCode) {
            case 'auth/weak-password':
                return 'Password harus terdiri dari minimal 6 karakter.';
            case 'auth/email-already-in-use':
                return 'Email ini sudah terdaftar. Silakan login.';
            case 'auth/invalid-email':
                return 'Format email yang Anda masukkan tidak valid.';
            case 'auth/user-not-found':
                return 'Email tidak terdaftar. Periksa kembali email Anda.';
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
            case 'auth/invalid-login-credentials':
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

    function handleError(error, element = errorMessageElement) {
        console.error("Firebase Auth Error:", error);
        if (element) {
            element.textContent = getFriendlyErrorMessage(error.code);
            element.className = 'message-text error-text';
        }
    }

    function showSuccessMessage(message, element = messageElement) {
        if (element) {
            element.textContent = message;
            element.className = 'message-text success-text';
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

    // ✅ LOGIKA BARU UNTUK RESET PASSWORD
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const email = emailInput.value;
            
            // Tampilkan pesan loading dan nonaktifkan tombol
            const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            showSuccessMessage("Mengirim link...", messageElement);

            auth.sendPasswordResetEmail(email)
                .then(() => {
                    showSuccessMessage("Link reset password telah dikirim. Silakan periksa inbox atau folder spam Anda.", messageElement);
                    emailInput.value = ''; // Kosongkan input setelah berhasil
                })
                .catch((error) => {
                    handleError(error, messageElement);
                })
                .finally(() => {
                    // Aktifkan kembali tombol setelah selesai
                    submitButton.disabled = false;
                });
        });
    }
});
