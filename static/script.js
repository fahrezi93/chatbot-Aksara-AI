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
    const userEmailDisplay = document.getElementById('user-email-display');
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

    let conversationHistory = [];
    let uploadedImageData = null;

    // ✅ BANK SOAL DIPERBANYAK
    const ALL_PROMPTS = [
        // Produktivitas & Profesional
        { title: "Buat Draf Email", subtitle: "untuk menindaklanjuti proposal kerjasama", full_prompt: "Buatkan saya draf email profesional untuk menindaklanjuti proposal kerjasama yang saya kirim minggu lalu." },
        { title: "Rangkum Teks Ini", subtitle: "menjadi 5 poin utama", full_prompt: "Tolong rangkum teks berikut menjadi 5 poin utama: [tempel teks di sini]" },
        { title: "Ide Nama Brand", subtitle: "untuk produk fashion ramah lingkungan", full_prompt: "Berikan 10 ide nama brand yang menarik untuk produk fashion yang ramah lingkungan." },
        { title: "Susun Rencana Proyek", subtitle: "untuk peluncuran aplikasi mobile", full_prompt: "Bantu saya menyusun kerangka rencana proyek untuk peluncuran aplikasi mobile, mulai dari riset hingga pemasaran." },
        { title: "Latihan Wawancara Kerja", subtitle: "untuk posisi Digital Marketing", full_prompt: "Mari kita latihan wawancara kerja. Ajukan saya pertanyaan umum untuk posisi Digital Marketing." },

        // Kreativitas & Menulis
        { title: "Tulis Puisi", subtitle: "tentang hujan di perkotaan", full_prompt: "Tuliskan sebuah puisi tentang suasana hujan di tengah hiruk pikuk perkotaan." },
        { title: "Buat Cerita Pendek", subtitle: "tentang robot yang punya perasaan", full_prompt: "Buat cerita pendek tentang robot pembersih yang tiba-tiba bisa merasakan emosi." },
        { title: "Ide Judul Artikel", subtitle: "tentang manfaat meditasi", full_prompt: "Berikan 5 ide judul artikel yang menarik (clickbait) tentang manfaat meditasi untuk pemula." },
        { title: "Kembangkan Plot Cerita", subtitle: "dari premis: detektif di zaman Majapahit", full_prompt: "Saya punya premis: seorang detektif di era Kerajaan Majapahit. Bantu kembangkan plot ceritanya." },
        { title: "Buat Lirik Lagu", subtitle: "bertema persahabatan jarak jauh", full_prompt: "Tolong buatkan lirik lagu pop yang menyentuh tentang persahabatan jarak jauh." },

        // Edukasi & Pengetahuan
        { title: "Jelaskan Konsep", subtitle: "tentang black hole dengan analogi sederhana", full_prompt: "Jelaskan konsep black hole (lubang hitam) menggunakan analogi yang mudah dipahami orang awam." },
        { title: "Bandingkan Dua Tokoh", subtitle: "antara Soekarno dan Hatta", full_prompt: "Bandingkan gaya kepemimpinan dan peran antara Soekarno dan Mohammad Hatta dalam kemerdekaan Indonesia." },
        { title: "Sejarah Singkat", subtitle: "penemuan internet", full_prompt: "Ceritakan sejarah singkat penemuan internet, mulai dari ARPANET hingga World Wide Web." },
        { title: "Bagaimana Cara Kerja", subtitle: "vaksin mRNA?", full_prompt: "Jelaskan bagaimana cara kerja vaksin berbasis mRNA seperti Pfizer atau Moderna." },
        { title: "Fakta Menarik", subtitle: "tentang lautan dalam", full_prompt: "Berikan saya 5 fakta menarik yang jarang diketahui tentang kehidupan di laut dalam." },

        // Gaya Hidup & Hiburan
        { title: "Rencana Perjalanan", subtitle: "hemat 3 hari di Bali", full_prompt: "Buatkan saya rencana perjalanan hemat selama 3 hari di Bali untuk backpacker." },
        { title: "Rekomendasi Film", subtitle: "genre thriller psikologis", full_prompt: "Beri saya 5 rekomendasi film genre thriller psikologis yang menegangkan." },
        { title: "Ide Resep Sehat", subtitle: "untuk sarapan di bawah 15 menit", full_prompt: "Berikan 3 ide resep sarapan sehat dan praktis yang bisa dibuat dalam waktu kurang dari 15 menit." },
        { title: "Tips Berkebun", subtitle: "untuk pemula di lahan sempit", full_prompt: "Apa saja tips penting untuk mulai berkebun sayuran bagi pemula yang hanya punya balkon apartemen?" },
        { title: "Buat Lelucon", subtitle: "tentang programmer", full_prompt: "Buatkan sebuah lelucon singkat tentang kehidupan seorang programmer." }
    ];

    // --- (Sisa kode tidak ada yang berubah) ---
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
        profileInitial.textContent = user.email.charAt(0).toUpperCase();
        userEmailDisplay.textContent = user.email;
    }

    async function checkAuthState() {
        try {
            const response = await fetch('/check_auth');
            const data = await response.json();
            currentUser = data.logged_in ? { email: data.email } : null;
            if (currentUser) {
                setupUserUI(currentUser);
            } else {
                setupGuestUI();
            }
        } catch (error) {
            console.error("Gagal memeriksa status autentikasi:", error);
            setupGuestUI();
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
                    editBtn.title = 'Ubah judul';
                    
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
                appendMessage(content, msg.isUser ? 'user-message' : 'bot-message', false, timestamp);
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

    async function handleFormSubmit(e) {
        if (e) e.preventDefault();
        const userMessageText = userInput.value.trim();
        
        if (userMessageText === "" && !uploadedImageData) return;

        hideInitialPrompts();

        let userHtmlContent = `<p>${userMessageText}</p>`;
        if (uploadedImageData) {
            userHtmlContent = `<img src="${uploadedImageData}" class="message-image" alt="Gambar terlampir"><br>` + userHtmlContent;
        }

        appendMessage(userHtmlContent, 'user-message', false, new Date());
        
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

    function appendMessage(content, className, isTextContent, timestamp) {
        const messageElement = document.createElement("div");
        messageElement.className = `message ${className}`;
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
