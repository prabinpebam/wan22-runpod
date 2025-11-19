# WAN 2.2 Video Generator

A web client for orchestrating WAN-powered video generations with built-in cropping, resolution presets, queue tracking, and Teenage Engineering inspired theming.

## Features
- Image upload with crop-and-resolution workflow tailored to WAN 2.2 requirements.
- Prompt authoring, advanced generation parameters, and optional LoRA pairing.
- Responsive queue view with status-aware styling for light and dark modes.
- PWA-friendly shell with theme switching and persistent settings.

## Getting Started
1. Clone or download this repository.
2. Open `index.html` in a modern browser, or serve the project directory with any static HTTP server (for example, `python -m http.server`).
3. Configure the API endpoint and key inside the app before the first generation.

## Configuration
- Set the RunPod/WAN API endpoint and key via **Settings → Save Settings**; credentials are stored in `localStorage`.
- Resolutions and aspect ratios are managed in the crop modal (`cropResolutionSelector`).

## Theming
- Light mode favors warm studio neutrals.
- Dark mode embraces muted Teenage Engineering palettes; tweak CSS variables in `css/styles.css` or card overrides in `css/components.css`.

## License
MIT © 2024 WAN Labs
