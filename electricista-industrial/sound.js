"use strict";

/* =========================================================
   Efectos de sonido: clics de botones, chasquido de relé,
   aciertos/errores y conexion de cables — todo sintetizado
   con Web Audio API, sin archivos de audio externos.
   ========================================================= */

window.SFX = (() => {
  let ctx = null;
  let muted = localStorage.getItem("ei-sound-muted") === "1";

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, opts = {}) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + dur);
    const peak = opts.gain ?? 0.12;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // rafaga de ruido filtrado: sirve tanto para el "clack" mecanico de un
  // contactor como para el "chispazo" de un corto circuito
  function noiseBurst(dur, opts = {}) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime;
    const bufSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = opts.filterType || "bandpass";
    filter.frequency.value = opts.freq || 1200;
    filter.Q.value = opts.q || 1.2;
    const gain = c.createGain();
    gain.gain.setValueAtTime(opts.gain ?? 0.25, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(t0);
  }

  return {
    isMuted() { return muted; },
    setMuted(v) {
      muted = v;
      localStorage.setItem("ei-sound-muted", v ? "1" : "0");
    },
    // el primer sonido debe llamarse desde un gesto del usuario (clic) para
    // que el navegador permita crear/reanudar el AudioContext
    unlock() { ensureCtx(); },

    click() { tone(950, 0.05, { type: "square", gain: 0.06 }); },
    toggleSwitch() {
      tone(500, 0.06, { type: "square", gain: 0.07 });
      setTimeout(() => tone(720, 0.05, { type: "square", gain: 0.05 }), 40);
    },
    // chasquido mecanico de un contactor real al energizarse/desenergizarse
    relayOn() {
      noiseBurst(0.045, { freq: 2200, q: 2.5, gain: 0.35 });
      tone(180, 0.05, { type: "triangle", gain: 0.08 });
    },
    relayOff() { noiseBurst(0.03, { freq: 1400, q: 2.5, gain: 0.25 }); },
    // clic agudo al colocar/quitar un cable entre dos terminales
    connect() { tone(1300, 0.05, { type: "sine", gain: 0.06, freqEnd: 1700 }); },
    disconnect() { tone(1300, 0.05, { type: "sine", gain: 0.06, freqEnd: 900 }); },
    // corto circuito detectado al verificar: chispazo ruidoso
    spark() { noiseBurst(0.09, { freq: 2600, q: 0.9, gain: 0.4, filterType: "highpass" }); },

    success() {
      tone(660, 0.1, { type: "sine", gain: 0.1 });
      setTimeout(() => tone(880, 0.14, { type: "sine", gain: 0.1 }), 90);
      setTimeout(() => tone(1100, 0.18, { type: "sine", gain: 0.1 }), 180);
    },
    error() {
      tone(180, 0.22, { type: "sawtooth", gain: 0.12, freqEnd: 120 });
      setTimeout(() => tone(160, 0.2, { type: "sawtooth", gain: 0.1, freqEnd: 100 }), 120);
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-sound");
  if (!btn) return;
  function render() {
    const muted = SFX.isMuted();
    btn.textContent = muted ? "🔇" : "🔊";
    btn.classList.toggle("muted", muted);
  }
  render();
  btn.addEventListener("click", () => {
    SFX.unlock();
    SFX.setMuted(!SFX.isMuted());
    render();
    if (!SFX.isMuted()) SFX.click();
  });
});
