import { state } from './state.js';
import { resolutionPresets } from './config.js';

// This file now only handles resolution state updates
// Resolution selection UI is in crop.js

export function updateResolutionDisplay() {
    const res = state.selectedResolution;
    
    // Update sidebar display
    document.getElementById('selectedTier').textContent = res.tier;
    document.getElementById('selectedTier').className = `resolution-badge badge-${res.tier}`;
    document.getElementById('selectedResolution').textContent = res.name;
    document.getElementById('selectedAspect').textContent = res.aspect;
    
    console.log(`Resolution display updated: ${res.name} (${res.width}×${res.height})`);
}

// Remove old dropdown functions - no longer needed
// populateResolutions, toggleResolutionDropdown, selectResolutionFromDropdown are removed
