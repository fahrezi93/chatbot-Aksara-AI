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
    const welcomeScreen = document.getElementById('welcome-screen');
    const startChatBtn = document.getElementById('start-chat-btn');
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    const profileBtn = document.getElementById('profile-btn');
    const profileInitial = document.getElementById('profile-initial');
    const profileDropdown = document.getElementById('profile-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const themeToggleButtons = document.querySelectorAll('.theme-toggle-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const historyList = document.getElementById('history-list');
    const menuBtn = document.getElementById('menu-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const micBtn = document.getElementById('mic-btn');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');

    let conversationHistory = [];

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

    // --- FUNGSI MANAJEMEN PERCAKAPAN ---
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
                    historyItem.textContent = conv.title;
                    historyItem.title = conv.title;
                    historyItem.dataset.conversationId = conv.id;
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
                const timestamp = msg.timestamp && msg.timestamp._seconds ? new Date(msg.timestamp._seconds * 1000) : new Date();
                appendMessage(msg.htmlContent, msg.isUser ? 'user-message' : 'bot-message', false, timestamp);
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
        appendMessage("<p>Halo! Bagaimana saya bisa membantu Anda hari ini?</p>", "bot-message", false, new Date());
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
        if (userMessageText === "") return;

        const userHtmlContent = `<p>${userMessageText}</p>`;
        appendMessage(userHtmlContent, 'user-message', false, new Date());
        const userMessageData = { isUser: true, text: userMessageText, htmlContent: userHtmlContent };
        conversationHistory.push({ isUser: true, text: userMessageText });
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
                    history: conversationHistory.slice(0, -1)
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
    
    // --- EVENT LISTENERS ---
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
    if (historyList) {
        historyList.addEventListener('click', (e) => {
            if (e.target && e.target.closest('.history-item')) {
                const convId = e.target.closest('.history-item').dataset.conversationId;
                if (convId) loadConversation(convId);
            }
        });
    }
    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            if (!clearChatBtn.disabled) {
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

    // ✅ PERBAIKAN: Kode ganti tema yang hilang dikembalikan
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

    // --- FUNGSI TAMPILAN PESAN ---
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
    
    // Panggil checkAuthState di awal
    checkAuthState();
});
