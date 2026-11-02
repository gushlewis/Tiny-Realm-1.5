/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function haptic(type: "light" | "medium" | "heavy" | "warning" | "success" = "light") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      if (type === "light") navigator.vibrate(10);
      else if (type === "medium") navigator.vibrate(25);
      else if (type === "heavy") navigator.vibrate(45);
      else if (type === "warning") navigator.vibrate([40, 30, 40]);
      else if (type === "success") navigator.vibrate([15, 30, 35]);
    } catch {}
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  private ambientGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private bossOsc: {
    ctx: AudioContext;
    o1: OscillatorNode;
    o2: OscillatorNode;
    g: GainNode;
    lfo: OscillatorNode;
  } | null = null;
  private ambientTimer: any = null;

  // Meditative bell scale (D minor pentatonic contemplative frequencies)
  private readonly meditativeScale: number[] = [
    293.66, // D4
    349.23, // F4
    392.0,  // G4
    440.0,  // A4
    523.25, // C5
    587.33, // D5
  ];

  constructor() {
    try {
      const savedMute = localStorage.getItem("tinyrealm_audio_muted");
      if (savedMute !== null) {
        this.muted = savedMute === "true";
      }
    } catch {}

    // Unlock AudioContext on first user interaction (browser policy)
    if (typeof window !== "undefined") {
      const unlockAudio = () => {
        if (!this.muted) {
          this.init();
        }
      };
      window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
      window.addEventListener("keydown", unlockAudio, { once: true, passive: true });
    }
  }

  public init() {
    if (this.muted) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return;
      }
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    this.playAmbient();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem("tinyrealm_audio_muted", String(muted));
    } catch {}

    if (muted) {
      this.stopBossMusic();
      this.stopAmbient();
    } else {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      this.playAmbient();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setCombatMode(inCombat: boolean) {
    if (!this.ambientGain || !this.ctx || this.muted) return;
    try {
      // Gently soften ambient chimes during heavy combat, then restore
      const target = inCombat ? 0.015 : 0.035;
      this.ambientGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 1.2);
    } catch {}
  }

  // =========================================================================
  // ORIGINAL MEDITATIVE AMBIENT TONE & PEACEFUL BELLS
  // =========================================================================

  public playAmbient() {
    if (this.muted) return;
    if (!this.ctx) {
      this.init();
      return;
    }
    if (this.ambientGain) return; // Already running

    try {
      const a = this.ctx;
      const master = a.createGain();
      master.gain.value = 0;

      const filter = a.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;

      filter.connect(master).connect(a.destination);
      master.gain.linearRampToValueAtTime(0.035, a.currentTime + 2.5);
      this.ambientGain = master;

      // Soft, warm, deep meditative drone (peaceful sine wave at 146.83Hz D3)
      try {
        const drone = a.createOscillator();
        const droneG = a.createGain();
        const droneFilter = a.createBiquadFilter();
        drone.type = "sine";
        drone.frequency.value = 146.83;
        droneFilter.type = "lowpass";
        droneFilter.frequency.value = 380;
        droneG.gain.value = 0;
        drone.connect(droneFilter).connect(droneG).connect(master);
        droneG.gain.linearRampToValueAtTime(0.018, a.currentTime + 3.0);
        drone.start();
        this.droneOsc = drone;
        this.droneGain = droneG;
      } catch {}

      // Contemplative meditative singing bell scheduler
      const scheduleBell = () => {
        if (!this.ambientGain || this.muted || !this.ctx) return;
        try {
          const f = this.meditativeScale[Math.floor(Math.random() * this.meditativeScale.length)];
          const o = a.createOscillator();
          const g = a.createGain();
          o.type = "sine";
          o.frequency.value = f;
          g.gain.value = 0;
          o.connect(g).connect(this.ambientGain);

          const n = a.currentTime;
          // Smooth contemplative swell and long reverberant decay
          g.gain.setValueAtTime(0, n);
          g.gain.linearRampToValueAtTime(0.045, n + 0.45);
          g.gain.exponentialRampToValueAtTime(0.0004, n + 4.2);
          o.start(n);
          o.stop(n + 4.3);
        } catch {}

        // Meditative interval: calm, contemplative pauses (6 to 12 seconds)
        this.ambientTimer = setTimeout(scheduleBell, 6500 + Math.random() * 5500);
      };

      // Play first meditative chime quickly after starting, then enter natural loop
      this.ambientTimer = setTimeout(scheduleBell, 600);
    } catch {}
  }

  public stopAmbient() {
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }

    if (this.droneOsc) {
      try {
        if (this.droneGain && this.ctx) {
          this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        }
        setTimeout(() => {
          try {
            this.droneOsc?.stop();
          } catch {}
          this.droneOsc = null;
          this.droneGain = null;
        }, 600);
      } catch {
        this.droneOsc = null;
        this.droneGain = null;
      }
    }

    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        setTimeout(() => {
          this.ambientGain = null;
        }, 1100);
      } catch {
        this.ambientGain = null;
      }
    } else {
      this.ambientGain = null;
    }
  }

  // =========================================================================
  // SOUND EFFECTS (SFX)
  // =========================================================================

  public playSfx(type: string) {
    if (this.muted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    try {
      const a = this.ctx;
      const o = a.createOscillator();
      const g = a.createGain();
      const n = a.currentTime;
      let f = 300;
      let to = 160;
      let d = 0.1;
      let v = 0.04;
      let w: OscillatorType = "square";
      const pitchVar = 0.93 + Math.random() * 0.14;

      switch (type) {
        case "arrow":
          f = 820; to = 360; d = 0.08; w = "triangle"; v = 0.035;
          break;
        case "horn":
          f = 150; to = 105; d = 0.5; v = 0.07; w = "sawtooth";
          haptic("warning");
          break;
        case "build":
        case "place":
          f = 420; to = 760; d = 0.2; w = "sine"; v = 0.05;
          haptic("medium");
          break;
        case "hammer":
          f = 240; to = 160; d = 0.06; v = 0.04; w = "square";
          haptic("light");
          break;
        case "hit":
          f = 110; to = 65; d = 0.09; v = 0.045; w = "triangle";
          haptic("light");
          break;
        case "bossRoar":
          f = 90; to = 40; d = 1.2; v = 0.09; w = "sawtooth";
          haptic("warning");
          break;
        case "thunder":
          f = 110; to = 32; d = 0.85; v = 0.08; w = "sawtooth";
          haptic("heavy");
          break;
        case "chest":
        case "upgrade":
          f = 500; to = 1100; d = 0.35; v = 0.06; w = "sine";
          haptic("success");
          break;
        case "heroArrive":
          f = 440; to = 880; d = 0.4; v = 0.06; w = "triangle";
          haptic("heavy");
          break;
        case "heal":
          f = 330; to = 660; d = 0.38; v = 0.055; w = "sine";
          haptic("light");
          break;
        case "shout":
          f = 180; to = 90; d = 0.42; v = 0.065; w = "sawtooth";
          haptic("medium");
          break;
        case "chop":
          f = 520; to = 300; d = 0.09; v = 0.035; w = "square";
          break;
        case "mine":
          f = 260; to = 140; d = 0.11; v = 0.04; w = "square";
          break;
        case "harvest":
          f = 680; to = 520; d = 0.1; v = 0.035; w = "triangle";
          break;
        case "death":
          f = 220; to = 60; d = 0.35; v = 0.05; w = "sawtooth";
          haptic("medium");
          break;
        case "warn":
          f = 340; to = 340; d = 0.25; v = 0.05; w = "square";
          haptic("warning");
          break;
        case "select":
          f = 760; to = 1040; d = 0.06; v = 0.03; w = "sine";
          haptic("light");
          break;
        case "bugAttack":
          f = 920; to = 640; d = 0.06; v = 0.03; w = "square";
          break;
        case "bugDeath":
          f = 560; to = 90; d = 0.24; v = 0.04; w = "sawtooth";
          haptic("light");
          break;
        case "arcane":
          f = 980; to = 1600; d = 0.25; v = 0.05; w = "sine";
          haptic("heavy");
          break;
        case "click":
          f = 600; to = 400; d = 0.04; v = 0.03; w = "sine";
          break;
        case "typewriter":
          f = 1200 + Math.random() * 400; to = 300; d = 0.025; v = 0.025; w = "triangle";
          break;
        case "squish":
          f = 480; to = 180; d = 0.08; v = 0.04; w = "sine";
          haptic("light");
          break;
      }

      o.type = w;
      o.frequency.setValueAtTime(f * pitchVar, n);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, to * pitchVar), n + d);
      g.gain.setValueAtTime(v, n);
      g.gain.exponentialRampToValueAtTime(0.001, n + d);

      o.connect(g).connect(a.destination);
      o.start();
      o.stop(n + d + 0.02);
    } catch {
      // Audio fallback
    }
  }

  public playVoice(role: string, syllables = 4) {
    if (this.muted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    try {
      const a = this.ctx;
      const roleProfiles: Record<string, { baseFreq: number; type: OscillatorType; filterFreq: number; speed: number }> = {
        builder: { baseFreq: 150, type: "sawtooth", filterFreq: 650, speed: 70 },
        woodcutter: { baseFreq: 130, type: "square", filterFreq: 750, speed: 80 },
        stoneMiner: { baseFreq: 170, type: "triangle", filterFreq: 900, speed: 75 },
        goldMiner: { baseFreq: 210, type: "triangle", filterFreq: 1100, speed: 65 },
        farmer: { baseFreq: 260, type: "sine", filterFreq: 1400, speed: 60 },
        warrior: { baseFreq: 120, type: "sawtooth", filterFreq: 500, speed: 90 },
        javelin: { baseFreq: 290, type: "triangle", filterFreq: 1600, speed: 55 },
        scout: { baseFreq: 330, type: "sine", filterFreq: 1800, speed: 50 },
        trainee: { baseFreq: 240, type: "sine", filterFreq: 1200, speed: 65 },
      };

      const prof = roleProfiles[role] || { baseFreq: 200, type: "sine" as OscillatorType, filterFreq: 1000, speed: 70 };

      for (let i = 0; i < syllables; i++) {
        setTimeout(() => {
          if (this.muted || !this.ctx) return;
          try {
            const now = a.currentTime;
            const osc = a.createOscillator();
            const gain = a.createGain();
            const filter = a.createBiquadFilter();

            const pitchShift = 0.88 + Math.random() * 0.28;
            const freq = prof.baseFreq * pitchShift;

            osc.type = prof.type;
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * (0.8 + Math.random() * 0.4), now + 0.05);

            filter.type = "lowpass";
            filter.frequency.value = prof.filterFreq;

            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

            osc.connect(filter).connect(gain).connect(a.destination);
            osc.start(now);
            osc.stop(now + 0.07);
          } catch {}
        }, i * prof.speed);
      }
    } catch {}
  }

  public playSquadChorus() {
    if (this.muted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    try {
      const a = this.ctx;
      const n = a.currentTime;
      const chord = [370.0, 440.0, 554.37, 659.25];
      chord.forEach((freq, idx) => {
        const o = a.createOscillator();
        const g = a.createGain();
        const f = a.createBiquadFilter();

        o.type = idx % 2 === 0 ? "triangle" : "sawtooth";
        f.type = "lowpass";
        f.frequency.setValueAtTime(1600, n);

        const delay = idx * 0.035;
        o.frequency.setValueAtTime(freq * 0.94, n + delay);
        o.frequency.exponentialRampToValueAtTime(freq, n + delay + 0.06);

        g.gain.setValueAtTime(0.001, n + delay);
        g.gain.linearRampToValueAtTime(0.035, n + delay + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0005, n + delay + 0.45);

        o.connect(f).connect(g).connect(a.destination);
        o.start(n + delay);
        o.stop(n + delay + 0.48);
      });
    } catch {}
  }

  public playDawnBell() {
    if (this.muted || !this.ctx) return;
    const a = this.ctx;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((f, i) => {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        try {
          const o = a.createOscillator();
          const g = a.createGain();
          const pf = a.createBiquadFilter();
          o.type = "sine";
          o.frequency.value = f;
          pf.type = "lowpass";
          pf.frequency.value = 1400;
          o.connect(pf).connect(g).connect(a.destination);
          const n = a.currentTime;
          g.gain.setValueAtTime(0, n);
          g.gain.linearRampToValueAtTime(0.035, n + 0.3);
          g.gain.exponentialRampToValueAtTime(0.0006, n + 3.8);
          o.start(n);
          o.stop(n + 4.0);
        } catch {}
      }, i * 480);
    });
  }

  public playDuskHorn() {
    if (this.muted || !this.ctx) return;
    const a = this.ctx;
    try {
      const o = a.createOscillator();
      const g = a.createGain();
      const pf = a.createBiquadFilter();
      o.type = "sawtooth";
      pf.type = "lowpass";
      pf.frequency.value = 520;
      o.connect(pf).connect(g).connect(a.destination);
      const n = a.currentTime;
      g.gain.setValueAtTime(0, n);
      g.gain.linearRampToValueAtTime(0.04, n + 0.5);
      o.frequency.setValueAtTime(160, n);
      o.frequency.linearRampToValueAtTime(240, n + 1.0);
      o.frequency.linearRampToValueAtTime(140, n + 2.8);
      g.gain.linearRampToValueAtTime(0.001, n + 3.2);
      o.start(n);
      o.stop(n + 3.3);
    } catch {}
  }

  public playBossMusic() {
    if (this.muted || !this.ctx || this.bossOsc) return;
    this.setCombatMode(true);
    try {
      const a = this.ctx;
      const o1 = a.createOscillator();
      const o2 = a.createOscillator();
      const g = a.createGain();
      const lfo = a.createOscillator();
      const lfoG = a.createGain();

      o1.type = "sawtooth";
      o1.frequency.value = 75;
      o2.type = "sine";
      o2.frequency.value = 3.5;
      g.gain.value = 0;
      lfo.frequency.value = 0.4;
      lfoG.gain.value = 0.035;

      o2.connect(lfoG);
      lfoG.connect(g.gain);
      o1.connect(g).connect(a.destination);

      o1.start();
      o2.start();
      lfo.start();
      g.gain.linearRampToValueAtTime(0.05, a.currentTime + 1.5);
      this.bossOsc = { ctx: a, o1, o2, g, lfo };
    } catch {}
  }

  public stopBossMusic() {
    if (this.bossOsc) {
      try {
        const ref = this.bossOsc;
        ref.g.gain.linearRampToValueAtTime(0, ref.ctx.currentTime + 0.5);
        setTimeout(() => {
          try { ref.o1.stop(); ref.o2.stop(); ref.lfo.stop(); } catch {}
        }, 600);
      } catch {}
      this.bossOsc = null;
    }
    this.setCombatMode(false);
    // Ensure peaceful meditative ambient is running
    if (!this.ambientGain) {
      this.playAmbient();
    }
  }

  public playBirdChirp() {
    if (this.muted || !this.ctx) return;
    try {
      const a = this.ctx;
      const n = a.currentTime;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(2600, n);
      o.frequency.exponentialRampToValueAtTime(3400, n + 0.05);
      o.frequency.exponentialRampToValueAtTime(2200, n + 0.12);
      g.gain.setValueAtTime(0.012, n);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.14);
      o.connect(g).connect(a.destination);
      o.start(n);
      o.stop(n + 0.15);
    } catch {}
  }

  public playCricketChirp() {
    if (this.muted || !this.ctx) return;
    try {
      const a = this.ctx;
      const n = a.currentTime;
      for (let i = 0; i < 3; i++) {
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(4500 + i * 200, n + i * 0.04);
        g.gain.setValueAtTime(0.008, n + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, n + i * 0.04 + 0.03);
        o.connect(g).connect(a.destination);
        o.start(n + i * 0.04);
        o.stop(n + i * 0.04 + 0.035);
      }
    } catch {}
  }
}

export const sound = new SoundEngine();
