/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 浏览器音效合成器，无需外部文件
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {
        console.error("无法初始化音频上下文", e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 播放按钮点击声
  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // 出牌音效 (短促的划过声)
  playCard() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // 摸牌音效 (摩挲声)
  playDraw() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.25);
    osc2.stop(this.ctx.currentTime + 0.25);
  }

  // 洗牌音效
  playShuffle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 连续播放几个短促的摸牌包，模拟洗牌
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100 + i * 40, now + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(60, now + i * 0.08 + 0.06);
      
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.08 + 0.06);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.06);
    }
  }

  // 胜利音效 (欢快的大三和弦上行琶音)
  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      
      gain.gain.setValueAtTime(0, now + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.4);
    });
  }

  // 失败音效 (悲伤的下行音)
  playLose() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [293.66, 277.18, 261.63, 220.00]; // D4, C#4, C4, A3
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.2);
      osc.frequency.linearRampToValueAtTime(freq - 20, now + index * 0.2 + 0.18);
      
      gain.gain.setValueAtTime(0, now + index * 0.2);
      gain.gain.linearRampToValueAtTime(0.12, now + index * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.2 + 0.24);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + index * 0.2);
      osc.stop(now + index * 0.2 + 0.24);
    });
  }

  // 疯狂8万能牌音效 (华丽的魔法 chime 效果)
  playMagic() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 快速播放一串随机高音频音符产生闪烁感
    for (let i = 0; i < 12; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const freq = 600 + Math.random() * 800; // 600Hz - 1400Hz
      const startTime = now + i * 0.04;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    }
  }
}

export const sounds = new SoundSynthesizer();
