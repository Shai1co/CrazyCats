/**
 * Procedural Sound Manager using Web Audio API
 * All sounds generated programmatically - no external audio files needed
 */
export default class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.3;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not available');
      this.enabled = false;
    }
  }

  // Ensure context is resumed (browsers require user gesture)
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  // --- Core sound primitives ---

  playTone(freq, duration, type = 'sine', volume = 0.3, detune = 0) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    const vol = volume * this.masterVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playNoise(duration, volume = 0.1, filter = 'lowpass', filterFreq = 800) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filt = this.ctx.createBiquadFilter();
    filt.type = filter;
    filt.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    const vol = volume * this.masterVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filt);
    filt.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(now);
    source.stop(now + duration);
  }

  // --- Game Sound Effects ---

  meow() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const baseFreq = 400 + Math.random() * 300;

    // Main meow tone with pitch bend
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + 0.1);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, now + 0.3);

    const vol = 0.15 * this.masterVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.setValueAtTime(vol, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    // Harmonic overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2, now);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 2.5, now + 0.1);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.3);

    gain2.gain.setValueAtTime(vol * 0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.35);
  }

  angryMeow() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const baseFreq = 300 + Math.random() * 100;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.15);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.6, now + 0.4);

    const vol = 0.12 * this.masterVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);

    // Hiss noise
    this.playNoise(0.2, 0.06, 'highpass', 3000);
  }

  // Feed action - crunchy eating sound
  feedSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playNoise(0.06, 0.15, 'bandpass', 1200 + Math.random() * 800);
        this.playTone(200 + Math.random() * 100, 0.05, 'square', 0.05);
      }, i * 80);
    }
  }

  // Clean action - sparkle/chime
  cleanSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const notes = [800, 1000, 1200, 1400];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.12);
        this.playTone(freq * 1.5, 0.2, 'sine', 0.05);
      }, i * 60);
    });
  }

  // Entertain action - bouncy playful
  entertainSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const notes = [400, 500, 600, 800];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'triangle', 0.15);
      }, i * 70);
    });
    // Playful slide up
    setTimeout(() => {
      this.playTone(600, 0.2, 'sine', 0.1, 100);
    }, 300);
  }

  // Power-up collected
  powerUpSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const notes = [400, 500, 600, 800, 1000, 1200];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.1);
        this.playTone(freq * 1.5, 0.15, 'triangle', 0.05);
      }, i * 50);
    });
  }

  // Button click / UI
  clickSound() {
    this.playTone(600, 0.08, 'square', 0.08);
    this.playTone(800, 0.06, 'sine', 0.05);
  }

  // Combo hit
  comboSound(comboLevel) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const baseFreq = 400 + comboLevel * 100;
    this.playTone(baseFreq, 0.15, 'triangle', 0.12);
    setTimeout(() => {
      this.playTone(baseFreq * 1.25, 0.12, 'sine', 0.1);
    }, 60);
    if (comboLevel >= 3) {
      setTimeout(() => {
        this.playTone(baseFreq * 1.5, 0.15, 'sine', 0.08);
      }, 120);
    }
  }

  // Random event
  eventSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    this.playTone(300, 0.1, 'square', 0.08);
    setTimeout(() => {
      this.playTone(250, 0.15, 'square', 0.06);
    }, 100);
  }

  // Crash / knock event
  crashSound() {
    this.playNoise(0.3, 0.2, 'lowpass', 500);
    this.playTone(100, 0.2, 'square', 0.1);
  }

  // Game over
  gameOverSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'sawtooth', 0.1);
        this.playTone(freq * 0.5, 0.5, 'sine', 0.08);
      }, i * 200);
    });
    setTimeout(() => {
      this.playNoise(0.5, 0.08, 'lowpass', 200);
    }, 800);
  }

  // Warning alarm (crazy meter high)
  warningSound() {
    this.playTone(800, 0.1, 'square', 0.06);
    setTimeout(() => {
      this.playTone(600, 0.1, 'square', 0.06);
    }, 120);
  }

  // Milestone celebration
  milestoneSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.1);
        this.playTone(freq * 0.5, 0.25, 'triangle', 0.05);
      }, i * 100);
    });
  }

  // Wake up cat
  wakeUpSound() {
    this.playTone(300, 0.15, 'triangle', 0.1);
    setTimeout(() => {
      this.playTone(500, 0.1, 'sine', 0.08);
    }, 100);
  }

  // Start game
  startSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const notes = [262, 330, 392, 523]; // C E G C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'triangle', 0.12);
      }, i * 80);
    });
  }

  // New high score fanfare
  highScoreSound() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const melody = [523, 659, 784, 1047, 784, 1047];
    melody.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.25, 'sine', 0.1);
        this.playTone(freq * 0.5, 0.2, 'triangle', 0.06);
      }, i * 120);
    });
  }
}

// Singleton
export const soundManager = new SoundManager();
