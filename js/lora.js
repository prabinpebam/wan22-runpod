import { state } from './state.js';
import { availableLoraModels } from './config.js';

export function toggleLoraSection() {
    const checkbox = document.getElementById('useAdditionalLora');
    const section = document.getElementById('loraSection');
    
    if (checkbox.checked) {
        section.style.display = 'block';
        if (state.loraPairCount === 0) {
            addLoraPair();
        }
    } else {
        section.style.display = 'none';
    }
}

export function addLoraPair() {
    if (state.loraPairCount >= 4) {
        alert('Maximum 4 LORA pairs allowed');
        return;
    }

    state.loraPairCount++;
    const container = document.getElementById('loraPairsContainer');
    
    const pairDiv = document.createElement('div');
    pairDiv.className = 'lora-pair';
    pairDiv.id = `loraPair${state.loraPairCount}`;
    pairDiv.style.cssText = 'border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;';
    
    pairDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span style="font-size: 0.875rem; font-weight: 600;">LORA Pair ${state.loraPairCount}</span>
            <button type="button" onclick="removeLoraPair(${state.loraPairCount})" style="background: none; border: none; color: var(--error-color); cursor: pointer; font-size: 1.25rem;">&times;</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div>
                <label class="form-label" style="font-size: 0.75rem;">High LORA</label>
                <select id="loraHigh${state.loraPairCount}" class="form-select">
                    <option value="">Select High LORA</option>
                    ${availableLoraModels.map(model => `<option value="${model}">${model}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="form-label" style="font-size: 0.75rem;">Low LORA</label>
                <select id="loraLow${state.loraPairCount}" class="form-select">
                    <option value="">Select Low LORA</option>
                    ${availableLoraModels.map(model => `<option value="${model}">${model}</option>`).join('')}
                </select>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
                <label class="form-label" style="font-size: 0.75rem;">High Weight</label>
                <input type="number" id="loraHighWeight${state.loraPairCount}" class="form-input" value="1.0" step="0.1" min="0" max="2">
            </div>
            <div>
                <label class="form-label" style="font-size: 0.75rem;">Low Weight</label>
                <input type="number" id="loraLowWeight${state.loraPairCount}" class="form-input" value="1.0" step="0.1" min="0" max="2">
            </div>
        </div>
    `;
    
    container.appendChild(pairDiv);
    
    if (state.loraPairCount >= 4) {
        document.getElementById('addLoraButton').style.display = 'none';
    }
}

export function removeLoraPair(pairId) {
    const pairDiv = document.getElementById(`loraPair${pairId}`);
    if (pairDiv) {
        pairDiv.remove();
        state.loraPairCount--;
        
        if (state.loraPairCount < 4) {
            document.getElementById('addLoraButton').style.display = 'block';
        }
        
        const container = document.getElementById('loraPairsContainer');
        const pairs = container.children;
        state.loraPairCount = 0;
        
        Array.from(pairs).forEach((pair) => {
            state.loraPairCount++;
            pair.id = `loraPair${state.loraPairCount}`;
            const label = pair.querySelector('span');
            if (label) label.textContent = `LORA Pair ${state.loraPairCount}`;
            
            pair.querySelector('[id^="loraHigh"]').id = `loraHigh${state.loraPairCount}`;
            pair.querySelector('[id^="loraLow"]').id = `loraLow${state.loraPairCount}`;
            pair.querySelector('[id^="loraHighWeight"]').id = `loraHighWeight${state.loraPairCount}`;
            pair.querySelector('[id^="loraLowWeight"]').id = `loraLowWeight${state.loraPairCount}`;
            
            const removeBtn = pair.querySelector('button[onclick^="removeLoraPair"]');
            if (removeBtn) removeBtn.setAttribute('onclick', `removeLoraPair(${state.loraPairCount})`);
        });
    }
}

export function collectLoraPairs() {
    const useAdditionalLora = document.getElementById('useAdditionalLora').checked;
    
    if (!useAdditionalLora) {
        return [];
    }

    const loraPairs = [];
    
    for (let i = 1; i <= state.loraPairCount; i++) {
        const highSelect = document.getElementById(`loraHigh${i}`);
        const lowSelect = document.getElementById(`loraLow${i}`);
        const highWeightInput = document.getElementById(`loraHighWeight${i}`);
        const lowWeightInput = document.getElementById(`loraLowWeight${i}`);
        
        if (highSelect && lowSelect) {
            const highValue = highSelect.value;
            const lowValue = lowSelect.value;
            
            if (highValue && lowValue) {
                loraPairs.push({
                    high: highValue,
                    low: lowValue,
                    high_weight: parseFloat(highWeightInput.value) || 1.0,
                    low_weight: parseFloat(lowWeightInput.value) || 1.0
                });
            }
        }
    }
    
    return loraPairs;
}
