export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

export function extractBase64FromDataURI(dataURI) {
    if (dataURI.startsWith('data:')) {
        const parts = dataURI.split(',');
        if (parts.length === 2) {
            return parts[1];
        }
    }
    return dataURI;
}

export function formatDuration(ms) {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

export function getElapsedTime(timestamp) {
    if (!timestamp) return null;
    return Date.now() - timestamp;
}

export async function compressImageIfNeeded(base64Image, maxSizeBytes = 8 * 1024 * 1024) {
    return new Promise((resolve) => {
        if (base64Image.length < maxSizeBytes) {
            console.log('✅ Image size OK:', Math.round(base64Image.length / 1024 / 1024 * 10) / 10, 'MB');
            resolve(base64Image);
            return;
        }

        console.log('🔄 Compressing image from', Math.round(base64Image.length / 1024 / 1024 * 10) / 10, 'MB');

        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            let quality = 0.9;
            let compressed = canvas.toDataURL('image/jpeg', quality);
            
            while (compressed.length > maxSizeBytes && quality > 0.3) {
                quality -= 0.1;
                compressed = canvas.toDataURL('image/jpeg', quality);
            }
            
            console.log('✅ Compressed to', Math.round(compressed.length / 1024 / 1024 * 10) / 10, 'MB at quality', quality);
            resolve(compressed);
        };
        
        img.onerror = function() {
            console.error('Failed to compress image, using original');
            resolve(base64Image);
        };
        
        img.src = base64Image;
    });
}
