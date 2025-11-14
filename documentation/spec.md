# WAN 2.2 image-to-video video generation app using Runpod

- Simple model minimilistic UI
- User can provide positive and negative prompt
- User can provide starting image
- Add an option to select a bunch of available and recommended resolution for WAN2.2
- Add ui to select "length": 81,
    "steps": 10,
    "seed": 42,
    "cfg": 2.0
    Keep these as default values.
- user can select high and low LORA pair
- user can keep track of the progress of individual generation
- user can keep queue up multiple generation
- use local storage to keep track of activities across session
- Generated videos are automatically downloaded
- API key won't be stored in the code. have a settings option that opens a modal where user can provide their own endpoint and api key.
- use semantic css and class/fucntion names




# Layout update
- Make generation panel a docked left panel with the generate buttone fixed/sticky at the bottom.
    - Make the left panel scrollable within itself 
- Queue is the main content
    - Queue scroll is at the body level.
- Have a strategy to support lower resolution screen and mobile screen. Make it responsive layout.
- The left panel collapses with animation to a hamburger icon for lower resolution screens.



# Resolutions

LANDSCAPE (16:9)
Tier	Name	Resolution (width×height)	Notes
⚡ Draft	640×360	Fastest; ideal for prompt testing	
⚡ Draft	854×480	“480p”; light GPU usage	
⚙️ Standard	960×540	Middle ground; cleaner detail	
⚙️ Standard	1280×720	Official 720p; most common	
💎 High	1920×1080	1080p; heavy VRAM, smooth motion	
💎 High	2560×1440	1440p; cinematic testing	
💎 Ultra	3840×2160	4K UHD; requires powerful GPU (A100 / H100)	
📱 PORTRAIT (9:16)
Tier	Name	Resolution (width×height)	Notes
⚡ Draft	360×640	Very fast; preview only	
⚡ Draft	480×832	Used in RunPod template examples	
⚙️ Standard	540×960	Cleaner vertical detail	
⚙️ Standard	720×1280	True 720p vertical (TikTok/Reel format)	
💎 High	1080×1920	1080p portrait; realistic motion	
💎 High	1440×2560	2.5K portrait; for cinematic I2V	
💎 Ultra	2160×3840	4K portrait; extreme quality, huge VRAM	
🟩 SQUARE (1:1)
Tier	Name	Resolution (width×height)	Notes
⚡ Draft	512×512	Fastest; commonly used test size	
⚡ Draft	640×640	Slightly better detail	
⚙️ Standard	720×720	Balanced; smooth diffusion structure	
⚙️ Standard	832×832	Matches many ComfyUI workflows	
💎 High	1024×1024	High-quality square (social-ready)	
💎 High	1280×1280	For close-up or art-style renders	
💎 Ultra	2048×2048	4K square; very heavy workload	
🧠 PRACTICAL SHORTLIST (for everyday use)
Purpose	Landscape	Portrait	Square
🔍 Quick draft	640×360	480×832	512×512
⚙️ Standard test	1280×720	720×1280	832×832
💎 Final render	1920×1080	1080×1920	1024×1024