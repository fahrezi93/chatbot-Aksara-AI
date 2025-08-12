// Daftar model AI yang tersedia
const AI_MODELS = [
    {
        id: 'gemini',
        name: 'Gemini 2.5 Flash',
        shortName: 'Gemini 2.5',
        description: 'Model yang cocok untuk multitasking',
        icon: `<img src="/static/google-gemini-icon.png" alt="Gemini" class="model-icon-img">`
    },
    {
        id: 'deepseek',
        name: 'Deepseek R1',
        shortName: 'Deepseek R1',
        description: 'Model yang cocok untuk coding',
        icon: `<img src="/static/DeepSeek_logo_icon.png" alt="DeepSeek" class="model-icon-img">`
    }
];

// State untuk menyimpan model yang dipilih
let selectedModel = AI_MODELS[0]; // Default ke Gemini

document.addEventListener('DOMContentLoaded', () => {
    const modelSelectorBtn = document.getElementById('model-selector-btn');
    const modelDropdown = document.getElementById('model-dropdown');
    const modelList = document.getElementById('model-list');

    // Fungsi untuk memperbarui tampilan tombol selector
    function updateModelSelectorButton() {
        modelSelectorBtn.innerHTML = `
            ${selectedModel.icon}
            <div class="model-name">${selectedModel.shortName}</div>
        `;
    }

    // Fungsi untuk memperbarui daftar model dengan deskripsi
    function updateModelList() {
        modelList.innerHTML = AI_MODELS.map(model => `
            <div class="model-item ${model.id === selectedModel.id ? 'selected' : ''}" data-model-id="${model.id}">
                ${model.icon}
                <div class="model-info">
                    <div class="model-name">${model.name}</div>
                    <div class="model-description">${model.description}</div>
                </div>
            </div>
        `).join('');
    }

    // Event listener untuk tombol selector
    modelSelectorBtn.addEventListener('click', () => {
        const modelSelector = modelSelectorBtn.closest('.model-selector');
        modelDropdown.classList.toggle('show');
        modelSelector.classList.toggle('show');
        if (modelDropdown.classList.contains('show')) {
            updateModelList();
        }
    });

    // Event listener untuk pemilihan model
    modelList.addEventListener('click', (e) => {
        const modelItem = e.target.closest('.model-item');
        if (modelItem) {
            const modelId = modelItem.dataset.modelId;
            selectedModel = AI_MODELS.find(m => m.id === modelId);
            updateModelSelectorButton();
            const modelSelector = modelSelectorBtn.closest('.model-selector');
            modelDropdown.classList.remove('show');
            modelSelector.classList.remove('show');
            
            // Simpan preferensi model ke localStorage
            localStorage.setItem('selectedModelId', modelId);
            
            // Trigger event untuk memberitahu komponen lain bahwa model telah berubah
            document.dispatchEvent(new CustomEvent('modelChanged', { detail: selectedModel }));
        }
    });

    // Tutup dropdown saat klik di luar
    document.addEventListener('click', (e) => {
        if (!modelSelectorBtn.contains(e.target) && !modelDropdown.contains(e.target)) {
            const modelSelector = modelSelectorBtn.closest('.model-selector');
            modelDropdown.classList.remove('show');
            modelSelector.classList.remove('show');
        }
    });

    // Escape key untuk menutup dropdown
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modelSelector = modelSelectorBtn.closest('.model-selector');
            modelDropdown.classList.remove('show');
            modelSelector.classList.remove('show');
        }
    });

    // Inisialisasi model dari localStorage jika ada
    const savedModelId = localStorage.getItem('selectedModelId');
    if (savedModelId) {
        const savedModel = AI_MODELS.find(m => m.id === savedModelId);
        if (savedModel) {
            selectedModel = savedModel;
            updateModelSelectorButton();
        }
    } else {
        updateModelSelectorButton();
    }
});
