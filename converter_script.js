document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const formatSelect = document.getElementById('format-select');
    const convertBtn = document.getElementById('convert-btn');
    const uploadSection = document.getElementById('upload-section');
    const progressSection = document.getElementById('progress-section');
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const downloadBtn = document.getElementById('download-btn');
    const convertAnotherBtn = document.getElementById('convert-another-btn');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    
    // --- State ---
    let selectedFile = null;
    const BACKEND_URL = 'https://ulucay-file-converter-124999888102.europe-west1.run.app';

    // --- Format Options ---
    const formatOptions = {
        Görüntü: ['jpg', 'png', 'webp', 'bmp', 'tiff', 'svg', 'gif'],
        Video: ['mp4', 'mkv', 'webm', 'mov', 'avi'],
        Ses: ['mp3', 'wav', 'ogg', 'flac'],
        Belge: ['pdf', 'docx', 'html', 'md', 'txt', 'odt', 'rtf'],
        EKitap: ['epub', 'mobi'],
        Tablo: ['csv', 'xlsx'],
        Sunum: ['pptx', 'odp'],
        Kod: ['tex']
    };

    // --- Functions ---
    const populateFormatSelect = () => {
        formatSelect.innerHTML = '';
        for (const group in formatOptions) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group;
            formatOptions[group].forEach(format => {
                const option = document.createElement('option');
                option.value = format;
                option.textContent = format.toUpperCase();
                optgroup.appendChild(option);
            });
            formatSelect.appendChild(optgroup);
        }
    };
    
    const handleFileSelect = (file) => {
        if (!file) return;
        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        convertBtn.disabled = false;
        errorSection.classList.add('hidden');
    };
    
    const resetUI = () => {
        uploadSection.classList.remove('hidden');
        progressSection.classList.add('hidden');
        downloadBtn.classList.add('hidden');
        convertAnotherBtn.classList.add('hidden');
        errorSection.classList.add('hidden');
        
        fileInput.value = '';
        selectedFile = null;
        fileNameDisplay.textContent = '';
        convertBtn.disabled = true;
        
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusMessage.textContent = 'Dönüştürülüyor...';
    };

    const showError = (message) => {
        errorMessage.textContent = `Bir hata oluştu: ${message}`;
        errorSection.classList.remove('hidden');
        uploadSection.classList.remove('hidden'); // Show upload section again
        progressSection.classList.add('hidden'); // Hide progress
    };

    const pollJobStatus = (jobId) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/status/${jobId}`);
                if (!response.ok) {
                    throw new Error('Sunucu durum sorgusuna yanıt vermedi.');
                }
                const data = await response.json();

                statusMessage.textContent = data.message;
                progressBar.style.width = `${data.progress}%`;
                progressText.textContent = `${data.progress}%`;

                if (data.status === 'completed') {
                    clearInterval(interval);
                    statusMessage.textContent = 'Dönüştürme Tamamlandı!';
                    progressBar.style.width = `100%`;
                    progressText.textContent = `100%`;
                    downloadBtn.classList.remove('hidden');
                    convertAnotherBtn.classList.remove('hidden');
                    downloadBtn.onclick = () => {
                         window.location.href = `${BACKEND_URL}/download/${jobId}`;
                    };
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    showError(data.message);
                }
            } catch (error) {
                clearInterval(interval);
                showError(error.message);
            }
        }, 2000);
    };

    const convertFile = async () => {
        if (!selectedFile) {
            showError("Lütfen önce bir dosya seçin.");
            return;
        }

        uploadSection.classList.add('hidden');
        progressSection.classList.remove('hidden');
        errorSection.classList.add('hidden');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('format', formatSelect.value);

        try {
            const response = await fetch(`${BACKEND_URL}/convert`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Bilinmeyen bir sunucu hatası oluştu.');
            }
            
            pollJobStatus(data.jobId);

        } catch (error) {
            console.error('Dönüştürme hatası:', error);
            showError(error.message);
        }
    };
    
    // --- Event Listeners ---
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFileSelect(fileInput.files[0]));
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelect(files[0]);
    });

    convertBtn.addEventListener('click', convertFile);
    convertAnotherBtn.addEventListener('click', resetUI);
    
    // --- Initialization ---
    populateFormatSelect();
    resetUI();
});
