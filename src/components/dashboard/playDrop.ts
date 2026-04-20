type AudioCtxCtor = typeof AudioContext;
type WebkitAudioWindow = Window & { webkitAudioContext?: AudioCtxCtor };

let audioCtx: AudioContext | null = null;

export function playWaterDrop() {
  try {
    const Ctor =
      window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = audioCtx ?? new Ctor();
    const ctx = audioCtx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.16);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);

    const bs = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 3;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    noise.connect(bp).connect(ng).connect(ctx.destination);
    noise.start(t + 0.02);
    noise.stop(t + 0.55);
  } catch (err) {
    console.warn("playWaterDrop failed", err);
  }
}
