document.addEventListener('DOMContentLoaded', () => {
    // --- INISIALISASI ---
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Error inisialisasi Firebase:", e);
        return;
    }
    const auth = firebase.auth();

    // --- ELEMEN FORM ---
    const updateNameForm = document.getElementById('update-name-form');
    const updateEmailForm = document.getElementById('update-email-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const nameMessage = document.getElementById('name-message');
    const emailMessage = document.getElementById('email-message');

    // --- ELEMEN HAPUS AKUN ---
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const deleteMessage = document.getElementById('delete-message');


    let currentUser = null;

    // --- FUNGSI BANTU ---
    function showMessage(element, message, isError = false) {
        element.textContent = message;
        element.className = isError ? 'message-text error-text' : 'message-text success-text';
    }
    
    function getFriendlyErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'Format email baru tidak valid.';
            case 'auth/email-already-in-use':
                return 'Email ini sudah digunakan oleh akun lain.';
            case 'auth/requires-recent-login':
                return 'Tindakan ini memerlukan login ulang. Silakan logout dan login kembali.';
            case 'auth/wrong-password':
                return 'Password yang Anda masukkan salah.';
            default:
                return 'Terjadi kesalahan. Silakan coba lagi.';
        }
    }

    // --- LOGIKA UTAMA ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            // Isi form dengan data yang ada
            usernameInput.value = user.displayName || '';
            emailInput.value = user.email || '';
        } else {
            // Jika tidak ada user, redirect ke halaman login
            window.location.href = '/login';
        }
    });

    // --- EVENT LISTENER UPDATE NAMA ---
    if (updateNameForm) {
        updateNameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = usernameInput.value.trim();
            const submitButton = updateNameForm.querySelector('button');
            
            if (newUsername === currentUser.displayName) return;

            submitButton.disabled = true;
            showMessage(nameMessage, 'Menyimpan...');

            try {
                const response = await fetch('/update_username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_username: newUsername })
                });

                const data = await response.json();

                if (response.ok) {
                    await currentUser.updateProfile({ displayName: newUsername });
                    showMessage(nameMessage, 'Nama pengguna berhasil diperbarui!');
                } else {
                    throw new Error(data.message || 'Gagal memperbarui nama.');
                }
            } catch (error) {
                console.error("Error update nama:", error);
                showMessage(nameMessage, error.message, true);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    // --- EVENT LISTENER UPDATE EMAIL ---
    if (updateEmailForm) {
        updateEmailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEmail = emailInput.value.trim();
            const password = document.getElementById('current-password-email').value;
            const submitButton = updateEmailForm.querySelector('button');

            if (newEmail === currentUser.email) return;

            submitButton.disabled = true;
            showMessage(emailMessage, 'Memverifikasi dan menyimpan...');

            try {
                // Re-autentikasi pengguna untuk keamanan
                const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, password);
                await currentUser.reauthenticateWithCredential(credential);

                // Jika berhasil, update email
                await currentUser.updateEmail(newEmail);
                showMessage(emailMessage, 'Email berhasil diperbarui! Silakan cek inbox Anda untuk verifikasi.');

            } catch (error) {
                console.error("Error update email:", error);
                showMessage(emailMessage, getFriendlyErrorMessage(error.code), true);
            } finally {
                submitButton.disabled = false;
                document.getElementById('current-password-email').value = '';
            }
        });
    }

    // --- EVENT LISTENER HAPUS AKUN ---
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            deleteModal.style.display = 'flex';
        });
    }
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            document.getElementById('current-password-delete').value = '';
            showMessage(deleteMessage, '');
        });
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const password = document.getElementById('current-password-delete').value;
            if (!password) {
                showMessage(deleteMessage, 'Password harus diisi untuk konfirmasi.', true);
                return;
            }

            showMessage(deleteMessage, 'Menghapus akun...');
            confirmDeleteBtn.disabled = true;

            try {
                const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, password);
                await currentUser.reauthenticateWithCredential(credential);

                // Kirim request ke backend untuk menghapus data
                const response = await fetch('/delete_account', {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showMessage(deleteMessage, 'Akun berhasil dihapus. Anda akan dialihkan...');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    const data = await response.json();
                    throw new Error(data.message || 'Gagal menghapus akun di server.');
                }

            } catch (error) {
                console.error("Error hapus akun:", error);
                showMessage(deleteMessage, getFriendlyErrorMessage(error.code), true);
            } finally {
                confirmDeleteBtn.disabled = false;
            }
        });
    }
});
