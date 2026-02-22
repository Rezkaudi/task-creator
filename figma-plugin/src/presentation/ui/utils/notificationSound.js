/**
 * Plays a pleasant two-tone notification chime using the Web Audio API.
 * No external audio files required — works inside the Figma plugin iframe.
 */
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

export function playNotificationSound() {
    try {
        const ctx = getAudioContext();

        // Two-tone chime: first note then a higher note
        const notes = [
            { freq: 587.33, start: 0, duration: 0.12 },   // D5
            { freq: 880, start: 0.14, duration: 0.18 },    // A5
        ];

        notes.forEach(({ freq, start, duration }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Smooth envelope to avoid clicks
            gain.gain.setValueAtTime(0, ctx.currentTime + start);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration);
        });
    } catch (e) {
        // Silently ignore — audio isn't critical
        console.warn('Notification sound failed:', e);
    }
}
