import { state } from './state.js';
import { openCropModal } from './crop.js';

export function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            state.originalImage = e.target.result;
            state.selectedImage = e.target.result;
            
            console.log('Image loaded:', {
                type: file.type,
                size: file.size,
                base64Length: state.selectedImage.length
            });
            
            if (state.selectedImage.length > 5 * 1024 * 1024) {
                console.warn('⚠️ Large image detected, will compress before upload');
            }
            
            document.getElementById('imagePreview').src = state.selectedImage;
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('fileLabel').textContent = file.name;
            
            setTimeout(() => openCropModal(), 100);
        };
        reader.onerror = function(error) {
            console.error('Error reading file:', error);
            alert('Failed to read image file');
        };
        reader.readAsDataURL(file);
    }
}
