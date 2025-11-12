import { state } from './state.js';
import { extractBase64FromDataURI, compressImageIfNeeded } from './utils.js';
import { saveQueue, renderQueue } from './queue.js';
import { downloadVideo } from './download.js';

export async function submitGeneration(formData) {
    if (!formData.image.startsWith('data:image/')) {
        console.error('Invalid image format:', formData.image.substring(0, 100));
        alert('Invalid image format. Please select a valid image file.');
        return;
    }

    let processedImage = formData.image;
    if (formData.image.length > 8 * 1024 * 1024) {
        console.log('⚠️ Image too large, compressing...');
        processedImage = await compressImageIfNeeded(formData.image);
    }

    const pureBase64 = extractBase64FromDataURI(processedImage);

    console.log('=== Submitting Generation Request ===');
    console.log('Size (MB):', Math.round(pureBase64.length / 1024 / 1024 * 10) / 10);

    const requestBody = {
        input: {
            prompt: formData.prompt,
            image_base64: pureBase64,
            seed: formData.seed,
            cfg: formData.cfg,
            width: formData.width,
            height: formData.height,
            length: formData.length,
            steps: formData.steps
        }
    };

    if (formData.negativePrompt && formData.negativePrompt.trim()) {
        requestBody.input.negative_prompt = formData.negativePrompt;
    }

    if (formData.loraPairs && formData.loraPairs.length > 0) {
        requestBody.input.lora_pairs = formData.loraPairs;
    }

    try {
        const response = await fetch(`${state.apiConfig.endpoint}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': state.apiConfig.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        const queueItem = {
            id: result.id || `gen_${Date.now()}`,
            status: 'processing',
            prompt: formData.prompt,
            timestamp: formData.timestamp,
            progress: 0,
            resolution: `${formData.width}×${formData.height}`,
            frames: formData.length,
            retryData: formData,
            startTime: Date.now()
        };

        state.generationQueue.push(queueItem);
        saveQueue();
        renderQueue();
        
        pollJobStatus(queueItem.id);
        
        alert(`✅ Video generation started!\n\nJob ID: ${queueItem.id.substring(0, 12)}`);
        
    } catch (error) {
        console.error('=== Generation Error ===', error);
        alert(`❌ Failed to start generation\n\n${error.message}`);
    }
}

export async function pollJobStatus(jobId) {
    const maxAttempts = 240;
    let attempts = 0;

    const queueItem = state.generationQueue.find(item => item.id === jobId);

    const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
            const statusResponse = await fetch(`${state.apiConfig.endpoint}/status/${jobId}`, {
                headers: { 'Authorization': state.apiConfig.apiKey }
            });
            
            if (!statusResponse.ok) {
                console.warn(`Job ${jobId}: Status ${statusResponse.status}`);
                return;
            }

            const result = await statusResponse.json();
            
            if (!result || !result.status) {
                console.warn(`Job ${jobId}: Invalid response`);
                return;
            }

            console.log(`Job ${jobId}: ${result.status}`);
            processJobStatus(result, jobId, queueItem, pollInterval);
            
        } catch (error) {
            console.warn(`Polling error (${attempts}):`, error.message);
        }

        if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (queueItem && queueItem.status === 'processing') {
                queueItem.status = 'failed';
                queueItem.error = 'Timeout';
                queueItem.endTime = Date.now();
                saveQueue();
                renderQueue();
            }
        }
    }, 5000);
}

function processJobStatus(result, jobId, queueItem, pollInterval) {
    if (!queueItem) {
        clearInterval(pollInterval);
        return;
    }

    const status = result.status.toUpperCase();

    if (status === 'COMPLETED') {
        clearInterval(pollInterval);
        queueItem.status = 'completed';
        queueItem.progress = 100;
        queueItem.endTime = Date.now();
        
        // Get video data - check common locations
        const videoData = result.output?.video || result.output || result.video;
        
        if (videoData && !state.downloadedJobs.has(jobId)) {
            console.log(`✅ Video ready for job ${jobId}`);
            state.downloadedJobs.add(jobId);
            downloadVideo(videoData, jobId);
        } else if (!videoData) {
            queueItem.status = 'failed';
            queueItem.error = 'No video data in response';
            console.error(`❌ No video data for ${jobId}`);
        }
        
        saveQueue();
        renderQueue();
        
    } else if (status === 'FAILED') {
        clearInterval(pollInterval);
        queueItem.status = 'failed';
        queueItem.error = result.error || 'Job failed';
        queueItem.endTime = Date.now();
        saveQueue();
        renderQueue();
        console.log(`❌ Job ${jobId} failed: ${queueItem.error}`);
        
    } else if (status === 'IN_PROGRESS' || status === 'IN_QUEUE') {
        queueItem.progress = Math.min(90, (Date.now() - queueItem.startTime) / 2000);
        saveQueue();
        renderQueue();
    }
}
