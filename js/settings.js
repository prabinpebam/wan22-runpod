import { state } from './state.js';
import { startHealthCheck } from './health.js';

export function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('apiEndpoint').value = state.apiConfig.endpoint;
    document.getElementById('apiKey').value = state.apiConfig.apiKey;
}

export function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

export function saveSettings(event) {
    event.preventDefault();
    state.apiConfig.endpoint = document.getElementById('apiEndpoint').value;
    state.apiConfig.apiKey = document.getElementById('apiKey').value;
    localStorage.setItem('wan22_api_config', JSON.stringify(state.apiConfig));
    closeSettings();
    
    startHealthCheck();
    
    alert('Settings saved successfully!');
}

export function loadSettings() {
    const saved = localStorage.getItem('wan22_api_config');
    if (saved) {
        state.apiConfig = JSON.parse(saved);
    }
}
