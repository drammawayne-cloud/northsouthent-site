Cinematic entrance
==================

Install dependencies in this folder with npm install, then run npm run build. The output is assets/cinema-v3.js. The scene physically extrudes the transparent logo outline, composites a photorealistic jaguar run cycle with grounded jumps, and flies the camera through the compass toward Earth. Audio is a licensed jaguar recording, sustained and layered with Web Audio. Credits are on intro-credits.html.

The entrance runs once per browser session; index.html?intro=1 replays it. introFrame=1.4 can hold a pose for visual QA. The logo face uses an unlit, non-tone-mapped material to preserve its source colors. Sound is attempted automatically at scene start. The intro has no buttons. If a browser blocks audio, an ordinary tap or keypress during the intro resumes the soundtrack at the matching point; the visual sequence never waits for audio. Reduced motion and WebGL failure both provide direct access to the site.
