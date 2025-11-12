// Resolution presets
export const resolutionPresets = [
    // Landscape
    { name: '640×360', width: 640, height: 360, tier: 'draft', aspect: 'landscape' },
    { name: '854×480', width: 854, height: 480, tier: 'draft', aspect: 'landscape' },
    { name: '1280×720', width: 1280, height: 720, tier: 'standard', aspect: 'landscape' },
    { name: '1920×1080', width: 1920, height: 1080, tier: 'high', aspect: 'landscape' },
    
    // Portrait
    { name: '360×640', width: 360, height: 640, tier: 'draft', aspect: 'portrait' },
    { name: '480×832', width: 480, height: 832, tier: 'draft', aspect: 'portrait' },
    { name: '720×1280', width: 720, height: 1280, tier: 'standard', aspect: 'portrait' },
    { name: '1080×1920', width: 1080, height: 1920, tier: 'high', aspect: 'portrait' },
    
    // Square
    { name: '512×512', width: 512, height: 512, tier: 'draft', aspect: 'square' },
    { name: '832×832', width: 832, height: 832, tier: 'standard', aspect: 'square' },
    { name: '1024×1024', width: 1024, height: 1024, tier: 'high', aspect: 'square' }
];

// Available LORA models
export const availableLoraModels = [
    'wan2.2_i2v_A14b_high_noise_lora_rank64_lightx2v_4step_xxx.safetensors',
    'wan2.2_i2v_A14b_low_noise_lora_rank64_lightx2v_4step_xxx.safetensors',
    'model_1.safetensors',
    'model_2.safetensors',
    'anime_style.safetensors',
    'realistic_motion.safetensors',
    'cinematic_v1.safetensors'
];
