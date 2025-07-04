document.addEventListener('DOMContentLoaded', () => {

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
    const micBtn = document.getElementById('mic-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
    const historyList = document.getElementById('history-list');
    const menuBtn = document.getElementById('menu-btn'); // ✅ Ambil tombol menu
    const sidebar = document.getElementById('sidebar'); // Ambil sidebar
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // --- MANAJEMEN UI ---
    function setupGuestUI() {
        if (body) body.classList.remove('user-logged-in');
        if (welcomeScreen) welcomeScreen.classList.remove('visible');
        if (guestActions) guestActions.style.display = 'flex';
        if (userActions) userActions.style.display = 'none';
        
        if (chatBox) {
            chatBox.innerHTML = '';
            appendMessage("<p>Selamat datang! Silakan <a href='/login'>masuk</a> atau <a href='/register'>daftar</a> untuk menyimpan riwayat obrolan Anda.</p>", "bot-message", false, new Date());
        }
    }

    function setupUserUI(user) {
        if (body) body.classList.add('user-logged-in');
        if (welcomeScreen) welcomeScreen.classList.add('visible');
        
        if (guestActions) guestActions.style.display = 'none';
        if (userActions) userActions.style.display = 'flex';
        
        if (profileInitial) profileInitial.textContent = user.email.charAt(0).toUpperCase();
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
    }

    // --- AUTENTIKASI ---
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
    checkAuthState();


        // ✅ FUNGSI DAN EVENT LISTENER UNTUK SIDEBAR RESPONSIVE
    function toggleSidebar() {
        if (body) body.classList.toggle('sidebar-visible');
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', toggleSidebar);
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // --- FUNGSI MANAJEMEN PERCAKAPAN ---
    async function loadConversation(conversationId) {
        // ... (fungsi ini tidak berubah, tapi kita tambahkan penutup sidebar) ...
        if (window.innerWidth <= 768) {
            toggleSidebar(); // Tutup sidebar setelah memilih chat di mobile
        }
    }
    
    if (historyList) {
        historyList.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('history-item')) {
                const convId = e.target.dataset.conversationId;
                if (convId) loadConversation(convId);
            }
        });
    }
    // --- FUNGSI MANAJEMEN PERCAKAPAN ---
    async function loadConversationsList() {
        if (!currentUser || !historyList) return;
        historyList.innerHTML = '';
        try {
            const response = await fetch('/get_conversations');
            const conversations = await response.json();
            if (conversations.length > 0) {
                conversations.forEach(conv => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.textContent = conv.title.length > 25 ? conv.title.substring(0, 25) + '...' : conv.title;
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
        if (!currentUser || !chatBox) return;
        currentConversationId = conversationId;
        
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.conversationId === conversationId);
        });

        chatBox.innerHTML = '';
        try {
            const response = await fetch(`/get_conversation/${conversationId}`);
            const messages = await response.json();
            messages.forEach(msg => {
                const timestamp = msg.timestamp && msg.timestamp._seconds ? new Date(msg.timestamp._seconds * 1000) : new Date();
                appendMessage(msg.htmlContent, msg.isUser ? 'user-message' : 'bot-message', false, timestamp);
            });
        } catch (error) {
            console.error(`Gagal memuat percakapan ${conversationId}:`, error);
        }
    }
    
    function startNewChat() {
        currentConversationId = null;
        if (chatBox) {
            chatBox.innerHTML = '';
            appendMessage("<p>Halo! Bagaimana saya bisa membantu Anda hari ini?</p>", "bot-message", false, new Date());
        }
        document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
        if (userInput) userInput.focus();
    }

    // --- EVENT LISTENERS ---
    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            if (welcomeScreen) welcomeScreen.classList.remove('visible');
            if (currentUser) {
                loadConversationsList();
                startNewChat();
            }
        });
    }

    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);

    if (historyList) {
        historyList.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('history-item')) {
                const convId = e.target.dataset.conversationId;
                if (convId) loadConversation(convId);
            }
        });
    }

    async function handleFormSubmit(e) {
        if (e) e.preventDefault();
        const userMessage = userInput.value.trim();
        if (userMessage === "") return;

        const userMsgData = { isUser: true, text: userMessage, htmlContent: `<p>${userMessage}</p>` };
        appendMessage(userMsgData.htmlContent, 'user-message', false, new Date());
        
        const isNewChat = !currentConversationId;
        if (currentUser) {
            saveMessageToDb(userMsgData, isNewChat);
        }
        
        userInput.value = "";
        userInput.focus();

        const botMessageElement = createBotMessageElement();
        const typingIndicator = showTypingIndicator(botMessageElement);
        let fullResponse = "";

        try {
            const response = await fetch("/send_message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMessage }) });
            if (!response.ok) throw new Error("Gagal mendapatkan respons dari server.");
            
            typingIndicator.remove();
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                fullResponse += decoder.decode(value, { stream: true });
                botMessageElement.querySelector(".content-wrapper").innerHTML = marked.parse(fullResponse);
                scrollToBottom();
            }

            const finalHtml = marked.parse(fullResponse);
            botMessageElement.querySelector(".content-wrapper").innerHTML = finalHtml;
            
            const botMsgData = { isUser: false, text: fullResponse, htmlContent: finalHtml };
            if (currentUser) saveMessageToDb(botMsgData, false);
            addCopyToBotMessage(botMessageElement);

        } catch (error) {
            console.error("Error:", error);
            if(typingIndicator) typingIndicator.remove();
            botMessageElement.querySelector(".content-wrapper").innerHTML = "<p>Maaf, terjadi kesalahan.</p>";
        }
    }

    async function saveMessageToDb(messageData, isNewChat) {
        if (!currentUser) return;
        try {
            const response = await fetch('/save_message', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    conversationId: isNewChat ? null : currentConversationId,
                    messageData: messageData 
                }) 
            });
            const data = await response.json();
            if (data.status === 'success' && data.conversationId) {
                currentConversationId = data.conversationId;
                if (isNewChat) {
                    loadConversationsList();
                }
            }
        } catch (error) {
            console.error("Gagal menyimpan pesan:", error);
        }
    }
    
    if (chatForm) chatForm.addEventListener('submit', handleFormSubmit);

    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            if (currentUser) {
                if (modalOverlay) modalOverlay.classList.add("visible");
            } else {
                setupGuestUI();
            }
        });
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            startNewChat(); 
            if (modalOverlay) modalOverlay.classList.remove("visible");
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
        if (savedTheme) body.classList.add(savedTheme);
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
});
