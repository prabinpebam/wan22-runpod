import { state } from './state.js';

export async function checkAPIHealth() {
    if (!state.apiConfig.endpoint || !state.apiConfig.apiKey) {
        updateHealthIndicator({ status: 'unknown' });
        return;
    }

    try {
        const response = await fetch(`${state.apiConfig.endpoint}/health`, {
            headers: {
                'accept': 'application/json',
                'Authorization': state.apiConfig.apiKey
            }
        });

        if (response.ok) {
            const data = await response.json();
            state.apiHealth = data;
            updateHealthIndicator(data);
        } else {
            updateHealthIndicator({ status: 'error' });
        }
    } catch (error) {
        console.warn('Health check failed:', error);
        updateHealthIndicator({ status: 'error' });
    }
}

function updateHealthIndicator(health) {
    const indicator = document.getElementById('healthIndicator');
    if (!indicator) return;

    const isHealthy = health.status === 'running' || health.workers?.ready > 0;
    const dotClass = isHealthy ? 'healthy' : 'unhealthy';
    const containerClass = isHealthy ? 'health-healthy' : 'health-unhealthy';
    const icon = isHealthy ? 'fa-circle-check' : 'fa-circle-xmark';
    
    let statusText = 'Unknown';
    if (health.status === 'running' || health.workers?.ready > 0) {
        const ready = health.workers?.ready || 0;
        const running = health.workers?.running || 0;
        statusText = `${ready} Ready • ${running} Busy`;
    } else if (health.status === 'error') {
        statusText = 'Offline';
    }

    indicator.innerHTML = `
        <span class="health-indicator ${containerClass}">
            <i class="fa-solid ${icon}"></i>
            ${statusText}
        </span>
    `;
}

export function startHealthCheck() {
    checkAPIHealth();
    
    if (state.healthCheckInterval) {
        clearInterval(state.healthCheckInterval);
    }
    state.healthCheckInterval = setInterval(checkAPIHealth, 30000);
}

export function stopHealthCheck() {
    if (state.healthCheckInterval) {
        clearInterval(state.healthCheckInterval);
        state.healthCheckInterval = null;
    }
}
