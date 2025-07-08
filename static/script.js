document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Firebase
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Error inisialisasi Firebase:", e);
        return;
    }

    let currentUser = null;
    let currentConversationId = null;

    // --- ELEMEN DOM ---
    const body = document.body;
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const historyList = document.getElementById('history-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatForm = document.getElementById('chat-form');
    const initialPromptsContainer = document.getElementById('initial-prompts-container');
    const promptSuggestionsContainer = document.querySelector('.prompt-suggestions');
    const welcomeScreen = document.getElementById('welcome-screen');
    const startChatBtn = document.getElementById('start-chat-btn');
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    const profileBtn = document.getElementById('profile-btn');
    const profileInitial = document.getElementById('profile-initial');
    const profileDropdown = document.getElementById('profile-dropdown');
    const userNameDisplay = document.getElementById('user-name-display');
    const userEmailDisplaySmall = document.getElementById('user-email-display-small');
    const themeToggleButtons = document.querySelectorAll('.theme-toggle-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const menuBtn = document.getElementById('menu-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const micBtn = document.getElementById('mic-btn');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
    const modalButtons = document.querySelector('.modal-buttons');
    const modalLoader = document.getElementById('modal-loader');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removePreviewBtn = document.getElementById('remove-preview-btn');
    const sendBtn = document.getElementById('send-btn');
    const logoutBtnLink = document.getElementById('logout-btn-link');
    const logoutOverlay = document.getElementById('logout-overlay');
    const welcomeUsernameSpan = document.getElementById('welcome-username');
    
    // Elemen untuk modal feedback
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackModalOverlay = document.getElementById('feedback-modal-overlay');
    const cancelFeedbackBtn = document.getElementById('cancel-feedback-btn');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackTextarea = document.getElementById('feedback-textarea');
    const feedbackMessage = document.getElementById('feedback-message');


    let conversationHistory = [];
    let uploadedImageData = null;

    const ALL_PROMPTS = [
        { title: "Buat Draf Email", subtitle: "untuk menindaklanjuti proposal kerjasama", full_prompt: "Buatkan saya draf email profesional untuk menindaklanjuti proposal kerjasama yang saya kirim minggu lalu." },
        { title: "Rangkum Teks Ini", subtitle: "menjadi 5 poin utama", full_prompt: "Tolong rangkum teks berikut menjadi 5 poin utama: [tempel teks di sini]" },
        { title: "Ide Nama Brand", subtitle: "untuk produk fashion ramah lingkungan", full_prompt: "Berikan 10 ide nama brand yang menarik untuk produk fashion yang ramah lingkungan." },
        { title: "Susun Rencana Proyek", subtitle: "untuk peluncuran aplikasi mobile", full_prompt: "Bantu saya menyusun kerangka rencana proyek untuk peluncuran aplikasi mobile, mulai dari riset hingga pemasaran." },
        { title: "Latihan Wawancara Kerja", subtitle: "untuk posisi Digital Marketing", full_prompt: "Mari kita latihan wawancara kerja. Ajukan saya pertanyaan umum untuk posisi Digital Marketing." },
        { title: "Buat Jadwal Mingguan", subtitle: "untuk menyeimbangkan kerja dan olahraga", full_prompt: "Buatkan saya contoh jadwal mingguan yang seimbang antara pekerjaan full-time dan rutinitas olahraga 3 kali seminggu." },
        { title: "Analisis SWOT", subtitle: "untuk ide bisnis kedai kopi", full_prompt: "Lakukan analisis SWOT (Strengths, Weaknesses, Opportunities, Threats) untuk ide bisnis kedai kopi di area perkantoran." },
        { title: "Tulis Deskripsi Produk", subtitle: "untuk sebuah jam tangan pintar", full_prompt: "Tulis deskripsi produk yang menjual untuk sebuah jam tangan pintar dengan fitur monitor detak jantung dan GPS." },
        { title: "Buat Agenda Rapat", subtitle: "untuk kickoff proyek baru", full_prompt: "Buatkan agenda rapat yang efektif untuk kickoff proyek pengembangan website baru." },
        { title: "Ide Ice Breaking", subtitle: "untuk workshop online", full_prompt: "Berikan saya 3 ide ice breaking yang seru dan tidak canggung untuk workshop yang diadakan secara online." },
        { title: "Tulis Puisi", subtitle: "tentang hujan di perkotaan", full_prompt: "Tuliskan sebuah puisi tentang suasana hujan di tengah hiruk pikuk perkotaan." },
        { title: "Buat Cerita Pendek", subtitle: "tentang robot yang punya perasaan", full_prompt: "Buat cerita pendek tentang robot pembersih yang tiba-tiba bisa merasakan emosi." },
        { title: "Ide Judul Artikel", subtitle: "tentang manfaat meditasi", full_prompt: "Berikan 5 ide judul artikel yang menarik (clickbait) tentang manfaat meditasi untuk pemula." },
        { title: "Kembangkan Plot Cerita", subtitle: "dari premis: detektif di zaman Majapahit", full_prompt: "Saya punya premis: seorang detektif di era Kerajaan Majapahit. Bantu kembangkan plot ceritanya." },
        { title: "Buat Lirik Lagu", subtitle: "bertema persahabatan jarak jauh", full_prompt: "Tolong buatkan lirik lagu pop yang menyentuh tentang persahabatan jarak jauh." },
        { title: "Deskripsikan Lukisan", subtitle: "'The Starry Night' karya Van Gogh", full_prompt: "Deskripsikan lukisan 'The Starry Night' karya Vincent van Gogh seolah-olah saya belum pernah melihatnya." },
        { title: "Buat Naskah Iklan", subtitle: "untuk produk minuman energi alami", full_prompt: "Tulis naskah singkat untuk iklan video berdurasi 30 detik yang mempromosikan minuman energi dari bahan alami." },
        { title: "Tulis Dialog Film", subtitle: "antara pahlawan super dan musuhnya", full_prompt: "Tulis sebuah dialog tegang antara seorang pahlawan super yang idealis dengan musuh bebuyutannya yang sinis." },
        { title: "Ide Slogan", subtitle: "untuk kampanye 'kurangi sampah plastik'", full_prompt: "Berikan 10 ide slogan yang kuat dan mudah diingat untuk kampanye 'kurangi sampah plastik'." },
        { title: "Buat Sinopsis Novel", subtitle: "genre fantasi petualangan", full_prompt: "Tulis sinopsis singkat untuk sebuah novel fantasi tentang pencarian artefak kuno di dunia yang hilang." },
        { title: "Jelaskan Konsep", subtitle: "tentang black hole dengan analogi sederhana", full_prompt: "Jelaskan konsep black hole (lubang hitam) menggunakan analogi yang mudah dipahami orang awam." },
        { title: "Bandingkan Dua Tokoh", subtitle: "antara Soekarno dan Hatta", full_prompt: "Bandingkan gaya kepemimpinan dan peran antara Soekarno dan Mohammad Hatta dalam kemerdekaan Indonesia." },
        { title: "Sejarah Singkat", subtitle: "penemuan internet", full_prompt: "Ceritakan sejarah singkat penemuan internet, mulai dari ARPANET hingga World Wide Web." },
        { title: "Bagaimana Cara Kerja", subtitle: "vaksin mRNA?", full_prompt: "Jelaskan bagaimana cara kerja vaksin berbasis mRNA seperti Pfizer atau Moderna." },
        { title: "Fakta Menarik", subtitle: "tentang lautan dalam", full_prompt: "Berikan saya 5 fakta menarik yang jarang diketahui tentang kehidupan di laut dalam." },
        { title: "Proses Terjadinya", subtitle: "gerhana matahari total", full_prompt: "Jelaskan secara sederhana proses terjadinya gerhana matahari total." },
        { title: "Apa itu Blockchain?", subtitle: "jelaskan untuk pemula", full_prompt: "Apa itu teknologi blockchain? Jelaskan cara kerjanya seperti untuk seorang pemula." },
        { title: "Perbedaan Utama", subtitle: "antara sel hewan dan sel tumbuhan", full_prompt: "Apa saja perbedaan utama antara sel hewan dan sel tumbuhan? Jelaskan dalam bentuk tabel." },
        { title: "Ringkas Teori", subtitle: "Relativitas Khusus Einstein", full_prompt: "Ringkas poin-poin utama dari Teori Relativitas Khusus yang dikemukakan oleh Albert Einstein." },
        { title: "Siapa itu Ibnu Sina?", subtitle: "dan apa kontribusinya bagi dunia?", full_prompt: "Siapakah Ibnu Sina dan apa saja kontribusi terpentingnya bagi dunia kedokteran dan filsafat?" },
        { title: "Rencana Perjalanan", subtitle: "hemat 3 hari di Bali", full_prompt: "Buatkan saya rencana perjalanan hemat selama 3 hari di Bali untuk backpacker." },
        { title: "Rekomendasi Film", subtitle: "genre thriller psikologis", full_prompt: "Beri saya 5 rekomendasi film genre thriller psikologis yang menegangkan." },
        { title: "Ide Resep Sehat", subtitle: "untuk sarapan di bawah 15 menit", full_prompt: "Berikan 3 ide resep sarapan sehat dan praktis yang bisa dibuat dalam waktu kurang dari 15 menit." },
        { title: "Tips Berkebun", subtitle: "untuk pemula di lahan sempit", full_prompt: "Apa saja tips penting untuk mulai berkebun sayuran bagi pemula yang hanya punya balkon apartemen?" },
        { title: "Buat Lelucon", subtitle: "tentang programmer", full_prompt: "Buatkan sebuah lelucon singkat tentang kehidupan seorang programmer." },
        { title: "Rekomendasi Buku", subtitle: "novel fiksi ilmiah klasik", full_prompt: "Rekomendasikan 3 buku novel fiksi ilmiah klasik yang wajib dibaca." },
        { title: "Rencana Latihan Fisik", subtitle: "di rumah tanpa alat", full_prompt: "Buatkan rencana latihan fisik sederhana selama 20 menit yang bisa dilakukan di rumah tanpa alat." },
        { title: "Daftar Putar Lagu", subtitle: "untuk menemani saat hujan", full_prompt: "Buatkan saya daftar putar berisi 10 lagu yang cocok untuk didengarkan saat hujan." },
        { title: "Ide Kado Ulang Tahun", subtitle: "untuk sahabat wanita yang suka traveling", full_prompt: "Berikan 5 ide kado ulang tahun yang unik dan bermanfaat untuk sahabat wanita yang hobi traveling." },
        { title: "Review Singkat Game", subtitle: "'The Witcher 3'", full_prompt: "Tulis sebuah review singkat tentang game 'The Witcher 3: Wild Hunt' dari sudut pandang pemain baru." }
    ];

    // --- MANAJEMEN UI & AUTH ---
    function setupGuestUI() {
        body.classList.remove('user-logged-in');
        welcomeScreen.classList.remove('visible');
        guestActions.style.display = 'flex';
        userActions.style.display = 'none';
        chatBox.innerHTML = '';
        appendMessage("<p>Selamat datang! Silakan <a href='/login'>masuk</a> atau <a href='/register'>daftar</a> untuk menyimpan riwayat obrolan Anda.</p>", "bot-message", false, new Date());
        conversationHistory = [];
        updateClearChatButtonState();
        hideInitialPrompts();
    }

    function setupUserUI(user) {
        body.classList.add('user-logged-in');
        welcomeScreen.classList.add('visible');
        guestActions.style.display = 'none';
        userActions.style.display = 'flex';
        
        const nameToUse = user.user_full_name || user.email;
        const initial = nameToUse ? nameToUse.charAt(0).toUpperCase() : '?';
        
        profileInitial.textContent = initial;
        if (userNameDisplay) {
            userNameDisplay.textContent = nameToUse;
        }
        if (userEmailDisplaySmall) {
            userEmailDisplaySmall.textContent = user.email;
        }

        if (welcomeUsernameSpan) {
            welcomeUsernameSpan.textContent = `Hi ${user.username}, `;
        }
    }

    async function checkAuthState() {
        try {
            const response = await fetch('/check_auth');
            const data = await response.json();
            currentUser = data.logged_in ? { 
                email: data.email, 
                username: data.username,
                user_full_name: data.user_full_name 
            } : null;
            if (currentUser) {
                setupUserUI(currentUser);
            } else {
                setupGuestUI();
            }
        } catch (error) {
            console.error("Gagal memeriksa status autentikasi:", error);
            setupGuestUI();
        } finally {    
            body.classList.add('loaded');
        }
    }

    function toggleSidebar() {
        body.classList.toggle('sidebar-visible');
    }

    function updateClearChatButtonState() {
        if (clearChatBtn) {
            clearChatBtn.disabled = !currentConversationId;
            clearChatBtn.style.opacity = currentConversationId ? '1' : '0.5';
            clearChatBtn.style.cursor = currentConversationId ? 'pointer' : 'not-allowed';
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function showInitialPrompts() {
        if (initialPromptsContainer && promptSuggestionsContainer) {
            shuffleArray(ALL_PROMPTS);
            const selectedPrompts = ALL_PROMPTS.slice(0, 4);
            
            promptSuggestionsContainer.innerHTML = '';
            selectedPrompts.forEach(prompt => {
                promptSuggestionsContainer.innerHTML += `
                    <div class="prompt-card" data-prompt="${prompt.full_prompt}">
                        <h3>${prompt.title}</h3>
                        <p>${prompt.subtitle}</p>
                    </div>
                `;
            });

            initialPromptsContainer.classList.add('visible');
        }
    }

    function hideInitialPrompts() {
        if (initialPromptsContainer) {
            initialPromptsContainer.classList.remove('visible');
        }
    }

    async function loadConversationsList() {
        if (!currentUser) return;
        try {
            const response = await fetch('/get_conversations');
            const conversations = await response.json();
            historyList.innerHTML = '';
            if (conversations.length > 0) {
                conversations.forEach(conv => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.dataset.conversationId = conv.id;

                    const titleContainer = document.createElement('span');
                    titleContainer.className = 'history-title-container';
                    titleContainer.textContent = conv.title;
                    
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-title-btn';
                    editBtn.innerHTML = '✏️';
                    
                    historyItem.appendChild(titleContainer);
                    historyItem.appendChild(editBtn);
                    historyList.appendChild(historyItem);
                });
            } else {
                historyList.innerHTML = '<p class="history-placeholder">Belum ada riwayat.</p>';
            }
        } catch (error) {
            console.error("Gagal memuat daftar percakapan:", error);
        }
    }

    async function loadConversation(conversationId) {
        if (!currentUser) return;
        hideInitialPrompts();
        currentConversationId = conversationId;
        conversationHistory = [];
        chatBox.innerHTML = '';

        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.conversationId === conversationId);
        });
        updateClearChatButtonState();

        try {
            const response = await fetch(`/get_conversation/${conversationId}`);
            const messages = await response.json();
            messages.forEach(msg => {
                let content = msg.htmlContent;
                if (msg.imageData) {
                    content = `<img src="${msg.imageData}" class="message-image" alt="Gambar terlampir"><br>` + content;
                }
                const timestamp = msg.timestamp && msg.timestamp._seconds ? new Date(msg.timestamp._seconds * 1000) : new Date();
                appendMessage(content, msg.isUser ? 'user-message' : 'bot-message', false, timestamp, msg.text);
                conversationHistory.push({ isUser: msg.isUser, text: msg.text });
            });
        } catch (error) {
            console.error(`Gagal memuat percakapan ${conversationId}:`, error);
        }

        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    }
    
    function startNewChat() {
        currentConversationId = null;
        conversationHistory = [];
        chatBox.innerHTML = '';
        showInitialPrompts();
        document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
        userInput.focus();
        updateClearChatButtonState();
        if (window.innerWidth <= 768 && body.classList.contains('sidebar-visible')) {
            toggleSidebar();
        }
    }

    async function submitAndGetResponse(userMessageText, imageToSend) {
        hideInitialPrompts();

        const userMessages = document.querySelectorAll('.user-message');
        if (userMessages.length > 0) {
            let userMessageFound = false;
            Array.from(userMessages).reverse().forEach(msg => {
                if (userMessageFound) {
                    const nextBotMsg = msg.nextElementSibling;
                    if (nextBotMsg && nextBotMsg.classList.contains('bot-message')) {
                        nextBotMsg.remove();
                    }
                    msg.remove();
                }
                if (msg.dataset.originalText === userMessageText) {
                    userMessageFound = true;
                }
            });
        }

        const botMessageElement = createBotMessageElement();
        const typingIndicator = showTypingIndicator(botMessageElement);
        let fullResponseText = "";

        try {
            const response = await fetch("/send_message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessageText,
                    history: conversationHistory.slice(0, -1),
                    imageData: imageToSend
                })
            });

            if (!response.ok) throw new Error("Gagal mendapatkan respons dari server.");
            typingIndicator.remove();
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                fullResponseText += decoder.decode(value, { stream: true });
                botMessageElement.querySelector(".content-wrapper").innerHTML = marked.parse(fullResponseText);
                scrollToBottom();
            }

            const finalHtml = marked.parse(fullResponseText);
            botMessageElement.querySelector(".content-wrapper").innerHTML = finalHtml;
            
            const botMessageData = { isUser: false, text: fullResponseText, htmlContent: finalHtml };
            await saveMessageToDb(botMessageData);
            conversationHistory.push({ isUser: false, text: fullResponseText });
            addCopyToBotMessage(botMessageElement);

        } catch (error) {
            console.error("Error:", error);
            if(typingIndicator) typingIndicator.remove();
            botMessageElement.querySelector(".content-wrapper").innerHTML = "<p>Maaf, terjadi kesalahan.</p>";
        }
    }

    async function handleFormSubmit(e) {
        if (e) e.preventDefault();
        const userMessageText = userInput.value.trim();
        
        if (userMessageText === "" && !uploadedImageData) return;

        let userHtmlContent = `<p>${userMessageText}</p>`;
        if (uploadedImageData) {
            userHtmlContent = `<img src="${uploadedImageData}" class="message-image" alt="Gambar terlampir"><br>` + userHtmlContent;
        }

        appendMessage(userHtmlContent, 'user-message', false, new Date(), userMessageText);
        
        const userMessageData = { 
            isUser: true, 
            text: userMessageText, 
            htmlContent: `<p>${userMessageText}</p>`,
            imageData: uploadedImageData
        };
        
        conversationHistory.push({ isUser: true, text: userMessageText });
        
        const imageToSend = uploadedImageData;
        uploadedImageData = null;
        imagePreviewContainer.style.display = 'none';
        fileInput.value = '';
        userInput.value = "";
        userInput.focus();

        const savedUserData = await saveMessageToDb(userMessageData);
        if (savedUserData && savedUserData.conversationId) {
            currentConversationId = savedUserData.conversationId;
            updateClearChatButtonState();
        }

        await submitAndGetResponse(userMessageText, imageToSend);
    }

    async function saveMessageToDb(messageData) {
        if (!currentUser) return null;
        try {
            const response = await fetch('/save_message', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    conversationId: currentConversationId,
                    messageData: messageData 
                }) 
            });
            const data = await response.json();
            if (data.status === 'success') {
                if (!currentConversationId && data.conversationId) {
                    loadConversationsList();
                }
                return data;
            }
            return null;
        } catch (error) {
            console.error("Gagal menyimpan pesan:", error);
            return null;
        }
    }
    
    if (chatForm) chatForm.addEventListener('submit', handleFormSubmit);
    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            welcomeScreen.classList.remove('visible');
            if (currentUser) {
                loadConversationsList();
                startNewChat();
            }
        });
    }
    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => fileInput.click());
    }
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedImageData = e.target.result;
                    imagePreview.src = uploadedImageData;
                    imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', () => {
            uploadedImageData = null;
            imagePreviewContainer.style.display = 'none';
            fileInput.value = '';
        });
    }

    if (historyList) {
        historyList.addEventListener('click', (e) => {
            const historyItem = e.target.closest('.history-item');
            if (!historyItem) return;

            const convId = historyItem.dataset.conversationId;

            if (e.target.classList.contains('edit-title-btn')) {
                e.stopPropagation();
                const titleContainer = historyItem.querySelector('.history-title-container');
                
                let input = historyItem.querySelector('.history-title-input');
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'history-title-input';
                    historyItem.insertBefore(input, titleContainer);
                }

                input.value = titleContainer.textContent;
                titleContainer.style.display = 'none';
                input.style.display = 'block';
                input.focus();

                const saveTitle = async () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== titleContainer.textContent) {
                        try {
                            const response = await fetch(`/update_title/${convId}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title: newTitle })
                            });
                            if (response.ok) {
                                titleContainer.textContent = newTitle;
                            }
                        } catch (error) {
                            console.error("Gagal update judul:", error);
                        }
                    }
                    input.style.display = 'none';
                    titleContainer.style.display = 'block';
                };

                input.addEventListener('blur', saveTitle, { once: true });
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        input.blur();
                    } else if (event.key === 'Escape') {
                        input.style.display = 'none';
                        titleContainer.style.display = 'block';
                        input.removeEventListener('blur', saveTitle);
                    }
                });

            } else {
                if (convId) loadConversation(convId);
            }
        });
    }

    if (initialPromptsContainer) {
        initialPromptsContainer.addEventListener('click', (e) => {
            const promptCard = e.target.closest('.prompt-card');
            if (promptCard) {
                const promptText = promptCard.dataset.prompt;
                userInput.value = promptText;
                handleFormSubmit(new Event('submit'));
            }
        });
    }

    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            if (!clearChatBtn.disabled) {
                modalLoader.style.display = 'none';
                modalButtons.style.display = 'flex';
                modalOverlay.classList.add("visible");
            }
        });
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            if (!currentConversationId || !currentUser) {
                modalOverlay.classList.remove("visible");
                return;
            }
            modalLoader.style.display = 'block';
            modalButtons.style.display = 'none';
            try {
                const response = await fetch(`/delete_conversation/${currentConversationId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                if (response.ok && data.status === 'success') {
                    const historyItemToRemove = historyList.querySelector(`[data-conversation-id="${currentConversationId}"]`);
                    if (historyItemToRemove) {
                        historyItemToRemove.remove();
                    }
                    startNewChat();
                } else {
                    console.error("Gagal menghapus percakapan:", data.message);
                }
            } catch (error) {
                console.error("Error saat fetch hapus:", error);
            } finally {
                modalOverlay.classList.remove("visible");
            }
        });
    }
    if (cancelBtn) cancelBtn.addEventListener("click", () => modalOverlay.classList.remove("visible"));
    if (modalOverlay) modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove("visible"); });
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profileDropdown) profileDropdown.classList.toggle('show');
        });
    }
    
    if (logoutBtnLink) {
        logoutBtnLink.addEventListener('click', (e) => {
            e.preventDefault();
            const logoutUrl = logoutBtnLink.href;
            
            if (logoutOverlay) {
                logoutOverlay.classList.add('visible');
            }

            setTimeout(() => {
                window.location.href = logoutUrl;
            }, 2000);
        });
    }
    
    window.addEventListener('click', (e) => {
        if (profileBtn && !profileBtn.contains(e.target) && profileDropdown) {
            profileDropdown.classList.remove('show');
        }
    });
    if (themeToggleButtons) {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            body.classList.add(savedTheme);
        }
        themeToggleButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                body.classList.toggle("dark-mode");
                localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark-mode" : "");
            });
        });
    }
    if (chatBox && scrollToBottomBtn) {
        chatBox.addEventListener("scroll", () => {
            const isScrolledUp = chatBox.scrollHeight - chatBox.scrollTop > chatBox.clientHeight + 200;
            scrollToBottomBtn.classList.toggle("visible", isScrolledUp);
        });
        scrollToBottomBtn.addEventListener("click", () => scrollToBottom(true));
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && micBtn) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'id-ID';
        recognition.interimResults = false;
        micBtn.addEventListener("click", () => {
            micBtn.classList.contains("recording") ? recognition.stop() : recognition.start();
        });
        recognition.onstart = () => micBtn.classList.add("recording");
        recognition.onend = () => micBtn.classList.remove("recording");
        recognition.onresult = (event) => {
            userInput.value = event.results[0][0].transcript;
            handleFormSubmit(new Event('submit', { bubbles: true }));
        };
        recognition.onerror = (event) => console.error("Speech recognition error:", event.error);
    } else if (micBtn) {
        micBtn.style.display = "none";
    }

    chatBox.addEventListener('click', (e) => {
        if (e.target.closest('.edit-prompt-btn')) {
            const editBtn = e.target.closest('.edit-prompt-btn');
            const messageElement = editBtn.closest('.message');
            const contentWrapper = messageElement.querySelector('.content-wrapper');
            const originalText = messageElement.dataset.originalText;

            contentWrapper.style.display = 'none';
            editBtn.style.display = 'none';

            const editArea = document.createElement('div');
            editArea.className = 'edit-area';
            editArea.innerHTML = `
                <textarea>${originalText}</textarea>
                <div class="edit-area-buttons">
                    <button class="cancel-edit-btn">Batal</button>
                    <button class="save-edit-btn">Simpan & Kirim</button>
                </div>
            `;
            messageElement.appendChild(editArea);

            const textarea = editArea.querySelector('textarea');
            textarea.focus();
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';

            editArea.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                editArea.remove();
                contentWrapper.style.display = 'block';
            });

            editArea.querySelector('.save-edit-btn').addEventListener('click', () => {
                const newText = textarea.value.trim();
                if (newText && newText !== originalText) {
                    contentWrapper.innerHTML = `<p>${newText}</p>`;
                    messageElement.dataset.originalText = newText;

                    const messageIndex = Array.from(chatBox.children).indexOf(messageElement);
                    if (conversationHistory[messageIndex]) {
                        conversationHistory[messageIndex].text = newText;
                    }

                    let nextMsg = messageElement.nextElementSibling;
                    while(nextMsg) {
                        let toRemove = nextMsg;
                        nextMsg = nextMsg.nextElementSibling;
                        toRemove.remove();
                    }
                    
                    submitAndGetResponse(newText, null);
                }
                editArea.remove();
                contentWrapper.style.display = 'block';
            });
        }
    });
    
    // --- PERBAIKAN LOGIKA FEEDBACK ---
    function openFeedbackModal() {
        if (feedbackModalOverlay) {
            // Mengubah style display untuk memunculkan modal
            feedbackModalOverlay.style.display = 'flex';
            
            // Reset form
            feedbackTextarea.value = '';
            feedbackMessage.textContent = '';
            feedbackMessage.className = 'message-text';
            const submitBtn = document.getElementById('submit-feedback-btn');
            if(submitBtn) submitBtn.disabled = false;
        }
    }

    function closeFeedbackModal() {
        if (feedbackModalOverlay) {
            // Mengubah style display untuk menyembunyikan modal
            feedbackModalOverlay.style.display = 'none';
        }
    }

    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', openFeedbackModal);
    }

    if (cancelFeedbackBtn) {
        cancelFeedbackBtn.addEventListener('click', closeFeedbackModal);
    }

    if (feedbackModalOverlay) {
        feedbackModalOverlay.addEventListener('click', (e) => {
            // Pastikan klik terjadi pada overlay, bukan pada modal di dalamnya
            if (e.target === feedbackModalOverlay) {
                closeFeedbackModal();
            }
        });
    }

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedbackText = feedbackTextarea.value.trim();
            if (!feedbackText) return;

            const submitBtn = document.getElementById('submit-feedback-btn');
            submitBtn.disabled = true;
            feedbackMessage.textContent = 'Mengirim...';
            feedbackMessage.className = 'message-text';

            try {
                const response = await fetch('/submit_feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedback: feedbackText })
                });
                const data = await response.json();

                if (response.ok) {
                    feedbackMessage.textContent = 'Terima kasih! Masukan Anda telah terkirim.';
                    feedbackMessage.className = 'message-text success-text';
                    setTimeout(() => {
                        closeFeedbackModal();
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Gagal mengirim masukan.');
                }
            } catch (error) {
                feedbackMessage.textContent = error.message;
                feedbackMessage.className = 'message-text error-text';
                submitBtn.disabled = false; // Aktifkan kembali tombol jika terjadi error
            }
        });
    }
    // --- AKHIR PERBAIKAN ---

    function appendMessage(content, className, isTextContent, timestamp, originalText = '') {
        const messageElement = document.createElement("div");
        messageElement.className = `message ${className}`;
        
        if (className === 'user-message') {
            messageElement.dataset.originalText = originalText;
        }

        const contentWrapper = document.createElement("div");
        contentWrapper.className = "content-wrapper";
        if (isTextContent) {
            const p = document.createElement("p");
            p.textContent = content;
            contentWrapper.appendChild(p);
        } else {
            contentWrapper.innerHTML = content;
        }
        messageElement.appendChild(contentWrapper);
        appendTimestamp(messageElement, timestamp);
        
        if (className === 'user-message') {
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-prompt-btn';
            editBtn.innerHTML = '✏️';
            editBtn.setAttribute('data-tooltip', 'Edit & kirim ulang');
            messageElement.appendChild(editBtn);
        }

        if (className === 'bot-message' && content && content.length > 1) {
            addCopyToBotMessage(messageElement);
        }
        chatBox.appendChild(messageElement);
        scrollToBottom();
    }
    function createBotMessageElement() {
        const messageElement = document.createElement("div");
        messageElement.className = "message bot-message";
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "content-wrapper";
        messageElement.appendChild(contentWrapper);
        appendTimestamp(messageElement, new Date());
        chatBox.appendChild(messageElement);
        scrollToBottom();
        return messageElement;
    }
    function showTypingIndicator(botMessageElement) {
        const indicator = document.createElement("div");
        indicator.className = "typing-indicator";
        indicator.innerHTML = `<span></span><span></span><span></span>`;
        botMessageElement.querySelector(".content-wrapper").appendChild(indicator);
        scrollToBottom();
        return indicator;
    }
    function appendTimestamp(messageElement, timestamp) {
        const timeString = timestamp.getHours().toString().padStart(2, '0') + ':' + timestamp.getMinutes().toString().padStart(2, '0');
        const timestampElement = document.createElement("span");
        timestampElement.className = "message-timestamp";
        timestampElement.textContent = timeString;
        messageElement.appendChild(timestampElement);
    }
    function addCopyToBotMessage(botMessageElement) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.setAttribute("aria-label", "Salin pesan");
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyBtn.addEventListener("click", () => {
            const contentToCopy = botMessageElement.querySelector(".content-wrapper").innerText;
            navigator.clipboard.writeText(contentToCopy).then(() => {
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                }, 1500);
            });
        });
        botMessageElement.appendChild(copyBtn);
    }
    function scrollToBottom(smooth = false) {
        if (smooth) {
            chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
        } else {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
    
    checkAuthState();
});
