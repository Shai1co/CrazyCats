import Phaser from 'phaser';
import { generateSprites } from '../utils/SpriteGenerator.js';
import { soundManager } from '../utils/SoundManager.js';

const DIFFICULTIES = {
  easy: { label: 'EASY', color: '#2ecc71', decayMult: 0.6, eventDelay: 12000, desc: 'Chill vibes. Cats are forgiving.' },
  normal: { label: 'NORMAL', color: '#f39c12', decayMult: 1.0, eventDelay: 8000, desc: 'Classic chaos. Good luck.' },
  hard: { label: 'HARD', color: '#e74c3c', decayMult: 1.5, eventDelay: 5000, desc: 'Pure insanity. You WILL lose.' },
};

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    generateSprites(this);
    soundManager.init();

    this.selectedDifficulty = 'normal';

    // Background with subtle gradient effect
    const bg = this.add.graphics();
    // Draw gradient strips for a nice top-to-bottom fade
    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      const r = Math.round(26 + t * 10);
      const g2 = Math.round(26 + t * 5);
      const b = Math.round(46 + t * 15);
      const color = (r << 16) | (g2 << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * 20, 800, 20);
    }

    // Animated background paw prints
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const paw = this.add.text(x, y, '🐾', {
        fontSize: `${12 + Math.random() * 16}px`,
      }).setAlpha(0.1);

      this.tweens.add({
        targets: paw,
        y: paw.y - 20 + Math.random() * 40,
        alpha: { from: 0.03, to: 0.12 },
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Decorative line under title area
    const deco = this.add.graphics();
    deco.lineStyle(1, 0xe94560, 0.3);
    deco.lineBetween(100, 170, 700, 170);

    // Title
    const title = this.add.text(400, 100, 'CRAZYCATS', {
      fontSize: '64px',
      fontFamily: 'Arial Black, Impact, sans-serif',
      color: '#e94560',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#ff6b81',
        blur: 10,
        stroke: true,
        fill: true,
      }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      angle: { from: -2, to: 2 },
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    this.add.text(400, 155, '~ Herd the Chaos ~', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#f39c12',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Cat sprites with personality badges
    const catKeys = ['cat_black', 'cat_orange', 'cat_gray', 'cat_white', 'cat_calico'];
    const catPositions = [120, 260, 400, 540, 680];
    const names = ['Whiskey', 'Nacho', 'Shadow', 'Princess', 'Patches'];
    const personalities = ['tough', 'derpy', 'chill', 'sassy', 'chaotic'];
    const persEmojis = ['😼', '🤪', '😴', '💅', '🌪️'];
    const persColors = ['#e74c3c', '#f39c12', '#3498db', '#e91e9b', '#9b59b6'];

    catPositions.forEach((x, i) => {
      // Cat shadow
      const shadow = this.add.ellipse(x, 265, 35, 10, 0x000000, 0.2);

      const cat = this.add.image(x, 240, catKeys[i]).setScale(1.5);
      this.tweens.add({
        targets: cat,
        y: cat.y - 6 - Math.random() * 6,
        angle: (Math.random() - 0.5) * 10,
        duration: 600 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        delay: i * 100,
        ease: 'Sine.easeInOut',
      });

      // Shadow pulse synced with cat bounce
      this.tweens.add({
        targets: shadow,
        scaleX: 0.85,
        scaleY: 0.85,
        duration: 600 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        delay: i * 100,
        ease: 'Sine.easeInOut',
      });

      // Cat name
      this.add.text(x, 278, names[i], {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#ecf0f1',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Personality badge
      this.add.text(x, 293, `${persEmojis[i]} ${personalities[i]}`, {
        fontSize: '8px',
        fontFamily: 'Arial',
        color: persColors[i],
        fontStyle: 'italic',
      }).setOrigin(0.5);
    });

    // Floating sparkle particles across the screen
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.text(
        Math.random() * 800,
        170 + Math.random() * 130,
        Phaser.Utils.Array.GetRandom(['✨', '⭐', '💫', '🌟']),
        { fontSize: '10px' }
      ).setAlpha(0);
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 0.4 },
        y: sparkle.y - 30 - Math.random() * 20,
        x: sparkle.x + (Math.random() - 0.5) * 60,
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: i * 400,
      });
    }

    // --- Difficulty Selection ---
    this.add.text(400, 320, 'SELECT DIFFICULTY', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#7f8c8d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.diffButtons = {};
    this.diffBgs = {};
    this.diffDescText = this.add.text(400, 395, DIFFICULTIES.normal.desc, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#f39c12',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    const diffKeys = ['easy', 'normal', 'hard'];
    const diffX = [250, 400, 550];

    diffKeys.forEach((key, i) => {
      const diff = DIFFICULTIES[key];
      const isSelected = key === this.selectedDifficulty;

      const dbg = this.add.graphics();
      this.drawDiffButton(dbg, diffX[i], 358, diff, isSelected);
      this.diffBgs[key] = dbg;

      const dtxt = this.add.text(diffX[i], 358, diff.label, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.diffButtons[key] = dtxt;

      const dhit = this.add.rectangle(diffX[i], 358, 110, 32, 0x000000, 0)
        .setInteractive({ cursor: 'pointer' });

      dhit.on('pointerdown', () => {
        soundManager.clickSound();
        this.selectedDifficulty = key;
        this.diffDescText.setText(diff.desc);
        this.diffDescText.setColor(diff.color);
        // Redraw all buttons
        diffKeys.forEach((k, j) => {
          this.drawDiffButton(this.diffBgs[k], diffX[j], 358, DIFFICULTIES[k], k === key);
        });
      });

      dhit.on('pointerover', () => {
        if (key !== this.selectedDifficulty) {
          this.drawDiffButton(dbg, diffX[i], 358, diff, false, true);
        }
      });

      dhit.on('pointerout', () => {
        this.drawDiffButton(dbg, diffX[i], 358, diff, key === this.selectedDifficulty);
      });
    });

    // --- PLAY button ---
    const startBg = this.add.graphics();
    startBg.fillStyle(0xe94560, 1);
    startBg.fillRoundedRect(300, 418, 200, 50, 14);
    startBg.lineStyle(3, 0xffffff, 0.4);
    startBg.strokeRoundedRect(300, 418, 200, 50, 14);

    const startText = this.add.text(400, 443, '🎮 PLAY', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const startHit = this.add.rectangle(400, 443, 200, 50, 0x000000, 0)
      .setInteractive({ cursor: 'pointer' });

    startHit.on('pointerdown', () => {
      soundManager.startSound();
      this.cameras.main.flash(300, 233, 69, 96);
      const diff = DIFFICULTIES[this.selectedDifficulty];
      this.time.delayedCall(400, () => {
        this.scene.start('GameScene', {
          difficulty: this.selectedDifficulty,
          decayMult: diff.decayMult,
          eventDelay: diff.eventDelay,
        });
      });
    });

    startHit.on('pointerover', () => {
      startBg.clear();
      startBg.fillStyle(0xff6b81, 1);
      startBg.fillRoundedRect(300, 418, 200, 50, 14);
      startBg.lineStyle(3, 0xffffff, 0.6);
      startBg.strokeRoundedRect(300, 418, 200, 50, 14);
    });

    startHit.on('pointerout', () => {
      startBg.clear();
      startBg.fillStyle(0xe94560, 1);
      startBg.fillRoundedRect(300, 418, 200, 50, 14);
      startBg.lineStyle(3, 0xffffff, 0.4);
      startBg.strokeRoundedRect(300, 418, 200, 50, 14);
    });

    // --- High Scores ---
    const scores = this.getHighScores();
    if (scores.length > 0) {
      this.add.text(400, 485, '🏆 HIGH SCORES', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#f1c40f',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const medals = ['🥇', '🥈', '🥉'];
      scores.slice(0, 3).forEach((entry, i) => {
        const mins = Math.floor(entry.time / 60);
        const secs = entry.time % 60;
        const diffLabel = DIFFICULTIES[entry.difficulty]?.label || 'NORMAL';
        const diffColor = DIFFICULTIES[entry.difficulty]?.color || '#f39c12';
        this.add.text(400, 503 + i * 18, `${medals[i]} ${entry.score.toLocaleString()} pts  (${mins}:${secs.toString().padStart(2, '0')})  [${diffLabel}]`, {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: i === 0 ? '#f1c40f' : '#bdc3c7',
        }).setOrigin(0.5);
      });
    }

    // How to play hint
    this.add.text(400, 565, '🍖 Feed  ·  🧹 Clean  ·  🎾 Entertain  ·  🖱️ Click cats to care for them!', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#7f8c8d',
    }).setOrigin(0.5);

    // Footer
    this.add.text(400, 582, '⚠️ No actual cats were harmed. The wine is theirs.', {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: '#555',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Version
    this.add.text(790, 595, 'v0.5', {
      fontSize: '8px',
      fontFamily: 'Arial',
      color: '#333',
    }).setOrigin(1, 1);
  }

  drawDiffButton(gfx, x, y, diff, selected, hovered = false) {
    gfx.clear();
    const color = Phaser.Display.Color.HexStringToColor(diff.color).color;
    if (selected) {
      gfx.fillStyle(color, 1);
      gfx.fillRoundedRect(x - 55, y - 16, 110, 32, 8);
      gfx.lineStyle(2, 0xffffff, 0.7);
      gfx.strokeRoundedRect(x - 55, y - 16, 110, 32, 8);
    } else if (hovered) {
      gfx.fillStyle(color, 0.4);
      gfx.fillRoundedRect(x - 55, y - 16, 110, 32, 8);
      gfx.lineStyle(1, 0xffffff, 0.3);
      gfx.strokeRoundedRect(x - 55, y - 16, 110, 32, 8);
    } else {
      gfx.fillStyle(0x333333, 0.6);
      gfx.fillRoundedRect(x - 55, y - 16, 110, 32, 8);
      gfx.lineStyle(1, color, 0.5);
      gfx.strokeRoundedRect(x - 55, y - 16, 110, 32, 8);
    }
  }

  getHighScores() {
    try {
      const raw = localStorage.getItem('crazycats_highscores');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }
}
