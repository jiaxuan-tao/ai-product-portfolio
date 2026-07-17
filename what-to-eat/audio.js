export function createAudioController({ enabled = true } = {}) {
  let isEnabled = Boolean(enabled);
  let context = null;
  let disposed = false;

  async function getContext() {
    if (!isEnabled || disposed || typeof window === "undefined") return null;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!context) context = new AudioContext();
    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return null;
      }
    }
    return context;
  }

  function playTone(audioContext, frequency, startAt, duration, volume) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  function tick() {
    void getContext().then((audioContext) => {
      if (!audioContext) return;
      playTone(audioContext, 680, audioContext.currentTime, 0.035, 0.035);
    });
  }

  function result() {
    void getContext().then((audioContext) => {
      if (!audioContext) return;
      const startAt = audioContext.currentTime;
      playTone(audioContext, 523.25, startAt, 0.12, 0.055);
      playTone(audioContext, 783.99, startAt + 0.1, 0.2, 0.07);
    });
  }

  function setEnabled(nextEnabled) {
    isEnabled = Boolean(nextEnabled);
  }

  function dispose() {
    disposed = true;
    if (context && typeof context.close === "function") {
      void context.close().catch(() => {});
    }
    context = null;
  }

  return {
    setEnabled,
    tick,
    result,
    dispose,
  };
}
