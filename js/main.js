import { state } from './state.js';
import { resolutionPresets, availableLoraModels } from './config.js';
import { escapeHtml } from './utils.js';

// Import all modules
import * as queueModule from './queue.js';
import * as cropModule from './crop.js';
import * as apiModule from './api.js';
import * as settingsModule from './settings.js';
import * as healthModule from './health.js';
import * as loraModule from './lora.js';
import * as resolutionModule from './resolution.js';
import * as imageModule from './image.js';

// ============================================
// EXPOSE FUNCTIONS TO WINDOW FOR ONCLICK
// ============================================

window.openCropModal = cropModule.openCropModal;
window.closeCropModal = cropModule.closeCropModal;
window.applyCrop = cropModule.applyCrop;
window.openSettings = settingsModule.openSettings;
window.closeSettings = settingsModule.closeSettings;
window.saveSettings = settingsModule.saveSettings;
window.handleImageSelect = imageModule.handleImageSelect;
window.toggleLoraSection = loraModule.toggleLoraSection;
window.addLoraPair = loraModule.addLoraPair;
window.removeLoraPair = loraModule.removeLoraPair;
window.handleSubmit = handleSubmit;
window.cancelJob = cancelJob;
window.retryJob = retryJob;
window.clearCompletedItems = clearCompletedItems;
window.cancelAllJobs = cancelAllJobs;
window.toggleSidebar = toggleSidebar;

// ============================================
// FORM SUBMISSION
// ============================================

async function handleSubmit(event) {
    event.preventDefault();
    
    if (!state.apiConfig.endpoint || !state.apiConfig.apiKey) {
        alert('Please configure API settings first');
        settingsModule.openSettings();
        return;
    }

    if (!state.selectedImage) {
        alert('Please select an image');
        return;
    }

    if (!state.selectedImage.startsWith('data:image/')) {
        alert('Invalid image format. Please select a valid image.');
        return;
    }

    const loraPairs = loraModule.collectLoraPairs();

    const formData = {
        prompt: document.getElementById('positivePrompt').value,
        negativePrompt: document.getElementById('negativePrompt').value,
        image: state.selectedImage,
        loraPairs: loraPairs,
        width: state.selectedResolution.width,
        height: state.selectedResolution.height,
        length: parseInt(document.getElementById('videoLength').value) || 81,
        steps: parseInt(document.getElementById('videoSteps').value) || 10,
        seed: parseInt(document.getElementById('videoSeed').value) || 42,
        cfg: parseFloat(document.getElementById('videoCfg').value) || 2.0,
        timestamp: Date.now()
    };

    await apiModule.submitGeneration(formData);
}

// ============================================
// QUEUE ACTIONS
// ============================================

