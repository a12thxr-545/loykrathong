/**
 * Romantic Loy Krathong Web Audio Engine
 * Generates ambient music, water sounds, and festival SFX entirely via Web Audio API.
 * No external sound files required!
 */

class RomanticAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.ambienceNode = null;
    this.isMuted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.scale = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50 // C6
    ];
    this.bassNotes = [130.81, 164.81, 196.00, 220.00]; // C3, E3, G3, A3
    this.melodyStep = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startAmbience();
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Gentle night water river stream ambience
  startAmbience() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pink / brown noise
        lastOut = output[i];
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      const ambienceGain = this.ctx.createGain();
      ambienceGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(ambienceGain);
      ambienceGain.connect(this.masterGain);

      whiteNoise.start(0);
      this.ambienceNode = whiteNoise;
    } catch (e) {
      console.warn("Ambience setup error:", e);
    }
  }

  toggleMusic() {
    this.ensureContext();
    if (this.isPlayingMusic) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  startMusic() {
    if (this.isPlayingMusic) return;
    this.ensureContext();
    this.isPlayingMusic = true;
    this.scheduleNextArpeggio();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // Romantic Thai Pentatonic / Music Box Arpeggio
  scheduleNextArpeggio() {
    if (!this.isPlayingMusic || !this.ctx) return;

    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C major
      [220.00, 261.63, 329.63, 440.00], // A minor
      [174.61, 261.63, 329.63, 392.00], // F major7
      [196.00, 246.94, 293.66, 392.00]  // G major
    ];

    const currentChordIndex = Math.floor(this.melodyStep / 8) % chords.length;
    const currentChord = chords[currentChordIndex];

    // Pick note from chord or scale
    const note = (this.melodyStep % 4 === 0) 
      ? currentChord[0] 
      : (Math.random() > 0.4 
          ? currentChord[Math.floor(Math.random() * currentChord.length)]
          : this.scale[Math.floor(Math.random() * this.scale.length)]);

    const octaveShift = Math.random() > 0.7 ? 2 : 1;
    this.playBellNote(note * (octaveShift === 2 ? 1.5 : 1), 0.15, 1.8);

    // Warm bass on beat 0
    if (this.melodyStep % 8 === 0) {
      this.playBassNote(currentChord[0] / 2, 0.25, 3.0);
    }

    this.melodyStep++;
    const tempo = 420; // gentle, peaceful tempo (ms)
    this.musicTimer = setTimeout(() => this.scheduleNextArpeggio(), tempo);
  }

  playBellNote(freq, volume = 0.1, duration = 1.5) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Sine + slight overtone for music box / gamelan / chime sweetness
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  playBassNote(freq, volume = 0.2, duration = 2.5) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // --- Sound Effects ---

  // Spark / match lighting candle
  playCandleLight() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Match strike hiss (noise burst)
    const bufferSize = this.ctx.sampleRate * 0.2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2500, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);

    // Warm chime harmonic
    setTimeout(() => {
      this.playChime(784, 0.25); // G5
      setTimeout(() => this.playChime(1046.5, 0.2), 120); // C6
    }, 150);
  }

  // Crystal blessing chime
  playChime(freq = 880, vol = 0.2) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.6);
  }

  // Water ripple / placing krathong in water
  playWaterSplash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Firework launch whistle
  playFireworkLaunch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.45);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Firework burst & crackle
  playFireworkBurst() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Bass boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(140, now);
    boomOsc.frequency.exponentialRampToValueAtTime(35, now + 0.4);

    boomGain.gain.setValueAtTime(0.4, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    boomOsc.connect(boomGain);
    boomGain.connect(this.sfxGain);

    boomOsc.start(now);
    boomOsc.stop(now + 0.5);

    // Sparkle noise crackle
    const bufferSize = this.ctx.sampleRate * 0.6;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.18, now);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(crackleGain);
    crackleGain.connect(this.sfxGain);

    noise.start(now);
  }

  // Cute heart pop sound
  playHeartPop() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }
}

window.romanticAudio = new RomanticAudioEngine();
