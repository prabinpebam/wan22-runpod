export const state = {
    generationQueue: [],
    selectedImage: null,
    originalImage: null,
    selectedResolution: { width: 480, height: 832, tier: 'draft', aspect: 'portrait', name: '480×832' },
    cropData: { x: 0, y: 0, width: 100, height: 100 },
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    dragStart: { x: 0, y: 0 },
    loraPairCount: 0,
    isAltKeyPressed: false,
    apiConfig: { endpoint: '', apiKey: '' },
    healthCheckInterval: null,
    apiHealth: { status: 'unknown', workers: { ready: 0, running: 0 } },
    downloadedJobs: new Set()
};
