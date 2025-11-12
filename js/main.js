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
    
    panel.classList.toggle('collapsed');
    queuePanel.classList.toggle('expanded');
    hamburger.classList.toggle('active');
    
    // Add/remove overlay effect on queue when sidebar is open on mobile
    if (window.innerWidth <= 768) {
        queuePanel.classList.toggle('with-sidebar');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768) {
        const panel = document.getElementById('generationPanel');
        const hamburger = document.getElementById('hamburgerButton');
        const queuePanel = document.getElementById('queuePanel');
        
        if (!panel.contains(event.target) && 
            !hamburger.contains(event.target) && 
            !panel.classList.contains('collapsed')) {
            panel.classList.add('collapsed');
            queuePanel.classList.remove('with-sidebar');
            hamburger.classList.remove('active');
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const panel = document.getElementById('generationPanel');
    const queuePanel = document.getElementById('queuePanel');
    const hamburger = document.getElementById('hamburgerButton');
    
    if (window.innerWidth > 768) {
        // Desktop: always show sidebar
        panel.classList.remove('collapsed');
        queuePanel.classList.remove('expanded');
        queuePanel.classList.remove('with-sidebar');
        hamburger.classList.remove('active');
    } else {
        // Mobile: collapse by default
        if (!hamburger.classList.contains('active')) {
            panel.classList.add('collapsed');
            queuePanel.classList.add('expanded');
        }
    }
});

// Initialize sidebar state on load
function initializeSidebarState() {
    if (window.innerWidth <= 768) {
        const panel = document.getElementById('generationPanel');
        const queuePanel = document.getElementById('queuePanel');
        panel.classList.add('collapsed');
        queuePanel.classList.add('expanded');
    }
}

// Add viewport height fix for mobile browsers
function setMobileViewportHeight() {
    // Get the actual viewport height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Also update on orientation change
    console.log(`Viewport height updated: ${window.innerHeight}px (--vh: ${vh}px)`);
}

// Set on load and resize
window.addEventListener('load', setMobileViewportHeight);
window.addEventListener('resize', setMobileViewportHeight);
window.addEventListener('orientationchange', () => {
    // Add small delay for orientation change
    setTimeout(setMobileViewportHeight, 100);
});

// Force update on touchstart (helps with iOS Safari)
let touchStarted = false;
document.addEventListener('touchstart', () => {
    if (!touchStarted) {
        touchStarted = true;
        setMobileViewportHeight();
    }
}, { once: true });

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
    settingsModule.loadSettings();
    queueModule.loadQueue();
    queueModule.resumeQueuePolling();
    cropModule.initializeCropHandlers();
    
    if (state.apiConfig.endpoint && state.apiConfig.apiKey) {
        healthModule.startHealthCheck();
    }
    
    // Update queue display every second for elapsed time
    setInterval(() => {
        if (state.generationQueue.some(item => item.status === 'processing')) {
            queueModule.renderQueue();
        }
    }, 1000);

    initializeSidebarState();
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initializeApp);
