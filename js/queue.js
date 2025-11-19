import { state } from './state.js';
import { escapeHtml, formatDuration, getElapsedTime } from './utils.js';

export function renderQueue() {
    const queueList = document.getElementById('queueList');
    
    // Update queue stats
    updateQueueStats();
    
    if (state.generationQueue.length === 0) {
        queueList.innerHTML = `
            <div class="empty-queue">
                <i class="fa-solid fa-inbox"></i>
                <div class="empty-queue-text">No generations yet</div>
            </div>
        `;
        return;
    }

    queueList.innerHTML = state.generationQueue.map(item => {
        let timeDisplay = '';
        
        if (item.status === 'processing' && item.startTime) {
            const elapsed = getElapsedTime(item.startTime);
            timeDisplay = `
                <div class="queue-item-time">
                    <i class="fa-solid fa-clock"></i>
                    <span>${formatDuration(elapsed)}</span>
                </div>
            `;
        } else if (item.status === 'completed' && item.startTime && item.endTime) {
            const totalTime = item.endTime - item.startTime;
            timeDisplay = `
                <div class="queue-item-time">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>${formatDuration(totalTime)}</span>
                </div>
            `;
        } else if (item.status === 'failed' && item.startTime && item.endTime) {
            const totalTime = item.endTime - item.startTime;
            timeDisplay = `
                <div class="queue-item-time">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <span>${formatDuration(totalTime)}</span>
                </div>
            `;
        }
        
        const params = item.retryData || {};
        
        return `
            <div class="queue-item ${item.status}">
                <div class="queue-item-header">
                    <div class="queue-item-header-left">
                        <span class="queue-item-id">
                            <i class="fa-solid fa-hashtag"></i>${item.id.substring(0, 8)}
                        </span>
                        <span class="queue-item-status status-${item.status}">
                            ${item.status === 'processing' ? '<i class="fa-solid fa-spinner fa-spin"></i>' : ''} 
                            ${item.status}
                        </span>
                    </div>
                    <div class="queue-item-header-right">
                        ${timeDisplay}
                    </div>
                </div>
                
                <div class="queue-item-body">
                    <div class="queue-item-section prompt-section">
                        <div class="queue-section-label">Prompt</div>
                        <div class="queue-prompt-container">
                            <div class="queue-item-prompt full-text">${escapeHtml(item.prompt)}</div>
                            <button class="copy-prompt-btn" onclick="copyPrompt('${escapeHtml(item.prompt).replace(/'/g, "\\'")}', this)" title="Copy Prompt">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                        ${params.negativePrompt ? `
                            <div class="queue-section-label" style="margin-top: 0.5rem;">Negative Prompt</div>
                            <div class="queue-item-prompt negative-prompt full-text">${escapeHtml(params.negativePrompt)}</div>
                        ` : ''}
                    </div>

                    <div class="queue-item-section params-section">
                        <div class="queue-section-label">Parameters</div>
                        <div class="params-grid">
                            <div class="param-item">
                                <span class="param-label">Resolution</span>
                                <span class="param-value">${item.resolution || (params.width ? `${params.width}×${params.height}` : 'N/A')}</span>
                            </div>
                            <div class="param-item">
                                <span class="param-label">Length</span>
                                <span class="param-value">${item.frames || params.length || 'N/A'}</span>
                            </div>
                            <div class="param-item">
                                <span class="param-label">Steps</span>
                                <span class="param-value">${params.steps || 'N/A'}</span>
                            </div>
                            <div class="param-item">
                                <span class="param-label">CFG</span>
                                <span class="param-value">${params.cfg || 'N/A'}</span>
                            </div>
                            <div class="param-item">
                                <span class="param-label">Seed</span>
                                <span class="param-value">${params.seed || 'N/A'}</span>
                            </div>
                             ${params.loraPairs && params.loraPairs.length ? `
                                <div class="param-item">
                                    <span class="param-label">LoRAs</span>
                                    <span class="param-value">${params.loraPairs.length} active</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${item.status === 'processing' ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                    </div>
                ` : ''}
                
                ${item.status === 'completed' ? `
                    <div class="queue-item-success-message">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>Video downloaded successfully</span>
                    </div>
                ` : ''}
                
                ${item.status === 'failed' ? `
                    <div class="queue-item-error-message">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <strong>Error:</strong> ${escapeHtml(item.error || 'Unknown error')}
                    </div>
                ` : ''}

                <div class="queue-item-actions">
                    ${item.status === 'processing' ? `
                        <button class="action-button action-button-cancel" onclick="cancelJob('${item.id}')">
                            <i class="fa-solid fa-xmark"></i>
                            <span class="button-text">Cancel</span>
                        </button>
                    ` : ''}
                    
                    ${item.retryData ? `
                        <button class="action-button" onclick="remixJob('${item.id}')">
                            <i class="fa-solid fa-sliders"></i>
                            <span class="button-text">Remix</span>
                        </button>
                    ` : ''}
                    
                    ${item.status === 'failed' && item.retryData ? `
                        <button class="action-button action-button-retry" onclick="retryJob('${item.id}')">
                            <i class="fa-solid fa-rotate-right"></i>
                            <span class="button-text">Retry</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).reverse().join('');
}

function updateQueueStats() {
    const processing = state.generationQueue.filter(item => item.status === 'processing').length;
    const completed = state.generationQueue.filter(item => item.status === 'completed').length;
    const failed = state.generationQueue.filter(item => item.status === 'failed').length;
    
    const processingEl = document.getElementById('processingCount');
    const completedEl = document.getElementById('completedCount');
    const failedEl = document.getElementById('failedCount');
    
    if (processingEl) processingEl.textContent = processing;
    if (completedEl) completedEl.textContent = completed;
    if (failedEl) failedEl.textContent = failed;
}

export function loadQueue() {
    const saved = localStorage.getItem('wan22_queue');
    if (saved) {
        try {
            state.generationQueue = JSON.parse(saved);
            console.log(`✅ Loaded ${state.generationQueue.length} items from queue`);
            renderQueue();
        } catch (error) {
            console.error('Failed to load queue:', error);
            localStorage.removeItem('wan22_queue');
            state.generationQueue = [];
        }
    }
}

export function saveQueue() {
    try {
        const queueToSave = state.generationQueue.map(item => {
            const { videoData, ...itemWithoutVideo } = item;
            return itemWithoutVideo;
        });
        
        const queueJSON = JSON.stringify(queueToSave);
        
        if (queueJSON.length > 4 * 1024 * 1024) {
            console.warn('⚠️ Queue too large, removing old completed items');
            const filteredQueue = state.generationQueue
                .filter(item => item.status === 'processing')
                .concat(
                    state.generationQueue
                        .filter(item => item.status !== 'processing')
                        .slice(-20)
                );
            
            const filteredQueueToSave = filteredQueue.map(item => {
                const { videoData, ...itemWithoutVideo } = item;
                return itemWithoutVideo;
            });
            
            localStorage.setItem('wan22_queue', JSON.stringify(filteredQueueToSave));
        } else {
            localStorage.setItem('wan22_queue', queueJSON);
        }
    } catch (error) {
        console.error('❌ Failed to save queue:', error);
    }
}

export function cleanupQueue() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    
    const initialLength = state.generationQueue.length;
    
    state.generationQueue = state.generationQueue.filter(item => {
        if (item.status === 'processing') return true;
        if (!item.timestamp) return true;
        
        const age = now - item.timestamp;
        return age < maxAge;
    });
    
    const removed = initialLength - state.generationQueue.length;
    if (removed > 0) {
        console.log(`🧹 Cleaned up ${removed} old items from queue`);
        saveQueue();
        renderQueue();
    }
}

export function resumeQueuePolling() {
    cleanupQueue();
    
    state.generationQueue.forEach(item => {
        if (item.status === 'processing') {
            console.log('Resuming polling for job:', item.id);
            import('./api.js').then(module => {
                module.pollJobStatus(item.id);
            });
        } else if (item.status === 'completed') {
            state.downloadedJobs.add(item.id);
            console.log(`Marked job ${item.id} as already downloaded`);
        }
    });
}
