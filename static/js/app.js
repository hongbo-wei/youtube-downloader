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
        // Directly try to download after backend finishes
        if (data.download_id) {
            setTimeout(() => {
                window.location.href = `/stream/${data.download_id}`;
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Start Download';
            }, 2000);
        } else {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Start Download';
        }
    })
    .catch(error => {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Start Download';
        alert('Failed to start download: ' + error.message);
    });
}