async function cancelJob(jobId, silent = false) {
    if (!silent && !confirm('Are you sure you want to cancel this generation?')) {
        return;
    }

    try {
        console.log(`Cancelling job: ${jobId}`);
        
        const response = await fetch(`${state.apiConfig.endpoint}/cancel/${jobId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': state.apiConfig.apiKey
            }
        });

        if (response.ok) {
            const queueItem = state.generationQueue.find(item => item.id === jobId);
            if (queueItem) {
                queueItem.status = 'failed';
                queueItem.error = 'Cancelled by user';
                queueItem.endTime = Date.now();
                queueModule.saveQueue();
                queueModule.renderQueue();
            }
            
            if (!silent) {
                alert('✅ Job cancelled successfully');
            }
        } else {
            throw new Error(`Failed to cancel: ${response.status}`);
        }
    } catch (error) {
        console.error('Cancel error:', error);
        if (!silent) {
            alert(`❌ Failed to cancel job: ${error.message}`);
        }
    }
}

async function retryJob(jobId) {
    const queueItem = state.generationQueue.find(item => item.id === jobId);
    if (!queueItem || !queueItem.retryData) {
        alert('Cannot retry this job - no retry data available');
        return;
    }

    if (!confirm('Retry this generation with the same parameters?')) {
        return;
    }

    state.downloadedJobs.delete(jobId);
    await apiModule.submitGeneration(queueItem.retryData);
}

function clearCompletedItems() {
    const completedCount = state.generationQueue.filter(item => 
        item.status === 'completed' || item.status === 'failed'
    ).length;
    
    if (completedCount === 0) {
        alert('No completed items to clear');
        return;
    }
    
    if (!confirm(`Clear ${completedCount} completed/failed item(s) from queue?`)) {
        return;
    }
    
    state.generationQueue = state.generationQueue.filter(item => 
        item.status === 'processing'
    );
    
    queueModule.saveQueue();
    queueModule.renderQueue();
    
    console.log(`✅ Cleared ${completedCount} completed items`);
}

async function cancelAllJobs() {
    const processingJobs = state.generationQueue.filter(item => item.status === 'processing');
    
    if (processingJobs.length === 0) {
        alert('No active jobs to cancel');
        return;
    }
    
    if (!confirm(`Cancel ${processingJobs.length} active job(s)?`)) {
        return;
    }
    
    for (const job of processingJobs) {
        try {
            await cancelJob(job.id, true);
        } catch (error) {
            console.error(`Failed to cancel job ${job.id}:`, error);
        }
    }
    
    alert(`✅ Cancelled ${processingJobs.length} job(s)`);
}

// ============================================
// SIDEBAR TOGGLE (Mobile)
// ============================================

function toggleSidebar() {
    const panel = document.getElementById('generationPanel');
    const queuePanel = document.getElementById('queuePanel');
    const hamburger = document.getElementById('hamburgerButton');

    if (!panel || !queuePanel || !hamburger) {
        return;
    }

    const willOpen = panel.classList.contains('collapsed');

    if (willOpen) {
        panel.classList.remove('collapsed');
        queuePanel.classList.remove('expanded');
    } else {
        panel.classList.add('collapsed');
        queuePanel.classList.add('expanded');
    }

    const sidebarOpen = !panel.classList.contains('collapsed');
    hamburger.classList.toggle('active', sidebarOpen);
    document.body.classList.toggle('sidebar-open', sidebarOpen);
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768) {
        const panel = document.getElementById('generationPanel');
        const hamburger = document.getElementById('hamburgerButton');
        const queuePanel = document.getElementById('queuePanel');

        if (!panel || !queuePanel || !hamburger) {
            return;
        }

        if (!panel.contains(event.target) &&
            !hamburger.contains(event.target) &&
            !panel.classList.contains('collapsed')) {
            panel.classList.add('collapsed');
            queuePanel.classList.add('expanded');
            hamburger.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const panel = document.getElementById('generationPanel');
    const queuePanel = document.getElementById('queuePanel');
    const hamburger = document.getElementById('hamburgerButton');

    if (!panel || !queuePanel) {
        return;
    }

    if (window.innerWidth > 768) {
        panel.classList.remove('collapsed');
        queuePanel.classList.remove('expanded');
        hamburger?.classList.remove('active');
    } else if (!hamburger?.classList.contains('active')) {
        panel.classList.add('collapsed');
        queuePanel.classList.add('expanded');
    }

    document.body.classList.remove('sidebar-open');
});

// CRITICAL: Run IMMEDIATELY before anything else
(function() {
    // Set viewport height immediately
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // On mobile, ensure sidebar starts collapsed
    if (window.innerWidth <= 768) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            const panel = document.getElementById('generationPanel');
            if (panel) {
                panel.classList.add('collapsed');
            }
        });
    }
})();

// Add viewport height fix IMMEDIATELY (before DOM load)
function setMobileViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set immediately
setMobileViewportHeight();

// Initialize sidebar state on load
function initializeSidebarState() {
    const panel = document.getElementById('generationPanel');
    const queuePanel = document.getElementById('queuePanel');
    const hamburger = document.getElementById('hamburgerButton');

    if (!panel || !queuePanel) {
        console.warn('Sidebar elements not found during initialization');
        return;
    }

    if (window.innerWidth <= 768) {
        panel.classList.add('collapsed');
        queuePanel.classList.add('expanded');
    } else {
        panel.classList.remove('collapsed');
        queuePanel.classList.remove('expanded');
    }

    document.body.classList.remove('sidebar-open');
    hamburger?.classList.remove('active');
}

// Set on load and resize
window.addEventListener('load', setMobileViewportHeight);
window.addEventListener('resize', setMobileViewportHeight);
window.addEventListener('orientationchange', setMobileViewportHeight);

// Ensure we have an initial value as early as possible
setMobileViewportHeight();

// ============================================
// DRAG AND DROP / PASTE IMAGE UPLOAD
// ============================================

function initializeImageUpload() {
    // Prevent default drag behaviors on the entire document
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight entire page when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        document.body.addEventListener(eventName, () => {
            document.body.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, () => {
            document.body.classList.remove('drag-over');
        }, false);
    });
    
    // Handle dropped files anywhere on the page
    document.body.addEventListener('drop', handleDrop, false);
    
    // Handle paste events
    document.addEventListener('paste', handlePaste, false);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
}

function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                handleImageFile(file);
                e.preventDefault();
                break;
            }
        }
    }
}

function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please drop/paste a valid image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Store the original uncropped image
        state.originalImage = e.target.result;
        state.selectedImage = null; // Clear any previously selected image
        
        // Load image into crop modal
        const cropImage = document.getElementById('cropImage');
        if (cropImage) {
            cropImage.src = state.originalImage;
            cropImage.onload = function() {
                // Open crop modal after image is loaded
                cropModule.openCropModal();
            };
        }
        
        // Show a brief notification
        showImageUploadNotification();
    };
    reader.readAsDataURL(file);
}

function showImageUploadNotification() {
    const notification = document.createElement('div');
    notification.className = 'upload-notification';
    notification.textContent = '✓ Image uploaded - Please crop';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ============================================
// THEME MANAGEMENT
// ============================================

const THEME_STORAGE_KEY = 'wan22_theme';
const prefersDarkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme, persist = true) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    state.theme = normalized;
    document.documentElement.setAttribute('data-theme', normalized);
    if (persist) localStorage.setItem(THEME_STORAGE_KEY, normalized);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.checked = normalized === 'dark';
        toggle.setAttribute(
            'aria-label',
            normalized === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        );
    }
}

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
applyTheme(savedTheme || (prefersDarkMediaQuery.matches ? 'dark' : 'light'), false);

prefersDarkMediaQuery.addEventListener('change', (event) => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(event.matches ? 'dark' : 'light', false);
    }
});

function initializeThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle || toggle.dataset.bound) return;
    toggle.checked = state.theme === 'dark';
    toggle.addEventListener('change', () => applyTheme(toggle.checked ? 'dark' : 'light'));
    toggle.dataset.bound = 'true';
}

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
    console.log('Initializing app...');

    setMobileViewportHeight();
    initializeSidebarState();
    initializeThemeToggle();
    initializeImageUpload();

    settingsModule.loadSettings();
    queueModule.loadQueue();
    queueModule.resumeQueuePolling();
    cropModule.initializeCropHandlers();

    if (state.apiConfig.endpoint && state.apiConfig.apiKey) {
        healthModule.startHealthCheck();
    }

    setInterval(() => {
        if (state.generationQueue.some(item => item.status === 'processing')) {
            queueModule.renderQueue();
        }
    }, 1000);

    requestAnimationFrame(() => {
        document.body.classList.add('app-ready');
        console.log('App ready - panels visible');
    });

    console.log('App initialized successfully');
}

window.addEventListener('load', () => {
    if (!document.body.classList.contains('app-ready')) {
        document.body.classList.add('app-ready');
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
