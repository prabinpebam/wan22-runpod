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
            timeDisplay = `<span class="time-tag">${formatDuration(elapsed)}</span>`;
        } else if ((item.status === 'completed' || item.status === 'failed') && item.startTime && item.endTime) {
            const totalTime = item.endTime - item.startTime;
            timeDisplay = `<span class="time-tag">${formatDuration(totalTime)}</span>`;
        }
        
        const params = item.retryData || {};
        const isDownloaded = state.downloadedJobs.has(item.id);
        
        return `
            <div class="queue-item ${item.status}">
                <div class="queue-item-header">
                    <div class="queue-header-left">
                        <span class="queue-id">#${item.id.substring(0, 6)}</span>
                        <span class="queue-status status-${item.status}">
                            ${item.status === 'processing' ? '<i class="fa-solid fa-spinner fa-spin"></i>' : ''}
                            ${item.status}
                        </span>
                    </div>
                    <div class="queue-header-right">
                        ${timeDisplay}
                        <div class="queue-actions">
                            ${item.status === 'completed' ? `
                                <button class="queue-btn" title="${isDownloaded ? 'Downloaded' : 'Download Status'}" style="${isDownloaded ? 'color: var(--success-color)' : ''}">
                                    <i class="fa-solid ${isDownloaded ? 'fa-circle-check' : 'fa-download'}"></i>
                                </button>
                            ` : ''}
                            <button class="queue-btn" onclick="remixJob('${item.id}')" title="Remix Parameters">
                                <i class="fa-solid fa-sliders"></i>
                            </button>
                            ${item.status === 'processing' ? `
                                <button class="queue-btn" onclick="cancelJob('${item.id}')" title="Cancel Generation">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            ` : `
                                <button class="queue-btn" onclick="cancelJob('${item.id}', true)" title="Remove from Queue">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
                
                ${item.status === 'processing' ? `
                    <div class="progress-bar"><div class="progress-fill" style="width: ${item.progress}%"></div></div>
                ` : ''}

                <div class="queue-item-body">
                    <div class="queue-prompts">
                        <div class="prompt-block">
                            <span class="prompt-label">Prompt</span>
                            <div class="prompt-text" onclick="copyPrompt('${escapeHtml(item.prompt).replace(/'/g, "\\'")}', this)" title="Click to copy">${escapeHtml(item.prompt)}</div>
                        </div>
                        ${params.negativePrompt ? `
                            <div class="prompt-block">
                                <span class="prompt-label">Negative</span>
                                <div class="prompt-text negative">${escapeHtml(params.negativePrompt)}</div>
                            </div>
                        ` : ''}
                        ${item.error ? `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(item.error)}</div>` : ''}
                    </div>

                    <div class="queue-params">
                        <div class="param-cell">
                            <span class="param-label">Res</span>
                            <span class="param-value">${item.resolution || (params.width ? `${params.width}x${params.height}` : 'N/A')}</span>
                        </div>
                        <div class="param-cell">
                            <span class="param-label">Frames</span>
                            <span class="param-value">${item.frames || params.length || 'N/A'}</span>
                        </div>
                        <div class="param-cell">
                            <span class="param-label">Steps</span>
                            <span class="param-value">${params.steps || 'N/A'}</span>
                        </div>
                        <div class="param-cell">
                            <span class="param-label">CFG</span>
                            <span class="param-value">${params.cfg || 'N/A'}</span>
                        </div>
                        <div class="param-cell">
                            <span class="param-label">Seed</span>
                            <span class="param-value">${params.seed || 'N/A'}</span>
                        </div>
                        ${params.loraPairs && params.loraPairs.length ? `
                            <div class="param-cell">
                                <span class="param-label">LoRAs</span>
                                <span class="param-value">${params.loraPairs.length}</span>
                            </div>
                        ` : ''}
                    </div>
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
