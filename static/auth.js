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
        if (!element) return;
        const friendly = getFriendlyErrorMessage(error && error.code);
        const serverMessage = error && error.message ? error.message : '';
        element.textContent = serverMessage || friendly;
        element.className = 'message-text error-text';
    }

    function showSuccessMessage(message, element = messageElement) {
        if (element) {
            element.textContent = message;
            element.className = 'message-text success-text';
        }
    }

    function sendTokenToBackend(idToken) {
        return fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken })
        })
        .then(async (response) => {
            if (!response.ok) {
                let message = response.statusText;
                try {
                    const data = await response.json();
                    message = data && data.message ? data.message : message;
                } catch (_) {
                    // ignore JSON parse errors
                }
                const err = new Error(message);
                err.code = `http-${response.status}`;
                throw err;
            }
            return response.json();
        })
        .then((data) => {
            if (data.status === 'success') {
                window.location.href = data.redirect;
            } else {
                const err = new Error(data.message || 'Gagal memverifikasi di server.');
                err.code = 'server';
                throw err;
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
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return user.updateProfile({
                        displayName: username
                    });
                })
                .then(() => {
                    window.location.href = '/login';
                })
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

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const email = emailInput.value;
            
            const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            showSuccessMessage("Mengirim link...", messageElement);

            auth.sendPasswordResetEmail(email)
                .then(() => {
                    showSuccessMessage("Link reset password telah dikirim. Silakan periksa inbox atau folder spam Anda.", messageElement);
                    emailInput.value = '';
                })
                .catch((error) => {
                    handleError(error, messageElement);
                })
                .finally(() => {
                    submitButton.disabled = false;
                });
        });
    }
});
