import { state } from './state.js';
import { compressImageIfNeeded } from './utils.js';
import { resolutionPresets } from './config.js';

export function openCropModal() {
    if (!state.originalImage) return;
    
    const modal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    
    // Populate resolution selector in crop modal
    populateCropResolutions();
    
    cropImage.src = state.originalImage;
    modal.classList.add('active');
    
    cropImage.onload = function() {
        setTimeout(() => {
            initializeCropArea();
        }, 150);
    };
}

export function closeCropModal() {
    document.getElementById('cropModal').classList.remove('active');
}

function populateCropResolutions() {
    const container = document.getElementById('cropResolutionSelector');
    if (!container) return;
    
    const grouped = {
        landscape: resolutionPresets.filter(r => r.aspect === 'landscape'),
        portrait: resolutionPresets.filter(r => r.aspect === 'portrait'),
        square: resolutionPresets.filter(r => r.aspect === 'square')
    };

    let html = '';
    
    Object.entries(grouped).forEach(([aspect, resolutions]) => {
        html += `<div class="crop-resolution-group">
            <div class="crop-resolution-group-title">${aspect.toUpperCase()} ${aspect === 'landscape' ? '(16:9)' : aspect === 'portrait' ? '(9:16)' : '(1:1)'}</div>`;
        
        resolutions.forEach((res) => {
            const isSelected = res.width === state.selectedResolution.width && 
                             res.height === state.selectedResolution.height;
            html += `
                <button type="button" 
                        class="crop-resolution-btn ${isSelected ? 'selected' : ''}" 
                        onclick="selectCropResolution(${res.width}, ${res.height}, '${res.tier}', '${res.aspect}', '${res.name}')">
                    <span class="resolution-badge badge-${res.tier}">${res.tier}</span>
                    <span>${res.name}</span>
                </button>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

window.selectCropResolution = function(width, height, tier, aspect, name) {
    state.selectedResolution = { width, height, tier, aspect, name };
    
    // Update sidebar display immediately
    document.getElementById('selectedTier').textContent = tier;
    document.getElementById('selectedTier').className = `resolution-badge badge-${tier}`;
    document.getElementById('selectedResolution').textContent = name;
    document.getElementById('selectedAspect').textContent = aspect;
    
    // Update crop modal buttons
    document.querySelectorAll('.crop-resolution-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.closest('.crop-resolution-btn').classList.add('selected');
    
    // Update crop modal stats
    document.getElementById('cropTargetRes').textContent = `${width}×${height}`;
    
    // Reinitialize crop area with new aspect ratio
    initializeCropArea();
    
    console.log(`Resolution changed: ${name} (${width}×${height})`);
};

function initializeCropArea() {
    const container = document.getElementById('cropContainer');
    const image = document.getElementById('cropImage');
    const overlay = document.getElementById('cropOverlay');
    
    if (!image.complete || !image.naturalWidth) {
        console.warn('Image not fully loaded');
        return;
    }
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width - 40; // padding
    const containerHeight = containerRect.height - 40;
    
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const imageRatio = naturalWidth / naturalHeight;
    
    let displayWidth, displayHeight;
    
    if (imageRatio > containerWidth / containerHeight) {
        displayWidth = Math.min(containerWidth, naturalWidth);
        displayHeight = displayWidth / imageRatio;
    } else {
        displayHeight = Math.min(containerHeight, naturalHeight);
        displayWidth = displayHeight * imageRatio;
    }
    
    image.style.width = displayWidth + 'px';
    image.style.height = displayHeight + 'px';
    
    setTimeout(() => {
        const imgRect = image.getBoundingClientRect();
        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;
        
        const targetRatio = state.selectedResolution.width / state.selectedResolution.height;
        const currentImageRatio = imgWidth / imgHeight;
        
        let cropWidth, cropHeight;
        
        if (currentImageRatio > targetRatio) {
            cropHeight = imgHeight * 0.9;
            cropWidth = cropHeight * targetRatio;
        } else {
            cropWidth = imgWidth * 0.9;
            cropHeight = cropWidth / targetRatio;
        }
        
        cropWidth = Math.min(cropWidth, imgWidth);
        cropHeight = Math.min(cropHeight, imgHeight);
        
        const cropX = imgLeft + (imgWidth - cropWidth) / 2;
        const cropY = imgTop + (imgHeight - cropHeight) / 2;
        
        state.cropData = {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight,
            imageLeft: imgLeft,
            imageTop: imgTop,
            imageWidth: imgWidth,
            imageHeight: imgHeight
        };
        
        updateCropOverlay();
        updateCropInfo();
        
        console.log('Crop area initialized:', {
            natural: { width: naturalWidth, height: naturalHeight },
            displayed: { width: imgWidth, height: imgHeight, left: imgLeft, top: imgTop },
            crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
        });
    }, 50);
}

function updateCropOverlay() {
    const overlay = document.getElementById('cropOverlay');
    overlay.style.left = state.cropData.x + 'px';
    overlay.style.top = state.cropData.y + 'px';
    overlay.style.width = state.cropData.width + 'px';
    overlay.style.height = state.cropData.height + 'px';
}

function updateCropInfo() {
    document.getElementById('cropCurrentSize').textContent = 
        `${Math.round(state.cropData.width)}×${Math.round(state.cropData.height)}`;
    
    document.getElementById('cropImageSize').textContent = 
        `${Math.round(state.cropData.imageWidth)}×${Math.round(state.cropData.imageHeight)}`;
}

export function initializeCropHandlers() {
    const overlay = document.getElementById('cropOverlay');
    const handles = document.querySelectorAll('.crop-handle');
    
    overlay.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('crop-handle')) return;
        state.isDragging = true;
        state.dragStart = { 
            x: e.clientX - state.cropData.x, 
            y: e.clientY - state.cropData.y 
        };
        e.preventDefault();
        e.stopPropagation();
    });
    
    handles.forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            state.isResizing = true;
            state.resizeHandle = handle.classList[1];
            state.dragStart = { x: e.clientX, y: e.clientY };
            e.stopPropagation();
            e.preventDefault();
        });
    });
    
    document.addEventListener('mousemove', function(e) {
        if (state.isDragging) {
            handleDrag(e);
        } else if (state.isResizing) {
            handleResize(e);
        }
    });
    
    document.addEventListener('mouseup', function() {
        state.isDragging = false;
        state.isResizing = false;
        state.resizeHandle = null;
    });
    
    // ALT key listeners
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            state.isAltKeyPressed = true;
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            state.isAltKeyPressed = false;
        }
    });
}

function handleDrag(e) {
    const image = document.getElementById('cropImage');
    const imgRect = image.getBoundingClientRect();
    const container = document.getElementById('cropContainer');
    const containerRect = container.getBoundingClientRect();
    
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const imgRight = imgLeft + imgRect.width;
    const imgBottom = imgTop + imgRect.height;
    
    let newX = e.clientX - state.dragStart.x;
    let newY = e.clientY - state.dragStart.y;
    
    newX = Math.max(imgLeft, Math.min(newX, imgRight - state.cropData.width));
    newY = Math.max(imgTop, Math.min(newY, imgBottom - state.cropData.height));
    
    state.cropData.x = newX;
    state.cropData.y = newY;
    
    updateCropOverlay();
    updateCropInfo();
}

function handleResize(e) {
    const image = document.getElementById('cropImage');
    const imgRect = image.getBoundingClientRect();
    const container = document.getElementById('cropContainer');
    const containerRect = container.getBoundingClientRect();
    
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;
    
    const targetRatio = state.selectedResolution.width / state.selectedResolution.height;
    
    const deltaX = e.clientX - state.dragStart.x;
    const deltaY = e.clientY - state.dragStart.y;
    
    let newWidth = state.cropData.width;
    let newHeight = state.cropData.height;
    let newX = state.cropData.x;
    let newY = state.cropData.y;
    
    if (state.isAltKeyPressed) {
        const centerX = state.cropData.x + state.cropData.width / 2;
        const centerY = state.cropData.y + state.cropData.height / 2;
        
        const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
        
        if (state.resizeHandle === 'handle-se' || state.resizeHandle === 'handle-nw') {
            newWidth = state.cropData.width + (state.resizeHandle === 'handle-se' ? delta * 2 : -delta * 2);
        } else if (state.resizeHandle === 'handle-ne' || state.resizeHandle === 'handle-sw') {
            newWidth = state.cropData.width + (state.resizeHandle === 'handle-ne' ? delta * 2 : -delta * 2);
        }
        
        newHeight = newWidth / targetRatio;
        newX = centerX - newWidth / 2;
        newY = centerY - newHeight / 2;
    } else {
        if (state.resizeHandle === 'handle-se') {
            newWidth = state.cropData.width + deltaX;
            newHeight = newWidth / targetRatio;
        } else if (state.resizeHandle === 'handle-nw') {
            newWidth = state.cropData.width - deltaX;
            newHeight = newWidth / targetRatio;
            newX = state.cropData.x + deltaX;
            newY = state.cropData.y + (state.cropData.height - newHeight);
        } else if (state.resizeHandle === 'handle-ne') {
            newWidth = state.cropData.width + deltaX;
            newHeight = newWidth / targetRatio;
            newY = state.cropData.y + (state.cropData.height - newHeight);
        } else if (state.resizeHandle === 'handle-sw') {
            newWidth = state.cropData.width - deltaX;
            newHeight = newWidth / targetRatio;
            newX = state.cropData.x + deltaX;
        }
    }
    
    const minSize = 50;
    newWidth = Math.max(minSize, newWidth);
    newHeight = newWidth / targetRatio;
    
    if (newX < imgLeft) { 
        newWidth = state.cropData.width + (state.cropData.x - imgLeft);
        newHeight = newWidth / targetRatio;
        newX = imgLeft;
    }
    if (newY < imgTop) { 
        newHeight = state.cropData.height + (state.cropData.y - imgTop);
        newWidth = newHeight * targetRatio;
        newY = imgTop;
    }
    if (newX + newWidth > imgLeft + imgWidth) { 
        newWidth = (imgLeft + imgWidth) - newX;
        newHeight = newWidth / targetRatio;
    }
    if (newY + newHeight > imgTop + imgHeight) { 
        newHeight = (imgTop + imgHeight) - newY;
        newWidth = newHeight * targetRatio;
    }
    
    if (newWidth > imgWidth || newHeight > imgHeight) {
        if (imgWidth / imgHeight > targetRatio) {
            newHeight = imgHeight;
            newWidth = newHeight * targetRatio;
        } else {
            newWidth = imgWidth;
            newHeight = newWidth / targetRatio;
        }
        newX = imgLeft + (imgWidth - newWidth) / 2;
        newY = imgTop + (imgHeight - newHeight) / 2;
    }
    
    state.cropData.x = newX;
    state.cropData.y = newY;
    state.cropData.width = newWidth;
    state.cropData.height = newHeight;
    
    state.dragStart = { x: e.clientX, y: e.clientY };
    
    updateCropOverlay();
    updateCropInfo();
}

export async function applyCrop() {
    const image = document.getElementById('cropImage');
    const container = document.getElementById('cropContainer');
    
    const imgRect = image.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    
    const img = new Image();
    img.onload = async function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = state.selectedResolution.width;
        canvas.height = state.selectedResolution.height;
        
        const scaleX = img.width / imgRect.width;
        const scaleY = img.height / imgRect.height;
        
        const cropXActual = (state.cropData.x - imgLeft) * scaleX;
        const cropYActual = (state.cropData.y - imgTop) * scaleY;
        const cropWidthActual = state.cropData.width * scaleX;
        const cropHeightActual = state.cropData.height * scaleY;
        
        console.log('Applying crop:', {
            displayed: { x: state.cropData.x - imgLeft, y: state.cropData.y - imgTop, width: state.cropData.width, height: state.cropData.height },
            actual: { x: cropXActual, y: cropYActual, width: cropWidthActual, height: cropHeightActual },
            scale: { x: scaleX, y: scaleY }
        });
        
        ctx.drawImage(
            img,
            cropXActual,
            cropYActual,
            cropWidthActual,
            cropHeightActual,
            0,
            0,
            canvas.width,
            canvas.height
        );
        
        let croppedImage = canvas.toDataURL('image/jpeg', 0.95);
        croppedImage = await compressImageIfNeeded(croppedImage);
        
        state.selectedImage = croppedImage;
        
        console.log('✅ Image cropped successfully:', {
            resolution: `${canvas.width}×${canvas.height}`,
            sizeMB: Math.round(croppedImage.length / 1024 / 1024 * 10) / 10
        });
        
        // Update preview and show re-crop button
        document.getElementById('imagePreview').src = state.selectedImage;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('recropButton').style.display = 'inline-block';
        
        // Final update of resolution display in sidebar
        const res = state.selectedResolution;
        document.getElementById('selectedTier').textContent = res.tier;
        document.getElementById('selectedTier').className = `resolution-badge badge-${res.tier}`;
        document.getElementById('selectedResolution').textContent = res.name;
        document.getElementById('selectedAspect').textContent = res.aspect;
        
        closeCropModal();
    };
    
    img.onerror = function(error) {
        console.error('❌ Error loading image for crop:', error);
        alert('Failed to process image. Please try again.');
    };
    
    img.src = state.originalImage;
}
