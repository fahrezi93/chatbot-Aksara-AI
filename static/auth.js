document.addEventListener('DOMContentLoaded', () => {
    // --- INISIALISASI ---
    try {
        // Firebase sudah diinisialisasi di firebase-config.js
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
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
            case 'auth/too-many-requests':
                return 'Terlalu banyak percobaan login. Domain belum diauthorize di Firebase. Tunggu beberapa menit atau hubungi admin.';
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
        // Tambahkan delay untuk mengatasi clock skew
        return new Promise(resolve => setTimeout(resolve, 3000))
            .then(() => fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: idToken })
            }))
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
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            // Gunakan popup dengan error handling yang lebih baik
            auth.signInWithPopup(provider)
                .then((result) => {
                    return result.user.getIdToken();
                })
                .then(idToken => {
                    return sendTokenToBackend(idToken);
                })
                .catch((error) => {
                    // Handle specific popup errors
                    if (error.code === 'auth/popup-blocked') {
                        alert('Popup diblokir browser. Silakan izinkan popup untuk login dengan Google.');
                    } else if (error.code === 'auth/popup-closed-by-user') {
                        // User closed popup, no need to show error
                        return;
                    } else {
                        handleError(error);
                    }
                });
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
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Memproses...';
            
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    return userCredential.user.getIdToken();
                })
                .then(idToken => {
                    return sendTokenToBackend(idToken);
                })
                .catch((error) => {
                    handleError(error);
                })
                .finally(() => {
                    // Reset button state
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                });
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
