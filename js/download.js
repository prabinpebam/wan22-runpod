export function downloadVideo(base64Data, jobId) {
    try {
        console.log(`Downloading video for job ${jobId.substring(0, 8)}`);

        let blob;
        
        if (base64Data.startsWith('data:video/')) {
            // Data URI format
            const base64 = base64Data.split(',')[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'video/mp4' });
        } else {
            // Pure base64
            const binary = atob(base64Data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'video/mp4' });
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `wan22_${jobId.substring(0, 8)}_${timestamp}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log(`✅ Video downloaded: ${link.download}`);
        alert(`✅ Video downloaded!\n\n${link.download}`);
        
    } catch (error) {
        console.error('❌ Download error:', error);
        alert(`Error downloading video: ${error.message}`);
    }
}
