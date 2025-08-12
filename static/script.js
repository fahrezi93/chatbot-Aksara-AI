document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMEN DOM ---
  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const headerMenuButtons = document.querySelectorAll(".header-menu-btn");
  const chatArea = document.getElementById("chat-area");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const historyList = document.getElementById("history-list");
  const newChatBtn = document.getElementById("new-chat-btn");
  const chatForm = document.getElementById("chat-form");
  const initialPromptsContainer = document.getElementById(
    "initial-prompts-container"
  );
  const promptSuggestionsContainer = document.querySelector(
    ".prompt-suggestions"
  );
  const welcomeScreen = document.getElementById("welcome-screen");
  const startChatBtn = document.getElementById("start-chat-btn");
  const guestActions = document.getElementById("guest-actions");
  const userActions = document.getElementById("user-actions");
  const profileBtn = document.getElementById("profile-btn");
  const profileInitial = document.getElementById("profile-initial");
  const profileDropdown = document.getElementById("profile-dropdown");
  const userNameDisplay = document.getElementById("user-name-display");
  const userEmailDisplaySmall = document.getElementById(
    "user-email-display-small"
  );
  const themeToggleButtons = document.querySelectorAll(".theme-toggle-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const modalOverlay = document.getElementById("modal-overlay");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const micBtn = document.getElementById("mic-btn");
  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("file-input");
  const imagePreviewContainer = document.getElementById(
    "image-preview-container"
  );
  const imagePreview = document.getElementById("image-preview");
  const removePreviewBtn = document.getElementById("remove-preview-btn");
  const logoutBtnLink = document.getElementById("logout-btn-link");
  const logoutOverlay = document.getElementById("logout-overlay");
  const chatTitle = document.getElementById("chat-title");
  const feedbackBtn = document.getElementById("feedback-btn");
  const feedbackModalOverlay = document.getElementById(
    "feedback-modal-overlay"
  );
  const feedbackUserEmail = document.getElementById("feedback-user-email");
  const cancelFeedbackBtn = document.getElementById("cancel-feedback-btn");
  const feedbackForm = document.getElementById("feedback-form");
  const feedbackTextarea = document.getElementById("feedback-textarea");
  const feedbackMessage = document.getElementById("feedback-message");
  const searchHistoryInput = document.getElementById("search-history-input");

  let currentUser = null;
  let currentConversationId = null;
  let conversationHistory = [];
  let uploadedImageData = null;

  const ALL_PROMPTS = [
    {
      title: "Resep Kue Lebaran",
      subtitle: "10 Resep kue lebaran praktis dan murah",
      full_prompt: "Berikan 10 resep kue lebaran yang praktis dan murah",
    },
    {
      title: "Ide Konten TikTok",
      subtitle: "Konten TikTok yang lagi viral sekarang",
      full_prompt: "Berikan ide konten TikTok yang sedang viral saat ini",
    },
    {
      title: "Rekomendasi Film",
      subtitle: "Genre Film Action Indonesia",
      full_prompt: "Rekomendasikan film action dari Indonesia",
    },
    {
      title: "Buat Draf Email",
      subtitle: "untuk menindaklanjuti proposal kerjasama",
      full_prompt:
        "Buatkan saya draf email profesional untuk menindaklanjuti proposal kerjasama yang saya kirim minggu lalu.",
    },
    {
      title: "Rangkum Teks Ini",
      subtitle: "menjadi 5 poin utama",
      full_prompt:
        "Tolong rangkum teks berikut menjadi 5 poin utama: [tempel teks di sini]",
    },
    {
      title: "Ide Nama Brand",
      subtitle: "untuk produk fashion ramah lingkungan",
      full_prompt:
        "Berikan 10 ide nama brand yang menarik untuk produk fashion yang ramah lingkungan.",
    },
    {
      title: "Latihan Wawancara Kerja",
      subtitle: "untuk posisi Digital Marketing",
      full_prompt:
        "Mari kita latihan wawancara kerja. Ajukan saya pertanyaan umum untuk posisi Digital Marketing.",
    },
    {
      title: "Buat Jadwal Mingguan",
      subtitle: "untuk menyeimbangkan kerja dan olahraga",
      full_prompt:
        "Buatkan saya contoh jadwal mingguan yang seimbang antara pekerjaan full-time dan rutinitas olahraga 3 kali seminggu.",
    },
    {
      title: "Jelaskan Konsep Sulit",
      subtitle: "seperti menjelaskan kepada anak 10 tahun",
      full_prompt:
        "Jelaskan konsep 'blockchain' seolah-olah saya adalah anak berusia 10 tahun.",
    },
    {
      title: "Buat Puisi",
      subtitle: "tentang senja di tepi pantai",
      full_prompt:
        "Buatkan saya sebuah puisi singkat tentang indahnya senja di tepi pantai.",
    },
    {
      title: "Rencana Perjalanan",
      subtitle: "ke Yogyakarta selama 3 hari 2 malam",
      full_prompt:
        "Buatkan rencana perjalanan (itinerary) hemat untuk liburan ke Yogyakarta selama 3 hari 2 malam.",
    },
    {
      title: "Terjemahkan & Perbaiki",
      subtitle: "kalimat bahasa Inggris ini",
      full_prompt:
        "Terjemahkan kalimat ini ke Bahasa Inggris dan perbaiki grammarnya: 'Saya suka makan nasi goreng dan saya pikir itu adalah makanan terbaik di dunia.'",
    },
    {
      title: "Ide Hadiah Ulang Tahun",
      subtitle: "untuk sahabat perempuan budget 200 ribu",
      full_prompt:
        "Berikan 5 ide hadiah ulang tahun yang unik untuk sahabat perempuan dengan budget di bawah 200 ribu rupiah.",
    },
    {
      title: "Tulis Caption Instagram",
      subtitle: "untuk foto liburan di gunung",
      full_prompt:
        "Buatkan 3 pilihan caption Instagram yang menarik untuk foto liburan di gunung.",
    },
    {
      title: "Analisis SWOT Sederhana",
      subtitle: "untuk bisnis kedai kopi kecil",
      full_prompt:
        "Lakukan analisis SWOT (Strengths, Weaknesses, Opportunities, Threats) sederhana untuk bisnis kedai kopi kecil di lingkungan perumahan.",
    },
    {
      title: "Buat Cerita Pendek",
      subtitle: "dengan 3 kata kunci: kucing, malam, misteri",
      full_prompt:
        "Buat sebuah cerita pendek (sekitar 200 kata) yang mengandung kata kunci: kucing, malam, dan misteri.",
    },
    {
      title: "Ide Menu Sarapan Sehat",
      subtitle: "selama satu minggu",
      full_prompt: "Berikan ide menu sarapan sehat dan praktis untuk 7 hari.",
    },
    {
      title: "Bandingkan Dua Produk",
      subtitle: "iPhone 15 vs Samsung S24",
      full_prompt:
        "Bandingkan kelebihan dan kekurangan antara iPhone 15 dan Samsung Galaxy S24 dalam bentuk tabel.",
    },
    {
      title: "Buat Script Video Pendek",
      subtitle: "tentang tips menabung untuk pemula",
      full_prompt:
        "Buatkan script singkat untuk video Reels/Shorts berdurasi 30 detik tentang tips menabung untuk pemula.",
    },
    {
      title: "Jelaskan Istilah Coding",
      subtitle: "apa itu API?",
      full_prompt:
        "Jelaskan apa itu API (Application Programming Interface) dengan analogi yang mudah dipahami oleh orang non-teknis.",
    },
    {
      title: "Konversi Resep",
      subtitle: "dari 4 porsi menjadi 8 porsi",
      full_prompt:
        "Saya punya resep bolu untuk 4 porsi. Tolong konversikan semua takarannya agar bisa dibuat untuk 8 porsi.",
    },
    {
      title: "Tips Belajar Efektif",
      subtitle: "untuk persiapan ujian",
      full_prompt:
        "Berikan 7 tips belajar yang efektif untuk persiapan menghadapi ujian.",
    },
    {
      title: "Buat Dialog",
      subtitle: "antara penjual dan pembeli di pasar",
      full_prompt:
        "Buatkan contoh dialog tawar-menawar antara penjual buah dan pembeli di pasar tradisional.",
    },
    {
      title: "Rekomendasi Buku",
      subtitle: "novel fiksi ilmiah untuk pemula",
      full_prompt:
        "Rekomendasikan 3 buku novel fiksi ilmiah yang bagus untuk pembaca pemula di genre ini.",
    },
    {
      title: "Ide Dekorasi Kamar",
      subtitle: "dengan gaya minimalis dan budget terbatas",
      full_prompt:
        "Berikan ide-ide dekorasi kamar tidur dengan gaya minimalis yang tidak memakan banyak biaya.",
    },
    {
      title: "Buat Slogan Iklan",
      subtitle: "untuk produk minuman energi herbal",
      full_prompt:
        "Buatkan 5 pilihan slogan iklan yang catchy untuk produk minuman energi dari bahan herbal.",
    },
    {
      title: "Latihan Soal Matematika",
      subtitle: "untuk tingkat SMP",
      full_prompt:
        "Berikan 5 soal latihan matematika tentang aljabar sederhana untuk siswa SMP beserta jawabannya.",
    },
    {
      title: "Analisis Puisi",
      subtitle: "karya Chairil Anwar 'Aku'",
      full_prompt:
        "Berikan analisis singkat mengenai makna dari puisi 'Aku' karya Chairil Anwar.",
    },
    {
      title: "Jelaskan Peribahasa",
      subtitle: "arti dari 'Air susu dibalas dengan air tuba'",
      full_prompt:
        "Apa arti dari peribahasa 'Air susu dibalas dengan air tuba' dan berikan contoh penggunaannya dalam kalimat.",
    },
    {
      title: "Rekomendasi Channel YouTube",
      subtitle: "untuk belajar tentang sejarah Indonesia",
      full_prompt:
        "Rekomendasikan beberapa channel YouTube yang bagus untuk belajar tentang sejarah Indonesia.",
    },
  ];

  // Fungsi deteksi mode mobile/desktop
  function isMobile() {
    return window.innerWidth <= 768;
  }

  function setSidebarState() {
    // In guest mode, always hide the sidebar and its toggle
    if (body.classList.contains('guest-mode') || !currentUser) {
      if (sidebar) sidebar.style.display = 'none';
      // Tombol hamburger disembunyikan di guest via CSS; tidak perlu force inline style
      body.classList.remove('sidebar-open');
      return;
    }

    if (isMobile()) {
      // Mobile: sidebar overlay, default tertutup
      sidebar.classList.add('expanded');
      sidebar.classList.remove('collapsed');
      body.classList.remove('sidebar-collapsed');
      // Biarkan sidebar selalu ada; animasi diatur dengan transform
      sidebar.style.display = 'flex';
    } else {
      // Desktop: sidebar collapsed/expanded
      sidebar.style.display = 'flex';
      if (sidebar.classList.contains('collapsed')) {
        body.classList.add('sidebar-collapsed');
        body.classList.remove('sidebar-open');
      } else {
        body.classList.remove('sidebar-collapsed');
        body.classList.remove('sidebar-open');
      }
    }
  }

  function toggleSidebar() {
    if (isMobile()) {
      requestAnimationFrame(() => {
        body.classList.toggle('sidebar-open');
      });
    } else {
      const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
      requestAnimationFrame(() => {
        if (isCurrentlyCollapsed) {
          // Expand sidebar
          sidebar.classList.remove('collapsed');
          sidebar.classList.add('expanded');
          body.classList.remove('sidebar-collapsed');
        } else {
          // Collapse sidebar
          sidebar.classList.add('collapsed');
          sidebar.classList.remove('expanded');
          body.classList.add('sidebar-collapsed');
        }
        
        // Update state langsung dalam callback yang sama
        setSidebarState();
      });
    }
  }

  function closeSidebar() {
    if (isMobile()) {
      // Mobile: tutup sidebar dengan animasi
      body.classList.remove('sidebar-open');
    } else {
      // Desktop: collapse sidebar dengan animasi yang sinkron
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('expanded');
      body.classList.add('sidebar-collapsed');
      
      // Update state langsung tanpa setTimeout
      setSidebarState();
    }
  }

  function filterHistory() {
    const searchTerm = searchHistoryInput.value.toLowerCase();
    const historyItems = historyList.querySelectorAll('.history-item');
    let hasVisibleItems = false;

    historyItems.forEach(item => {
      const itemText = item.textContent.toLowerCase();
      const isVisible = itemText.includes(searchTerm);
      item.style.display = isVisible ? 'block' : 'none';
      if (isVisible) {
        hasVisibleItems = true;
      }
    });

    let noResultEl = historyList.querySelector('.no-history-result');
    if (!hasVisibleItems && searchTerm) {
      if (!noResultEl) {
        noResultEl = document.createElement('p');
        noResultEl.className = 'no-history-result';
        noResultEl.style.padding = '20px';
        noResultEl.style.textAlign = 'center';
        noResultEl.style.color = 'var(--text-color-light)';
        noResultEl.textContent = 'Tidak ada hasil ditemukan.';
        historyList.appendChild(noResultEl);
      }
    } else if (noResultEl) {
      noResultEl.remove();
    }
  }

  function updateClearChatButtonState() {
    if (clearChatBtn) {
      clearChatBtn.disabled = !currentConversationId;
    }
  }

  function setupGuestUI() {
    body.classList.add("guest-mode");
    if (welcomeScreen) welcomeScreen.style.display = "none";
    if (guestActions) guestActions.style.display = "flex";
    if (userActions) userActions.style.display = "none";
    if (chatBox) chatBox.innerHTML = "";
    appendMessage(
      "<p>Selamat datang di Aksara AI. Silakan <a href='/login'>masuk</a> atau <a href='/register'>daftar</a> untuk menyimpan riwayat obrolan dan mengakses semua fitur.</p>",
      "bot-message"
    );
    conversationHistory = [];
    hideInitialPrompts();
    if (sidebar) sidebar.style.display = "none";
    updateClearChatButtonState();
    // Sembunyikan tombol new chat di guest mode
    if (newChatBtn) newChatBtn.style.display = "none";
    // Jika ingin sembunyikan fitur lain, tambahkan di sini
  }

  function setupUserUI(user) {
    body.classList.remove("guest-mode");
    if (sidebar) sidebar.style.display = "flex";
    // Biarkan CSS yang mengatur visibilitas hamburger antara desktop vs mobile
    if (welcomeScreen) welcomeScreen.classList.add("visible");
    if (guestActions) guestActions.style.display = "none";
    if (userActions) userActions.style.display = "flex";

    const nameToUse = user.user_full_name || user.username;
    const initial = nameToUse ? nameToUse.charAt(0).toUpperCase() : "?";

    if (profileInitial) profileInitial.textContent = initial;
    if (userNameDisplay) userNameDisplay.textContent = nameToUse;
    if (userEmailDisplaySmall) userEmailDisplaySmall.textContent = user.email;

    document.querySelectorAll(".initial-prompts-header h1").forEach((el) => {
      const username = user.username || 'Pengguna';
      el.textContent = `Hi ${username}, Apa yang bisa saya bantu hari ini?`;
    });
  }

  async function checkAuthState() {
    try {
      const response = await fetch("/check_auth");
      if (!response.ok) throw new Error("Auth check failed");
      const data = await response.json();
      currentUser = data.logged_in
        ? {
            email: data.email,
            username: data.username,
            user_full_name: data.user_full_name,
          }
        : null;
      if (currentUser) {
        setupUserUI(currentUser);
      } else {
        setupGuestUI();
      }
    } catch (error) {
      console.error("Gagal memeriksa status autentikasi:", error);
      setupGuestUI();
    } finally {
      body.classList.add("app-loaded");
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
      const selectedPrompts = ALL_PROMPTS.slice(0, 3);
      promptSuggestionsContainer.innerHTML = "";
      selectedPrompts.forEach((prompt) => {
        promptSuggestionsContainer.innerHTML += `
                  <div class="prompt-card" data-prompt="${prompt.full_prompt}" tabindex="0" role="button">
                      <h3>${prompt.title}</h3>
                      <p>${prompt.subtitle}</p>
                  </div>`;
      });
      if (chatArea) chatArea.classList.add("initial-chat-layout");
    }
  }

  function hideInitialPrompts() {
    if (chatArea) chatArea.classList.remove("initial-chat-layout");
  }

  async function loadConversationsList() {
    if (!currentUser || !historyList) return;
    try {
      const response = await fetch("/get_conversations");
      const conversations = await response.json();
      historyList.innerHTML = "";
      if (conversations.length > 0) {
        conversations.forEach((conv) => {
          const historyItem = document.createElement("div");
          historyItem.className = "history-item";
          historyItem.dataset.conversationId = conv.id;
          historyItem.setAttribute("tabindex", "0");
          historyItem.setAttribute("role", "button");
          historyItem.textContent = conv.title || "Obrolan tanpa judul";
          historyList.appendChild(historyItem);
        });
      } else {
        historyList.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--text-color-light); opacity: 0.7;">Tidak ada riwayat.</p>`;
      }
    } catch (error) {
      console.error("Gagal memuat daftar percakapan:", error);
    }
  }

  async function loadConversation(conversationId) {
    if (!currentUser || currentConversationId === conversationId) return;

    hideInitialPrompts();
    currentConversationId = conversationId;
    conversationHistory = [];
    if (chatBox) chatBox.innerHTML = '<div class="loading-spinner"></div>';

    document.querySelectorAll(".history-item").forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.conversationId === conversationId
      );
    });

    const activeItem = historyList.querySelector(`.history-item.active`);
    if (chatTitle)
      chatTitle.textContent = activeItem ? activeItem.textContent : "Memuat...";
    updateClearChatButtonState();

    try {
      const response = await fetch(`/get_conversation/${conversationId}`);
      const data = await response.json();

      if (chatBox) chatBox.innerHTML = "";
      const fragment = document.createDocumentFragment();
      data.forEach((msg) => {
        const messageElement = createMessageElement(msg, false); // No animation on load
        fragment.appendChild(messageElement);
        conversationHistory.push({ isUser: msg.isUser, text: msg.text });
      });
      chatBox.appendChild(fragment);
      scrollToBottom(false);
    } catch (error) {
      console.error(`Gagal memuat percakapan ${conversationId}:`, error);
      if (chatBox) chatBox.innerHTML = "<p>Gagal memuat percakapan.</p>";
    }

    closeSidebar();
  }

  function startNewChat() {
    currentConversationId = null;
    conversationHistory = [];
    if (chatBox) chatBox.innerHTML = "";
    showInitialPrompts();
    document
      .querySelectorAll(".history-item")
      .forEach((item) => item.classList.remove("active"));
    if (userInput) userInput.focus();
    if (chatTitle) chatTitle.textContent = "Obrolan Baru";
    updateClearChatButtonState();
    closeSidebar();
  }

  async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    const userMessageText = chatTextarea ? chatTextarea.value.trim() : '';
    if (userMessageText === '' && !uploadedImageData) return;

    hideInitialPrompts();
    if (!currentConversationId) {
      conversationHistory = [];
    }

    let userHtmlContent = `<p>${userMessageText.replace(/\n/g, "<br>")}</p>`;
    if (uploadedImageData) {
      userHtmlContent =
        `<img src="${uploadedImageData}" class="message-image" alt="Gambar terlampir"><br>` +
        userHtmlContent;
    }

    appendMessage(userHtmlContent, "user-message slide-in-right");

    const userMessageData = {
      isUser: true,
      text: userMessageText,
      htmlContent: `<p>${userMessageText}</p>`,
      imageData: uploadedImageData,
    };
    conversationHistory.push({ isUser: true, text: userMessageText });

    const imageToSend = uploadedImageData;
    resetInputArea();

    try {
      const savedUserData = await saveMessageToDb(userMessageData);
      if (
        savedUserData &&
        savedUserData.conversationId &&
        !currentConversationId
      ) {
        currentConversationId = savedUserData.conversationId;
        if (chatTitle)
          chatTitle.textContent = savedUserData.title || "Obrolan Baru";
        await loadConversationsList();
        document.querySelectorAll(".history-item").forEach((item) => {
          item.classList.toggle(
            "active",
            item.dataset.conversationId === currentConversationId
          );
        });
      }
      updateClearChatButtonState();
      await streamBotResponse(userMessageText, imageToSend);
    } catch (error) {
      console.error("Error during message handling:", error);
      appendMessage(
        "<p>Maaf, terjadi kesalahan saat memproses pesan Anda.</p>",
        "bot-message"
      );
    }
  }

  async function streamBotResponse(userMessageText, imageToSend) {
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
          imageData: imageToSend,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      if (typingIndicator) typingIndicator.remove();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullResponseText += decoder.decode(value, { stream: true });
        botMessageElement.querySelector(".content-wrapper").innerHTML =
          marked.parse(fullResponseText);
        scrollToBottom();
      }

      const finalHtml = marked.parse(fullResponseText);
      botMessageElement.querySelector(".content-wrapper").innerHTML = finalHtml;

      const botMessageData = {
        isUser: false,
        text: fullResponseText,
        htmlContent: finalHtml,
      };
      conversationHistory.push(botMessageData);
      await saveMessageToDb(botMessageData);
      addCopyToBotMessage(botMessageElement);
    } catch (error) {
      console.error("Error streaming response:", error);
      if (typingIndicator) typingIndicator.remove();
      if (botMessageElement)
        botMessageElement.querySelector(
          ".content-wrapper"
        ).innerHTML = `<p>Maaf, terjadi kesalahan. Coba lagi nanti. (${error.message})</p>`;
    }
  }

  function resetInputArea() {
    uploadedImageData = null;
    if (imagePreviewContainer) imagePreviewContainer.style.display = "none";
    if (fileInput) fileInput.value = "";
    if (chatTextarea) {
      chatTextarea.value = "";
      chatTextarea.style.height = 'auto';
      chatTextarea.focus();
      if (sendBtn) sendBtn.disabled = true;
    }
  }

  async function saveMessageToDb(messageData) {
    if (!currentUser) return null;
    try {
      const response = await fetch("/save_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversationId,
          messageData: messageData,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error("Gagal menyimpan pesan:", error);
      return null;
    }
  }

  function createMessageElement(msgData, withAnimation = true) {
    const { htmlContent, imageData, isUser } = msgData;
    let className = isUser ? "user-message" : "bot-message";
    if (withAnimation) {
        className += isUser ? ' slide-in-right' : ' slide-in-left';
    }

    const messageElement = document.createElement("div");
    messageElement.className = `message ${className}`;

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";

    let fullContent = "";
    if (imageData) {
      fullContent += `<img src="${imageData}" class="message-image" alt="Gambar terlampir"><br>`;
    }
    fullContent += htmlContent;
    contentWrapper.innerHTML = fullContent;
    messageElement.appendChild(contentWrapper);

    if (!isUser && htmlContent) {
      addCopyToBotMessage(messageElement);
    }
    return messageElement;
  }

  function appendMessage(content, className) {
    if (!chatBox) return;
    const messageElement = document.createElement("div");
    messageElement.className = `message ${className}`;

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";
    contentWrapper.innerHTML = content;
    messageElement.appendChild(contentWrapper);

    if (className.includes("bot-message") && content) {
      addCopyToBotMessage(messageElement);
    }
    chatBox.appendChild(messageElement);
    scrollToBottom();
  }

  function createBotMessageElement() {
    const messageElement = document.createElement("div");
    messageElement.className = "message bot-message slide-in-left";
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";
    messageElement.appendChild(contentWrapper);
    if (chatBox) chatBox.appendChild(messageElement);
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

  function addCopyToBotMessage(botMessageElement) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.setAttribute("aria-label", "Salin pesan");
    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyBtn.addEventListener("click", () => {
      const contentToCopy =
        botMessageElement.querySelector(".content-wrapper").innerText;
      navigator.clipboard.writeText(contentToCopy);
    });
    botMessageElement.appendChild(copyBtn);
  }

  function scrollToBottom(smooth = true) {
    if (chatBox) {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }

  function autoResizeTextarea() {
    if (!userInput) return;
    userInput.style.height = "auto";
    const maxHeight = 150;
    userInput.style.height = Math.min(userInput.scrollHeight, maxHeight) + "px";
  }

  function openFeedbackModal() {
    if (feedbackModalOverlay) {
      feedbackModalOverlay.classList.add("visible");
      if (currentUser && currentUser.email) {
        feedbackUserEmail.textContent = currentUser.email;
      } else {
        feedbackUserEmail.textContent = "Pengguna Tamu";
      }
      feedbackTextarea.value = "";
      feedbackMessage.textContent = "";
      const submitBtn = document.getElementById("submit-feedback-btn");
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function closeFeedbackModal() {
    if (feedbackModalOverlay) {
      feedbackModalOverlay.classList.remove("visible");
    }
  }

  // --- EVENT LISTENERS ---
  headerMenuButtons.forEach(btn => btn.addEventListener("click", toggleSidebar));
  if (chatForm) chatForm.addEventListener("submit", handleFormSubmit);
  if (newChatBtn) newChatBtn.addEventListener("click", startNewChat);

  if (startChatBtn) {
    startChatBtn.addEventListener("click", () => {
      if (welcomeScreen) welcomeScreen.classList.remove("visible");
      if (currentUser) {
        loadConversationsList();
        startNewChat();
      }
    });
  }

  if (historyList) {
    historyList.addEventListener("click", (e) => {
      const historyItem = e.target.closest(".history-item");
      if (historyItem) loadConversation(historyItem.dataset.conversationId);
    });
  }

  if (promptSuggestionsContainer) {
    promptSuggestionsContainer.addEventListener("click", (e) => {
      const promptCard = e.target.closest(".prompt-card");
      if (promptCard && userInput) {
        userInput.value = promptCard.dataset.prompt;
        handleFormSubmit();
      }
    });
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      if (!clearChatBtn.disabled && modalOverlay)
        modalOverlay.classList.add("visible");
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!currentConversationId || !currentUser) return;
      try {
        const response = await fetch(
          `/delete_conversation/${currentConversationId}`,
          { method: "DELETE" }
        );
        if (response.ok) {
          startNewChat();
          loadConversationsList();
        }
      } catch (error) {
        console.error("Gagal menghapus percakapan:", error);
      } finally {
        if (modalOverlay) modalOverlay.classList.remove("visible");
      }
    });
  }

  if (cancelBtn)
    cancelBtn.addEventListener("click", () =>
      modalOverlay.classList.remove("visible")
    );
  if (modalOverlay)
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove("visible");
    });

  // Hapus event lama:
  // if (userInput) { ... }
  // if (userInput) { ... }
  // if (userInput) { ... }

  if (uploadBtn) uploadBtn.addEventListener("click", () => fileInput.click());
  if (fileInput) {
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedImageData = e.target.result;
          if (imagePreview) imagePreview.src = uploadedImageData;
          if (imagePreviewContainer)
            imagePreviewContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removePreviewBtn) {
    removePreviewBtn.addEventListener("click", resetInputArea);
  }

  document.addEventListener("click", (e) => {
    if (
      profileDropdown &&
      profileDropdown.classList.contains("show") &&
      profileBtn &&
      !profileBtn.contains(e.target) &&
      !profileDropdown.contains(e.target)
    ) {
      profileDropdown.classList.remove("show");
    }

    if (
        sidebar &&
        sidebar.classList.contains('expanded') &&
        !sidebar.contains(e.target) &&
        !Array.from(headerMenuButtons).some(btn => btn.contains(e.target))
    ) {
        closeSidebar();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSidebar();
      if (profileDropdown) profileDropdown.classList.remove("show");
      if (modalOverlay) modalOverlay.classList.remove("visible");
      if (feedbackModalOverlay)
        feedbackModalOverlay.classList.remove("visible");
    }
  });

  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (profileDropdown) profileDropdown.classList.toggle("show");
    });
  }

  if (logoutBtnLink) {
    logoutBtnLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (logoutOverlay) logoutOverlay.classList.add("visible");
      setTimeout(() => {
        window.location.href = logoutBtnLink.href;
      }, 1500);
    });
  }

  if (themeToggleButtons) {
    themeToggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const isDarkMode = body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDarkMode ? "dark-mode" : "");
      });
    });
  }
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark-mode") {
    body.classList.add("dark-mode");
  }

  // --- FEEDBACK LOGIC ---
  if (feedbackBtn) feedbackBtn.addEventListener("click", openFeedbackModal);
  if (cancelFeedbackBtn)
    cancelFeedbackBtn.addEventListener("click", closeFeedbackModal);
  if (feedbackModalOverlay)
    feedbackModalOverlay.addEventListener("click", (e) => {
      if (e.target === feedbackModalOverlay) closeFeedbackModal();
    });

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedbackText = feedbackTextarea.value.trim();
      if (!feedbackText) return;

      const submitBtn = document.getElementById("submit-feedback-btn");
      submitBtn.disabled = true;
      feedbackMessage.textContent = "Mengirim...";

      try {
        const response = await fetch("/submit_feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: feedbackText }),
        });
        const data = await response.json();
        if (response.ok) {
          feedbackMessage.textContent =
            "Terima kasih! Masukan Anda telah terkirim.";
          setTimeout(closeFeedbackModal, 2000);
        } else {
          throw new Error(data.message || "Gagal mengirim masukan.");
        }
      } catch (error) {
        feedbackMessage.textContent = error.message;
        submitBtn.disabled = false;
      }
    });
  }

  // --- SPEECH RECOGNITION ---
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "id-ID";
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {
      if (micBtn.classList.contains("recording")) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    recognition.onstart = () => micBtn.classList.add("recording");
    recognition.onend = () => micBtn.classList.remove("recording");
    recognition.onresult = (event) => {
      userInput.value = event.results[0][0].transcript;
      autoResizeTextarea();
      handleFormSubmit(new Event("submit", { bubbles: true }));
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      micBtn.classList.remove("recording");
    };
  } else if (micBtn) {
    micBtn.style.display = "none";
  }

  // --- TOOLTIP LOGIC ---
  let tooltipElement;
  function showTooltip(e) {
    const triggerElement = e.target.closest("[data-tooltip]");
    if (!triggerElement) return;

    hideTooltip();

    const tooltipText = triggerElement.dataset.tooltip;
    tooltipElement = document.createElement("div");
    tooltipElement.className = "tooltip-text";
    tooltipElement.textContent = tooltipText;
    document.body.appendChild(tooltipElement);

    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    let top, left;

    left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    if (triggerRect.top < tooltipRect.height + 15) {
      tooltipElement.classList.add("tooltip-bottom");
      top = triggerRect.bottom + 8;
    } else {
      tooltipElement.classList.remove("tooltip-bottom");
      top = triggerRect.top - tooltipRect.height - 8;
    }

    tooltipElement.style.left = `${Math.max(5, left)}px`;
    tooltipElement.style.top = `${top}px`;
  }
  function hideTooltip() {
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }
  }
  document.addEventListener("mouseover", showTooltip);
  document.addEventListener("mouseout", hideTooltip);
  document.addEventListener("focusin", showTooltip);
  document.addEventListener("focusout", hideTooltip);
  window.addEventListener("scroll", hideTooltip, true);

  // --- EVENT LISTENER PENCARIAN ---
  if (searchHistoryInput) {
    searchHistoryInput.addEventListener('input', filterHistory);
  }

  // --- TEXTAREA, SUBMIT, DAN PROMPT SUGGESTION FIX ---
  const chatTextarea = document.querySelector('textarea[name="user-input"]');
  const sendBtn = document.getElementById('send-btn');

  // Auto-resize
  if (chatTextarea) {
    chatTextarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
      if (sendBtn) sendBtn.disabled = !this.value.trim();
    });
    // Enter = submit, Shift+Enter = newline
    chatTextarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (chatForm) chatForm.requestSubmit();
      }
    });
    // Inisialisasi tombol kirim
    if (sendBtn) sendBtn.disabled = !chatTextarea.value.trim();
  }

  // Event submit form
  if (chatForm) {
    chatForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const textarea = chatForm.querySelector('textarea[name="user-input"]');
      const value = textarea ? textarea.value.trim() : '';
      if (value) {
        if (typeof handleFormSubmit === 'function') {
          handleFormSubmit(e);
        } else {
          textarea.value = '';
          textarea.style.height = 'auto';
        }
      }
    });
  }

  if (promptSuggestionsContainer) {
    promptSuggestionsContainer.addEventListener('click', (e) => {
      const promptCard = e.target.closest('.prompt-card');
      if (promptCard && chatTextarea) {
        chatTextarea.value = promptCard.dataset.prompt || promptCard.innerText;
        chatTextarea.dispatchEvent(new Event('input'));
        if (chatForm) chatForm.requestSubmit();
      }
    });
  }

  // --- INITIALIZATION ---
  checkAuthState();
  updateClearChatButtonState();
  setSidebarState(); // Set sidebar state on load
});