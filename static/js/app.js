// DOM elements
const form = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const errorMessage = document.getElementById('errorMessage');
const diagnosticBtn = document.getElementById('diagnosticBtn');
const diagnosticInfo = document.getElementById('diagnostic-info');
const serverStatus = document.getElementById('server-status');

// Global variables
let currentDownloadId = null;
let progressInterval = null;

// Event listeners
form.addEventListener('submit', function(e) {
    e.preventDefault();
    startDownload();
});

diagnosticBtn.addEventListener('click', async function() {
    await runDiagnostics();
});

// Main download function
function startDownload() {
    const url = urlInput.value.trim();
    if (!url) return;
    
    // Reset UI
    resetErrorState();
    setDownloadingState();
    
    // Send download request
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}`
    })
    .then(response => response.json())
    .then(data => {
        currentDownloadId = data.download_id;
        startProgressPolling();
    })
    .catch(error => {
        showError('Failed to start download: ' + error.message);
        resetUI();
    });
}

// Progress polling
function startProgressPolling() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(() => {
        if (!currentDownloadId) return;
        
        fetch(`/progress/${currentDownloadId}`)
            .then(response => response.json())
            .then(data => {
                updateProgress(data);
            })
            .catch(error => {
                console.error('Progress fetch error:', error);
            });
    }, 1000); // Poll every second
}

// Progress update handler
function updateProgress(data) {
    switch(data.status) {
        case 'downloading':
            updateDownloadProgress(data);
            break;
            
        case 'completed':
            handleDownloadComplete(data);
            break;
            
        case 'error':
            showError(data.message || 'Download failed');
            clearInterval(progressInterval);
            resetUI();
            break;
    }
}

// Update download progress
function updateDownloadProgress(data) {
    const percent = data.percent_num || 0;
    progressBar.style.width = percent + '%';
    progressText.textContent = data.percent || '0%';
    
    // Dynamic color: red to green based on percentage
    const greenIntensity = Math.min(255, Math.floor(percent * 2.55));
    progressBar.style.background = `rgb(${255-greenIntensity}, ${greenIntensity}, 50)`;
}

// Handle download completion
function handleDownloadComplete(data) {
    progressBar.style.width = '100%';
    progressText.textContent = '100%';
    progressBar.style.background = '#4CAF50';
    
    // Auto-download
    if (data.download_url) {
        setTimeout(() => {
            window.location.href = data.download_url;
        }, 500);
    }
    
    clearInterval(progressInterval);
    resetUI();
}

// Diagnostic function
async function runDiagnostics() {
    diagnosticInfo.style.display = 'block';
    serverStatus.textContent = 'Checking...';
    
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            serverStatus.innerHTML = `
                ✅ ${data.environment.toUpperCase()} | 
                IP: ${data.server_ip} | 
                YouTube: ${data.youtube_accessible ? '✅' : '❌' + (data.youtube_error ? ' (' + data.youtube_error + ')' : '')}
            `;
        } else {
            serverStatus.innerHTML = `❌ Error: ${data.error}`;
        }
    } catch (error) {
        serverStatus.innerHTML = `❌ Connection error: ${error.message}`;
    }
}

// UI state management functions
function setDownloadingState() {
    progressContainer.style.display = 'block';
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
}

function resetErrorState() {
    errorMessage.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    progressContainer.style.display = 'none';
}

function resetUI() {
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Start Download';
}
