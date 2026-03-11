import Phaser from 'phaser';
import Cat from '../sprites/Cat.js';
import { generateSprites } from '../utils/SpriteGenerator.js';
import { soundManager } from '../utils/SoundManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.cats = [];
    this.score = 0;
    this.gameTime = 0;
    this.crazyMeter = 0;
    this.selectedAction = null;
    this.gameOver = false;
    this.paused = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastActionTime = 0;
    this.totalActions = 0;
    this.bestCombo = 0;
    this.difficultyLevel = 1;
  }

  create(data) {
    // Zoom camera 2x so 1600×1200 canvas shows 800×600 game area = crisp text
    this.cameras.main.setZoom(2).centerOn(400, 300);

    // Difficulty settings from title screen
    this.difficulty = data?.difficulty || 'normal';
    this.decayMult = data?.decayMult || 1.0;
    this.baseEventDelay = data?.eventDelay || 8000;

    this.gameOver = false;
    this.paused = false;
    this.score = 0;
    this.gameTime = 0;
    this.crazyMeter = 0;
    this.cats = [];
    this.selectedAction = null;
    this.totalActions = 0;
    this.bestCombo = 0;
    this.comboCount = 0;
    this.difficultyLevel = 1;
    this.powerUps = [];
    this.powerUpTimer = 0;

    // Initialize sound
    soundManager.init();
    soundManager.resume();
    soundManager.startSound();

    // Initialize achievements
    this.initAchievements();

    // Generate all sprites
    generateSprites(this);

    // Draw apartment background
    this.createBackground();

    // Place furniture
    this.createFurniture();

    // Create cats
    this.createCats();

    // Create UI
    this.createUI();

    // Input - clicking cats directly via container
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (this.gameOver || this.paused) return;
      // Check if it's a Cat container
      if (gameObject instanceof Cat) {
        this.handleCatClick(gameObject);
      }
    });

    // Click handler for power-ups (on background)
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver || this.paused) return;
      this.checkPowerUpClick(pointer.x, pointer.y);
    });

    // Ambient events timer
    this.eventTimer = this.time.addEvent({
      delay: this.baseEventDelay,
      callback: this.randomEvent,
      callbackScope: this,
      loop: true,
    });

    // Power-up spawn timer
    this.time.addEvent({
      delay: 15000,
      callback: this.spawnPowerUp,
      callbackScope: this,
      loop: true,
    });

    // Score increment timer
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.gameOver && !this.paused) {
          this.score += 10;
          this.gameTime += 1;

          // Increase difficulty every 30 seconds
          this.difficultyLevel = 1 + Math.floor(this.gameTime / 30);

          // Speed up random events as game progresses
          if (this.gameTime % 30 === 0 && this.eventTimer) {
            const newDelay = Math.max(3000, this.baseEventDelay - this.gameTime * 30);
            this.eventTimer.delay = newDelay;
          }

          // Milestone bonuses
          if (this.gameTime % 60 === 0) {
            this.showMilestone();
          }
        }
      },
      callbackScope: this,
      loop: true,
    });

    // Show tutorial on first play (use static flag to persist across restarts)
    if (!GameScene._tutorialShown) {
      this.time.delayedCall(500, () => this.showTutorial());
    }

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ONE', () => { if (!this.gameOver) this.selectAction('feed'); });
    this.input.keyboard.on('keydown-TWO', () => { if (!this.gameOver) this.selectAction('clean'); });
    this.input.keyboard.on('keydown-THREE', () => { if (!this.gameOver) this.selectAction('entertain'); });
    this.input.keyboard.on('keydown-ESC', () => { this.selectedAction = null; this.actionIndicator.setVisible(false); this.deselectButtons(); });
    this.input.keyboard.on('keydown-P', () => { this.togglePause(); });
    this.input.keyboard.on('keydown-SPACE', () => { this.togglePause(); });
  }

  showTutorial() {
    this.paused = true;
    GameScene._tutorialShown = true;

    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(100);

    const tutorialContainer = this.add.container(400, 300).setDepth(101);

    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-250, -200, 500, 400, 20);
    bg.lineStyle(3, 0xe94560);
    bg.strokeRoundedRect(-250, -200, 500, 400, 20);
    tutorialContainer.add(bg);

    const titleText = this.add.text(0, -170, '🐱 HOW TO PLAY 🐱', {
      fontSize: '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    tutorialContainer.add(titleText);

    const instructions = [
      '🍖  1. Click FEED, CLEAN, or ENTERTAIN',
      '🐱  2. Then click a cat to help them',
      '📊  3. Watch their need bars above them',
      '🔴  4. Red bars = urgent! Help them fast!',
      '💢  5. If cats go CRAZY, the meter fills up',
      '💀  6. Meter at max = GAME OVER!',
      '',
      '⌨️  Shortcuts: 1/2/3 = Actions, P = Pause',
      '💡  Hover over cats to see their needs!',
      '💡  Click sleeping cats to wake them up!',
    ];

    instructions.forEach((line, i) => {
      const txt = this.add.text(0, -120 + i * 28, line, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: i < 6 ? '#ecf0f1' : (i === 6 ? '' : '#f39c12'),
        fontStyle: i >= 7 ? 'italic' : 'normal',
      }).setOrigin(0.5);
      tutorialContainer.add(txt);
    });

    // Got it button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xe94560, 1);
    btnBg.fillRoundedRect(-80, 145, 160, 40, 12);
    tutorialContainer.add(btnBg);

    const btnText = this.add.text(0, 165, "LET'S GO! 🎮", {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#fff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    tutorialContainer.add(btnText);

    const btnHit = this.add.rectangle(400, 465, 160, 40, 0x000000, 0)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(102);

    btnHit.on('pointerdown', () => {
      this.tweens.add({
        targets: [tutorialContainer, overlay, btnHit],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          tutorialContainer.destroy();
          overlay.destroy();
          btnHit.destroy();
          this.paused = false;
        }
      });
    });

    btnHit.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff6b81, 1);
      btnBg.fillRoundedRect(-80, 145, 160, 40, 12);
    });

    btnHit.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xe94560, 1);
      btnBg.fillRoundedRect(-80, 145, 160, 40, 12);
    });

    // Animate in
    tutorialContainer.setScale(0);
    this.tweens.add({
      targets: tutorialContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  showMilestone() {
    soundManager.milestoneSound();
    const mins = Math.floor(this.gameTime / 60);
    const milestoneText = this.add.text(400, 150, `🎉 ${mins} MINUTE${mins > 1 ? 'S' : ''} SURVIVED! 🎉`, {
      fontSize: '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    const bonusText = this.add.text(400, 180, `+${mins * 200} BONUS POINTS!`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#2ecc71',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(30);

    this.score += mins * 200;

    this.tweens.add({
      targets: [milestoneText, bonusText],
      y: '-=30',
      alpha: 0,
      duration: 3000,
      delay: 1000,
      onComplete: () => {
        milestoneText.destroy();
        bonusText.destroy();
      }
    });

    // Small boost to all cats
    this.cats.forEach(cat => {
      cat.hunger = Math.min(100, cat.hunger + 5);
      cat.cleanliness = Math.min(100, cat.cleanliness + 5);
      cat.boredom = Math.min(100, cat.boredom + 5);
    });
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;

    if (this.paused) {
      this.pauseOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6).setDepth(90);
      this.pauseText = this.add.text(400, 280, '⏸ PAUSED', {
        fontSize: '48px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#f1c40f',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(91);
      this.pauseSubText = this.add.text(400, 330, 'Press P or SPACE to resume', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#bdc3c7',
      }).setOrigin(0.5).setDepth(91);
    } else {
      if (this.pauseOverlay) this.pauseOverlay.destroy();
      if (this.pauseText) this.pauseText.destroy();
      if (this.pauseSubText) this.pauseSubText.destroy();
    }
  }

  createBackground() {
    // Floor
    const floorGfx = this.add.graphics();
    floorGfx.fillStyle(0x8B7355, 1);
    floorGfx.fillRect(0, 260, 800, 340);

    // Floor planks
    floorGfx.lineStyle(1, 0x7A6548);
    for (let y = 270; y < 600; y += 30) {
      floorGfx.lineBetween(0, y, 800, y);
    }
    for (let x = 0; x < 800; x += 80) {
      floorGfx.lineBetween(x, 260, x, 600);
    }

    // Stains on floor
    floorGfx.fillStyle(0x7A6045, 0.5);
    floorGfx.fillCircle(200, 400, 20);
    floorGfx.fillCircle(550, 350, 15);
    floorGfx.fillCircle(650, 450, 25);

    // Walls
    const wallGfx = this.add.graphics();
    wallGfx.fillStyle(0xBFA882, 1);
    wallGfx.fillRect(0, 0, 800, 270);

    // Wall texture/cracks
    wallGfx.lineStyle(1, 0xA89070, 0.3);
    for (let i = 0; i < 8; i++) {
      const x = 50 + Math.random() * 700;
      const y = 50 + Math.random() * 200;
      wallGfx.lineBetween(x, y, x + 20 + Math.random() * 30, y + 10 + Math.random() * 20);
    }

    // Baseboard
    wallGfx.fillStyle(0x5D4E37, 1);
    wallGfx.fillRect(0, 255, 800, 10);

    // Ceiling pipes (cat tunnels)
    const pipeGfx = this.add.graphics();
    pipeGfx.fillStyle(0x2ecc71, 0.7);
    pipeGfx.fillRect(50, 15, 300, 20);
    pipeGfx.fillRect(250, 15, 20, 50);
    pipeGfx.fillRect(500, 25, 250, 18);
    pipeGfx.lineStyle(2, 0x27ae60);
    pipeGfx.strokeRect(50, 15, 300, 20);
    pipeGfx.strokeRect(500, 25, 250, 18);
    pipeGfx.fillStyle(0x229954, 0.8);
    pipeGfx.fillCircle(250, 25, 14);
    pipeGfx.fillCircle(500, 34, 12);

    // Wall clock
    this.wallClock = this.add.graphics();
    this.wallClock.setDepth(0);
    this.drawWallClock(0);

    // Ambient dust motes
    this.dustMotes = [];
    for (let i = 0; i < 12; i++) {
      const mote = this.add.circle(
        50 + Math.random() * 700,
        60 + Math.random() * 400,
        1 + Math.random() * 1.5,
        0xffffff,
        0.15 + Math.random() * 0.1
      ).setDepth(0);

      this.tweens.add({
        targets: mote,
        x: mote.x + (Math.random() - 0.5) * 80,
        y: mote.y - 20 - Math.random() * 40,
        alpha: { from: mote.alpha, to: 0.05 },
        duration: 4000 + Math.random() * 4000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3000,
      });

      this.dustMotes.push(mote);
    }
  }

  drawWallClock(gameTime) {
    if (!this.wallClock) return;
    this.wallClock.clear();
    const cx = 500, cy = 80, r = 22;

    // Clock face
    this.wallClock.fillStyle(0xf5f0e1, 1);
    this.wallClock.fillCircle(cx, cy, r);
    this.wallClock.lineStyle(2, 0x5D4E37);
    this.wallClock.strokeCircle(cx, cy, r);

    // Hour marks
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const innerR = i % 3 === 0 ? r - 6 : r - 4;
      this.wallClock.lineStyle(i % 3 === 0 ? 2 : 1, 0x333333);
      this.wallClock.lineBetween(
        cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR,
        cx + Math.cos(angle) * (r - 2), cy + Math.sin(angle) * (r - 2)
      );
    }

    // Hands - use game time to rotate
    const minuteAngle = ((gameTime % 60) / 60) * Math.PI * 2 - Math.PI / 2;
    const hourAngle = ((gameTime / 720) % 1) * Math.PI * 2 - Math.PI / 2;

    // Hour hand
    this.wallClock.lineStyle(2.5, 0x222222);
    this.wallClock.lineBetween(cx, cy, cx + Math.cos(hourAngle) * (r - 10), cy + Math.sin(hourAngle) * (r - 10));

    // Minute hand
    this.wallClock.lineStyle(1.5, 0x444444);
    this.wallClock.lineBetween(cx, cy, cx + Math.cos(minuteAngle) * (r - 5), cy + Math.sin(minuteAngle) * (r - 5));

    // Center dot
    this.wallClock.fillStyle(0xe74c3c, 1);
    this.wallClock.fillCircle(cx, cy, 2);
  }

  createFurniture() {
    this.add.image(400, 130, 'window').setScale(1.5);
    this.add.image(80, 130, 'poster_shred').setScale(1.3);
    this.add.image(220, 100, 'poster_nips').setScale(1.2);
    this.add.image(580, 110, 'poster_laser').setScale(1.2);
    this.add.image(720, 130, 'poster_chaos').setScale(1.3);

    // Extra humor posters tucked in
    this.add.image(140, 180, 'poster_wine').setScale(0.8).setAlpha(0.85);
    this.add.image(690, 210, 'poster_3am').setScale(0.7).setAlpha(0.85);

    this.add.image(400, 295, 'couch').setScale(1.3).setDepth(1);
    this.add.image(100, 350, 'scratch_post').setScale(1.1).setDepth(1);
    this.add.image(700, 340, 'scratch_post').setScale(1.1).setDepth(1);
    this.add.image(660, 180, 'bookshelf').setScale(1.2);
    this.add.image(160, 440, 'cardboard_box').setScale(1.2).setDepth(1);
    this.add.image(770, 470, 'cat_door').setScale(1.1).setDepth(1);

    // Interactive furniture stations
    this.stationCooldowns = { feed: 0, clean: 0, entertain: 0 };
    this.createStation(300, 480, 'food_bowl', 'feed', 1.2, '🍖 Feeding Station', '#e74c3c', 120);
    this.createStation(550, 480, 'litter_box', 'clean', 1.0, '🧹 Litter Box', '#3498db', 120);
    this.createStation(350, 430, 'yarn_ball', 'entertain', 0.9, '🎾 Toy Corner', '#f39c12', 120);

    const wine = this.add.image(450, 465, 'wine_bottle').setScale(1.3).setDepth(1);
    wine.angle = 80;

    // Rug / mat
    const rug = this.add.graphics();
    rug.fillStyle(0x8e44ad, 0.3);
    rug.fillEllipse(400, 420, 180, 60);
    rug.lineStyle(1, 0x9b59b6, 0.4);
    rug.strokeEllipse(400, 420, 180, 60);
    rug.strokeEllipse(400, 420, 160, 50);

    this.add.image(500, 380, 'yarn_ball').setScale(0.7).setDepth(1);
    this.add.image(230, 380, 'toy_mouse').setScale(1.0).setDepth(1);
    this.add.image(620, 420, 'toy_mouse').setScale(0.8).setDepth(1);

    // Scattered kibble on floor (purely decorative)
    for (let i = 0; i < 6; i++) {
      const kx = 150 + Math.random() * 500;
      const ky = 400 + Math.random() * 80;
      this.add.image(kx, ky, 'kibble').setScale(1.2).setAlpha(0.5).setDepth(0);
    }
  }

  createStation(x, y, spriteKey, action, scale, label, color, cooldownSec) {
    const station = this.add.image(x, y, spriteKey).setScale(scale).setDepth(1);
    station.setInteractive({ cursor: 'pointer' });

    // Station label (hidden until hover)
    const stationLabel = this.add.text(x, y - 28, label, {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    // Cooldown indicator
    const cdText = this.add.text(x, y + 18, '', {
      fontSize: '8px',
      fontFamily: 'Arial',
      color: '#aaa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    station.on('pointerover', () => {
      stationLabel.setAlpha(1);
      this.tweens.add({ targets: station, scaleX: scale * 1.15, scaleY: scale * 1.15, duration: 100 });
      // Show cooldown status
      const cd = this.stationCooldowns[action];
      if (cd > 0) {
        cdText.setText(`⏳ ${Math.ceil(cd)}s`);
        cdText.setAlpha(1);
      } else {
        cdText.setText('✅ Ready!');
        cdText.setColor('#2ecc71');
        cdText.setAlpha(1);
      }
    });

    station.on('pointerout', () => {
      stationLabel.setAlpha(0);
      cdText.setAlpha(0);
      this.tweens.add({ targets: station, scaleX: scale, scaleY: scale, duration: 100 });
    });

    station.on('pointerdown', () => {
      if (this.gameOver || this.paused) return;
      this.useStation(x, y, action, color, cooldownSec, station, scale);
    });
  }

  useStation(x, y, action, color, cooldownSec, station, scale) {
    // Check cooldown
    if (this.stationCooldowns[action] > 0) {
      this.showEventText(x, y - 30, `⏳ Station recharging... ${Math.ceil(this.stationCooldowns[action])}s`, '#999', 10);
      return;
    }

    // Find nearby cats (within 150px radius)
    const nearbyCats = this.cats.filter(cat => {
      if (cat.state === 'sleeping') return false;
      return Phaser.Math.Distance.Between(x, y, cat.x, cat.y) < 150;
    });

    if (nearbyCats.length === 0) {
      this.showEventText(x, y - 30, 'No cats nearby!', '#e74c3c', 11);
      return;
    }

    // Apply a smaller boost (half the individual action) to all nearby cats
    const gain = 15 + Math.random() * 8;
    nearbyCats.forEach(cat => {
      switch (action) {
        case 'feed': cat.hunger = Math.min(100, cat.hunger + gain); break;
        case 'clean': cat.cleanliness = Math.min(100, cat.cleanliness + gain); break;
        case 'entertain': cat.boredom = Math.min(100, cat.boredom + gain); break;
      }
      for (let j = 0; j < 2; j++) {
        this.time.delayedCall(j * 80, () => {
          cat.emitParticle(action === 'feed' ? 'kibble' : action === 'clean' ? 'star' : 'heart');
        });
      }
    });

    // Sound + score
    if (action === 'feed') soundManager.feedSound();
    else if (action === 'clean') soundManager.cleanSound();
    else soundManager.entertainSound();

    this.score += nearbyCats.length * 30;
    this.showEventText(x, y - 30, `${nearbyCats.length} cat${nearbyCats.length > 1 ? 's' : ''} helped! +${nearbyCats.length * 30}`, color, 12);

    // Flash the station
    if (station) {
      this.tweens.add({
        targets: station,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 2,
      });
    }

    // Set cooldown
    this.stationCooldowns[action] = cooldownSec;

    // Achievement check
    this.checkAchievement('station_used');
  }

  createCats() {
    const catConfigs = [
      { name: 'Whiskey', spriteKey: 'cat_black', personality: 'tough', x: 200, y: 380 },
      { name: 'Nacho', spriteKey: 'cat_orange', personality: 'derpy', x: 400, y: 400 },
      { name: 'Shadow', spriteKey: 'cat_gray', personality: 'chill', x: 550, y: 350 },
      { name: 'Princess', spriteKey: 'cat_white', personality: 'sassy', x: 300, y: 420 },
      { name: 'Patches', spriteKey: 'cat_calico', personality: 'chaotic', x: 650, y: 390 },
    ];

    catConfigs.forEach(config => {
      const cat = new Cat(this, config.x, config.y, config);
      cat.setDepth(2);
      this.cats.push(cat);
    });
  }

  createUI() {
    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x1a1a2e, 0.85);
    topBar.fillRect(0, 0, 800, 55);
    topBar.lineStyle(2, 0xe94560);
    topBar.lineBetween(0, 55, 800, 55);
    topBar.setDepth(10);

    // Crazy Meter label
    this.add.text(16, 8, '🐱 CRAZY METER', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#e94560',
      fontStyle: 'bold'
    }).setDepth(11);

    const meterBg = this.add.graphics().setDepth(11);
    meterBg.fillStyle(0x333333, 1);
    meterBg.fillRoundedRect(16, 26, 180, 16, 8);
    meterBg.lineStyle(1, 0x555555);
    meterBg.strokeRoundedRect(16, 26, 180, 16, 8);

    this.crazyMeterFill = this.add.graphics().setDepth(11);

    // Crazy meter percentage text
    this.crazyPercentText = this.add.text(106, 34, '0%', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(12);

    this.updateCrazyMeter();

    // Score
    this.scoreText = this.add.text(400, 12, 'SCORE: 0', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(11);

    // Time survived
    this.timeText = this.add.text(400, 36, '0:00', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#bdc3c7',
    }).setOrigin(0.5, 0).setDepth(11);

    // Difficulty indicator
    this.diffText = this.add.text(210, 12, 'LVL 1', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#2ecc71',
      fontStyle: 'bold',
    }).setDepth(11);

    // Cat count
    this.catCountText = this.add.text(630, 8, `🐱 x${this.cats.length}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ecf0f1',
      fontStyle: 'bold',
    }).setDepth(11);

    // Combo text
    this.comboText = this.add.text(630, 30, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setDepth(11);

    // Sound toggle button
    this.soundBtn = this.add.text(730, 28, '🔊', {
      fontSize: '18px',
    }).setOrigin(0.5).setDepth(11).setInteractive({ cursor: 'pointer' });
    this.soundBtn.on('pointerdown', () => {
      const on = soundManager.toggle();
      this.soundBtn.setText(on ? '🔊' : '🔇');
    });

    // Pause button
    const pauseBtn = this.add.text(770, 28, '⏸', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(11).setInteractive({ cursor: 'pointer' });
    pauseBtn.on('pointerdown', () => this.togglePause());

    // Bottom action bar
    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x1a1a2e, 0.9);
    bottomBar.fillRect(0, 520, 800, 80);
    bottomBar.lineStyle(2, 0xe94560);
    bottomBar.lineBetween(0, 520, 800, 520);
    bottomBar.setDepth(10);

    // Action buttons
    this.actionButtons = {};
    this.createActionButton(200, 560, '🍖 FEED', 'feed', 0xe74c3c, '1');
    this.createActionButton(400, 560, '🧹 CLEAN', 'clean', 0x3498db, '2');
    this.createActionButton(600, 560, '🎾 ENTERTAIN', 'entertain', 0xf39c12, '3');

    // Instruction text with rotating tips
    this.instructionText = this.add.text(400, 530, 'Click an action, then click a cat! (or just click a cat for smart-action)', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#7f8c8d',
    }).setOrigin(0.5, 0).setDepth(11);

    // Rotate tips every 8 seconds
    const tips = [
      'Click an action, then click a cat! (or just click a cat for smart-action)',
      '💡 Glowing circles show which cats need help most!',
      '💡 Grab power-ups on the floor for mass effects!',
      '💡 Quick combos = bonus points! Click fast!',
      '💡 Press 1, 2, 3 for quick action select!',
      '💡 Sleeping cats recover boredom over time.',
      '💡 Dirty cats emit stink clouds - clean them fast!',
    ];
    let tipIndex = 0;
    this.time.addEvent({
      delay: 8000,
      callback: () => {
        if (this.gameOver || this.selectedAction) return;
        tipIndex = (tipIndex + 1) % tips.length;
        this.instructionText.setText(tips[tipIndex]);
      },
      loop: true,
    });

    // Action indicator
    this.actionIndicator = this.add.text(400, 505, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#f1c40f',
      fontStyle: 'bold',
      backgroundColor: '#1a1a2e88',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(11).setVisible(false);
  }

  createActionButton(x, y, label, action, color, shortcut) {
    const bg = this.add.graphics().setDepth(11);
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - 70, y - 20, 140, 40, 12);
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.strokeRoundedRect(x - 70, y - 20, 140, 40, 12);

    const text = this.add.text(x, y, label, {
      fontSize: '15px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    // Shortcut hint
    this.add.text(x + 55, y - 12, shortcut, {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: '#ffffff88',
      backgroundColor: '#00000044',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(11);

    const hitArea = this.add.rectangle(x, y, 140, 40, 0x000000, 0)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(12);

    this.actionButtons[action] = { bg, text, hitArea, color, x, y };

    hitArea.on('pointerdown', () => {
      if (this.gameOver || this.paused) return;
      this.selectAction(action);
    });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(Phaser.Display.Color.GetColor(
        Math.min(255, ((color >> 16) & 0xff) + 30),
        Math.min(255, ((color >> 8) & 0xff) + 30),
        Math.min(255, (color & 0xff) + 30)
      ), 1);
      bg.fillRoundedRect(x - 70, y - 20, 140, 40, 12);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(x - 70, y - 20, 140, 40, 12);
    });

    hitArea.on('pointerout', () => {
      if (this.selectedAction === action) return;
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - 70, y - 20, 140, 40, 12);
      bg.lineStyle(2, 0xffffff, 0.3);
      bg.strokeRoundedRect(x - 70, y - 20, 140, 40, 12);
    });
  }

  selectAction(action) {
    soundManager.clickSound();
    // Deselect previous
    if (this.selectedAction && this.actionButtons[this.selectedAction]) {
      const prev = this.actionButtons[this.selectedAction];
      prev.bg.clear();
      prev.bg.fillStyle(prev.color, 1);
      prev.bg.fillRoundedRect(prev.x - 70, prev.y - 20, 140, 40, 12);
      prev.bg.lineStyle(2, 0xffffff, 0.3);
      prev.bg.strokeRoundedRect(prev.x - 70, prev.y - 20, 140, 40, 12);
    }

    this.selectedAction = action;
    const emoji = action === 'feed' ? '🍖' : action === 'clean' ? '🧹' : '🎾';
    const label = action === 'feed' ? 'FEED' : action === 'clean' ? 'CLEAN' : 'ENTERTAIN';
    this.actionIndicator.setText(`Selected: ${emoji} ${label} - Now click a cat!`);
    this.actionIndicator.setVisible(true);

    // Highlight selected button
    const btn = this.actionButtons[action];
    if (btn) {
      btn.bg.clear();
      btn.bg.fillStyle(0xffffff, 0.3);
      btn.bg.fillRoundedRect(btn.x - 70, btn.y - 20, 140, 40, 12);
      btn.bg.lineStyle(3, 0xffffff, 0.9);
      btn.bg.strokeRoundedRect(btn.x - 70, btn.y - 20, 140, 40, 12);
    }

    this.tweens.add({
      targets: btn?.text,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
    });
  }

  handleCatClick(cat) {
    // Smart action - if no action selected, auto-pick the most urgent need
    let action = this.selectedAction;
    if (!action) {
      action = cat.getMostUrgentNeed();
      // Show what was auto-picked
      const emoji = action === 'feed' ? '🍖' : action === 'clean' ? '🧹' : '🎾';
      const autoText = this.add.text(cat.x, cat.y - 80, `Auto: ${emoji}`, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#2ecc71',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({
        targets: autoText,
        y: autoText.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => autoText.destroy(),
      });
    }

    let success = false;
    if (cat.state === 'sleeping') {
      // Wake them up instead
      success = cat.wakeUp();
      if (success) {
        this.score += 10;
        soundManager.wakeUpSound();
        this.checkAchievement('wake_up');
        // Show wake up text
        const wakeText = this.add.text(cat.x, cat.y - 60, '⏰ Woke up!', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#f39c12',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
          targets: wakeText,
          y: wakeText.y - 20,
          alpha: 0,
          duration: 1500,
          onComplete: () => wakeText.destroy(),
        });
      }
      this.selectedAction = null;
      this.actionIndicator.setVisible(false);
      this.deselectButtons();
      return;
    }

    switch (action) {
      case 'feed':
        success = cat.feed();
        break;
      case 'clean':
        success = cat.clean();
        break;
      case 'entertain':
        success = cat.entertain();
        break;
    }

    if (success) {
      // Play action sound + achievement
      if (action === 'feed') { soundManager.feedSound(); this.checkAchievement('first_feed'); }
      else if (action === 'clean') { soundManager.cleanSound(); this.checkAchievement('first_clean'); }
      else if (action === 'entertain') { soundManager.entertainSound(); this.checkAchievement('first_entertain'); }

      this.score += 50;
      this.totalActions++;

      // Combo system
      const now = this.time.now;
      if (now - this.lastActionTime < 3000) {
        this.comboCount++;
        if (this.comboCount > this.bestCombo) this.bestCombo = this.comboCount;
        this.score += this.comboCount * 25;
        this.comboText.setText(`🔥 COMBO x${this.comboCount}! +${this.comboCount * 25}`);
        soundManager.comboSound(this.comboCount);
        this.tweens.add({
          targets: this.comboText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 200,
          yoyo: true,
        });

        // Screen shake on big combos
        if (this.comboCount >= 3) {
          this.cameras.main.shake(200, 0.005 * this.comboCount);
        }
      } else {
        this.comboCount = 1;
        this.comboText.setText('');
      }
      this.lastActionTime = now;

      // Floating score text
      const points = 50 + (this.comboCount - 1) * 25;
      const floatText = this.add.text(cat.x, cat.y - 50, `+${points}`, {
        fontSize: '20px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#f1c40f',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: floatText,
        y: floatText.y - 50,
        alpha: 0,
        duration: 1200,
        onComplete: () => floatText.destroy(),
      });

      // Action emoji burst
      const actionEmoji = action === 'feed' ? '🍖' : action === 'clean' ? '✨' : '🎾';
      for (let i = 0; i < 3; i++) {
        const emojiText = this.add.text(
          cat.x + (Math.random() - 0.5) * 40,
          cat.y - 30,
          actionEmoji,
          { fontSize: '18px' }
        ).setOrigin(0.5).setDepth(20);

        this.tweens.add({
          targets: emojiText,
          y: emojiText.y - 30 - Math.random() * 20,
          x: emojiText.x + (Math.random() - 0.5) * 30,
          alpha: 0,
          scale: 1.5,
          duration: 800,
          delay: i * 100,
          onComplete: () => emojiText.destroy(),
        });
      }
    }

    this.selectedAction = null;
    this.actionIndicator.setVisible(false);
    this.deselectButtons();
    this.instructionText.setText('Click an action, then click a cat! (or just click a cat for smart-action)');
  }

  deselectButtons() {
    Object.values(this.actionButtons).forEach(btn => {
      btn.bg.clear();
      btn.bg.fillStyle(btn.color, 1);
      btn.bg.fillRoundedRect(btn.x - 70, btn.y - 20, 140, 40, 12);
      btn.bg.lineStyle(2, 0xffffff, 0.3);
      btn.bg.strokeRoundedRect(btn.x - 70, btn.y - 20, 140, 40, 12);
    });
  }

  updateCrazyMeter() {
    if (!this.cats.length) return;

    let totalCrazy = 0;
    this.cats.forEach(cat => {
      totalCrazy += cat.getCrazyLevel();
    });
    this.crazyMeter = totalCrazy / this.cats.length;

    this.crazyMeterFill.clear();
    const width = (this.crazyMeter / 100) * 176;

    let color;
    if (this.crazyMeter < 30) color = 0x2ecc71;
    else if (this.crazyMeter < 50) color = 0xf1c40f;
    else if (this.crazyMeter < 70) color = 0xe67e22;
    else color = 0xe74c3c;

    this.crazyMeterFill.fillStyle(color, 1);
    this.crazyMeterFill.fillRoundedRect(18, 28, Math.max(0, width), 12, 6);

    // Pulse effect when high
    if (this.crazyMeter > 70) {
      const pulse = 0.8 + Math.sin(this.time.now / 200) * 0.2;
      this.crazyMeterFill.setAlpha(pulse);

      // Screen border flash when critical
      if (this.crazyMeter > 85 && !this.warningBorder) {
        this.warningBorder = this.add.rectangle(400, 300, 800, 600).setDepth(9);
        this.warningBorder.setStrokeStyle(4, 0xe74c3c, 0.5);
        this.warningBorder.setFillStyle(0xe74c3c, 0);
      }
    } else {
      this.crazyMeterFill.setAlpha(1);
      if (this.warningBorder) {
        this.warningBorder.destroy();
        this.warningBorder = null;
      }
    }

    // Update percentage text
    if (this.crazyPercentText) {
      this.crazyPercentText.setText(`${Math.round(this.crazyMeter)}%`);
    }

    // Vignette effect - darkens edges as chaos rises
    this.updateVignette();
  }

  updateVignette() {
    if (!this.vignetteGraphics) {
      this.vignetteGraphics = this.add.graphics().setDepth(8);
    }

    this.vignetteGraphics.clear();

    // Start showing vignette at 40% crazy, full intensity at 90%
    if (this.crazyMeter < 40) return;

    const intensity = Math.min(1, (this.crazyMeter - 40) / 50); // 0 at 40%, 1 at 90%
    const breathe = Math.sin(this.time.now / (500 - intensity * 300)) * 0.1; // Faster breathing as chaos rises
    const alpha = (0.15 + intensity * 0.35 + breathe) * intensity;

    // Red-tinted vignette corners
    const w = 800;
    const h = 600;
    const cornerSize = 120 + intensity * 80; // Grows inward with chaos

    // Top-left corner
    this.vignetteGraphics.fillStyle(0x8b0000, alpha * 0.6);
    this.vignetteGraphics.fillTriangle(0, 0, cornerSize, 0, 0, cornerSize);
    // Top-right corner
    this.vignetteGraphics.fillTriangle(w, 0, w - cornerSize, 0, w, cornerSize);
    // Bottom-left corner
    this.vignetteGraphics.fillTriangle(0, h, cornerSize, h, 0, h - cornerSize);
    // Bottom-right corner
    this.vignetteGraphics.fillTriangle(w, h, w - cornerSize, h, w, h - cornerSize);

    // Edge strips for smoother effect
    const edgeAlpha = alpha * 0.35;
    this.vignetteGraphics.fillStyle(0x4a0000, edgeAlpha);
    this.vignetteGraphics.fillRect(0, 0, w, 8 + intensity * 12); // top
    this.vignetteGraphics.fillRect(0, h - 8 - intensity * 12, w, 8 + intensity * 12); // bottom
    this.vignetteGraphics.fillRect(0, 0, 8 + intensity * 12, h); // left
    this.vignetteGraphics.fillRect(w - 8 - intensity * 12, 0, 8 + intensity * 12, h); // right

    // At extreme levels (>80%), add a subtle full-screen red tint
    if (this.crazyMeter > 80) {
      const tintAlpha = ((this.crazyMeter - 80) / 20) * 0.06 + breathe * 0.02;
      this.vignetteGraphics.fillStyle(0xff0000, Math.max(0, tintAlpha));
      this.vignetteGraphics.fillRect(0, 0, w, h);
    }
  }

  randomEvent() {
    if (this.gameOver || this.paused) return;

    const events = [
      () => {
        // Random cat knocks something over
        const cat = Phaser.Utils.Array.GetRandom(this.cats);
        if (cat && cat.state !== 'sleeping') {
          this.showEventText(cat.x, cat.y - 60, '💥 *CRASH*', '#e74c3c');
          cat.cleanliness = Math.max(0, cat.cleanliness - 10);
          this.cameras.main.shake(150, 0.003);
        }
      },
      () => {
        // Hairball event
        const cat = Phaser.Utils.Array.GetRandom(this.cats);
        if (cat && cat.state !== 'sleeping') {
          this.showEventText(cat.x, cat.y - 60, '🤮 *Hairball!*', '#27ae60');
          cat.cleanliness = Math.max(0, cat.cleanliness - 15);
        }
      },
      () => {
        // Cat fight!
        if (this.cats.length >= 2) {
          const cat1 = this.cats[Math.floor(Math.random() * this.cats.length)];
          let cat2 = this.cats[Math.floor(Math.random() * this.cats.length)];
          if (cat1 === cat2) cat2 = this.cats[(this.cats.indexOf(cat1) + 1) % this.cats.length];

          const midX = (cat1.x + cat2.x) / 2;
          const midY = (cat1.y + cat2.y) / 2;
          this.showEventText(midX, midY - 40, '⚡ CAT FIGHT! ⚡', '#e74c3c', 16);
          cat1.boredom = Math.max(0, cat1.boredom - 15);
          cat2.boredom = Math.max(0, cat2.boredom - 15);
          this.cameras.main.shake(300, 0.005);
        }
      },
      () => {
        // Bonus kibble appears
        this.showEventText(400, 250, '🎉 Bonus Kibble!', '#f1c40f', 16);
        this.cats.forEach(cat => {
          cat.hunger = Math.min(100, cat.hunger + 5);
        });
        this.score += 100;
      },
      () => {
        // Zoomies!
        const cat = Phaser.Utils.Array.GetRandom(this.cats);
        if (cat && cat.state !== 'sleeping') {
          this.showEventText(cat.x, cat.y - 60, '💨 ZOOMIES!', '#3498db');
          cat.boredom = Math.min(100, cat.boredom + 10);
          cat.cleanliness = Math.max(0, cat.cleanliness - 5);
          // Make cat zoom around
          cat.speed *= 3;
          this.time.delayedCall(3000, () => { cat.speed /= 3; });
        }
      },
      () => {
        // Someone knocks at the door - all cats scatter
        this.showEventText(400, 200, '🚪 *KNOCK KNOCK* - All cats scatter!', '#9b59b6', 14);
        this.cats.forEach(cat => {
          if (cat.state !== 'sleeping') {
            cat.boredom = Math.max(0, cat.boredom - 8);
            cat.targetX = cat.boundsX.min + Math.random() * (cat.boundsX.max - cat.boundsX.min);
            cat.targetY = cat.boundsY.min + Math.random() * (cat.boundsY.max - cat.boundsY.min);
          }
        });
        this.cameras.main.shake(200, 0.003);
      },
      () => {
        // Cat demands attention
        const cat = Phaser.Utils.Array.GetRandom(this.cats);
        if (cat && cat.state !== 'sleeping') {
          const need = cat.getMostUrgentNeed();
          const emoji = need === 'feed' ? '🍖' : need === 'clean' ? '🧹' : '🎾';
          this.showEventText(cat.x, cat.y - 60, `${emoji} ${cat.catName} demands ${need}!`, '#e94560');
          // Decrease that need further
          cat[need === 'feed' ? 'hunger' : need === 'clean' ? 'cleanliness' : 'boredom'] = Math.max(
            0, cat[need === 'feed' ? 'hunger' : need === 'clean' ? 'cleanliness' : 'boredom'] - 10
          );
        }
      },
      () => {
        // Nap time bonus - sleeping cats recover
        let sleepCount = 0;
        this.cats.forEach(cat => {
          if (cat.state === 'sleeping') {
            sleepCount++;
            cat.hunger = Math.min(100, cat.hunger + 3);
            cat.cleanliness = Math.min(100, cat.cleanliness + 3);
          }
        });
        if (sleepCount > 0) {
          this.showEventText(400, 250, `💤 Nap Time! ${sleepCount} cat(s) resting...`, '#3498db');
          this.score += sleepCount * 20;
        } else {
          // No cats sleeping, do a different event
          this.showEventText(400, 250, '☀️ Sun beam appears!', '#f1c40f');
          this.score += 30;
        }
      },
      () => {
        // Wine spill - all cats get dirty
        this.showEventText(400, 250, '🍷 WINE SPILL! Everyone\'s a mess!', '#722f37', 16);
        this.cats.forEach(cat => {
          cat.cleanliness = Math.max(0, cat.cleanliness - 8);
        });
        this.cameras.main.shake(150, 0.003);
      },
      () => {
        // Treat jackpot - massive hunger boost for one lucky cat
        const cat = Phaser.Utils.Array.GetRandom(this.cats);
        if (cat && cat.state !== 'sleeping') {
          this.showEventText(cat.x, cat.y - 60, '🎰 TREAT JACKPOT!', '#f1c40f', 16);
          cat.hunger = Math.min(100, cat.hunger + 40);
          cat.boredom = Math.min(100, cat.boredom + 10);
          this.score += 150;
          for (let i = 0; i < 6; i++) {
            this.time.delayedCall(i * 80, () => cat.emitParticle('kibble'));
          }
        }
      },
      () => {
        // Bird at the window - all awake cats get distracted (boredom boost)
        this.showEventText(400, 120, '🐦 Bird at the window!', '#3498db', 14);
        this.cats.forEach(cat => {
          if (cat.state !== 'sleeping') {
            cat.boredom = Math.min(100, cat.boredom + 12);
          }
        });
        this.score += 50;
      },
      () => {
        // Vacuum cleaner! All cats panic and get stressed
        this.showEventText(400, 200, '🤖 VACUUM CLEANER!!!', '#e74c3c', 18);
        this.cameras.main.shake(500, 0.006);
        this.cats.forEach(cat => {
          if (cat.state !== 'sleeping') {
            cat.boredom = Math.max(0, cat.boredom - 12);
            cat.speed *= 2;
            cat.targetX = cat.boundsX.min + Math.random() * (cat.boundsX.max - cat.boundsX.min);
            cat.targetY = cat.boundsY.min + Math.random() * (cat.boundsY.max - cat.boundsY.min);
          } else {
            // Wakes up sleeping cats
            cat.setState('idle');
            cat.stateTimer = 0;
            cat.boredom = Math.max(0, cat.boredom - 20);
          }
        });
        this.time.delayedCall(3000, () => {
          this.cats.forEach(cat => { cat.speed /= 2; });
        });
      },
      () => {
        // Laser pointer! One cat goes wild chasing it, gets entertained
        const cat = Phaser.Utils.Array.GetRandom(this.cats);
        if (cat && cat.state !== 'sleeping') {
          this.showEventText(cat.x, cat.y - 60, '🔴 LASER POINTER!', '#ff0000');
          cat.boredom = Math.min(100, cat.boredom + 25);
          cat.cleanliness = Math.max(0, cat.cleanliness - 3);
          this.score += 75;
          // Rapid movement
          let moves = 0;
          const laserChase = this.time.addEvent({
            delay: 300,
            callback: () => {
              if (cat && cat.scene) {
                cat.targetX = cat.boundsX.min + Math.random() * (cat.boundsX.max - cat.boundsX.min);
                cat.targetY = cat.boundsY.min + Math.random() * (cat.boundsY.max - cat.boundsY.min);
                cat.emitParticle('star');
              }
              moves++;
              if (moves >= 8) laserChase.destroy();
            },
            loop: true,
          });
        }
      },
      () => {
        // Thunderstorm - all cats get scared, need comfort
        this.showEventText(400, 150, '⛈️ THUNDERSTORM!', '#5d6d7e', 18);
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(500, () => this.cameras.main.flash(100, 255, 255, 255));
        this.cats.forEach(cat => {
          cat.boredom = Math.max(0, cat.boredom - 10);
          cat.hunger = Math.max(0, cat.hunger - 3);
          if (cat.state === 'sleeping') {
            cat.setState('idle');
            cat.stateTimer = 0;
          }
        });
      },
      () => {
        // Cat yoga - all calm cats get a small boost to everything
        let calmCount = 0;
        this.cats.forEach(cat => {
          const minNeed = Math.min(cat.hunger, cat.cleanliness, cat.boredom);
          if (minNeed > 40 && cat.state !== 'crazy' && cat.state !== 'angry') {
            calmCount++;
            cat.hunger = Math.min(100, cat.hunger + 5);
            cat.cleanliness = Math.min(100, cat.cleanliness + 5);
            cat.boredom = Math.min(100, cat.boredom + 5);
          }
        });
        if (calmCount > 0) {
          this.showEventText(400, 250, `🧘 Cat Yoga! ${calmCount} cat(s) feel zen~`, '#2ecc71', 14);
          this.score += calmCount * 40;
        } else {
          this.showEventText(400, 250, '😾 Too chaotic for yoga...', '#e74c3c');
        }
      },
    ];

    soundManager.eventSound();
    const event = Phaser.Utils.Array.GetRandom(events);
    event();
  }

  showEventText(x, y, text, color, fontSize = 14) {
    const msg = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial',
      color: color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: msg,
      y: msg.y - 25,
      alpha: 0,
      duration: 2500,
      onComplete: () => msg.destroy(),
    });
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;

    // Update all cats
    this.cats.forEach(cat => cat.update(time, delta));

    // Update wall clock
    this.drawWallClock(this.gameTime);

    // Ambient cat sounds (random meows)
    if (!this._lastMeowTime || time - this._lastMeowTime > 6000 + Math.random() * 8000) {
      const randomCat = Phaser.Utils.Array.GetRandom(this.cats);
      if (randomCat && randomCat.state !== 'sleeping') {
        if (randomCat.getCrazyLevel() > 60) {
          soundManager.angryMeow();
        } else if (Math.random() < 0.4) {
          soundManager.meow();
        }
      }
      this._lastMeowTime = time;
    }

    // Update crazy meter
    this.updateCrazyMeter();

    // Update score display
    this.scoreText.setText(`SCORE: ${this.score}`);

    // Update time
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = this.gameTime % 60;
    this.timeText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // Update difficulty text
    const lvl = Math.floor(1 + this.gameTime / 30);
    const lvlColors = ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'];
    this.diffText.setText(`LVL ${lvl}`);
    this.diffText.setColor(lvlColors[Math.min(lvl - 1, lvlColors.length - 1)]);

    // Combo decay
    if (this.comboCount > 0 && time - this.lastActionTime > 3000) {
      this.comboCount = 0;
      this.comboText.setText('');
    }

    // Warning border pulse + sound
    if (this.warningBorder) {
      const alpha = 0.3 + Math.sin(time / 150) * 0.3;
      this.warningBorder.setStrokeStyle(4, 0xe74c3c, alpha);
      // Play warning beep every ~2 seconds when critical
      if (!this._lastWarningTime || time - this._lastWarningTime > 2000) {
        soundManager.warningSound();
        this._lastWarningTime = time;
      }
    }

    // Check auto achievements every second
    if (!this._lastAchCheck || time - this._lastAchCheck > 1000) {
      this.checkAutoAchievements();
      this._lastAchCheck = time;
    }

    // Check game over
    if (this.crazyMeter >= 95) {
      this.triggerGameOver();
    }

    // Decay station cooldowns
    if (this.stationCooldowns) {
      const dt = delta / 1000;
      for (const key in this.stationCooldowns) {
        if (this.stationCooldowns[key] > 0) {
          this.stationCooldowns[key] = Math.max(0, this.stationCooldowns[key] - dt);
        }
      }
    }

    // Sort cats by Y for depth
    this.cats.forEach(cat => {
      cat.setDepth(2 + (cat.y / 600));
    });
  }

  spawnPowerUp() {
    if (this.gameOver || this.paused) return;
    // Max 2 power-ups on screen at once
    if (this.powerUps.length >= 2) return;

    // Random chance to not spawn (keeps it special)
    if (Math.random() < 0.3) return;

    const types = [
      { key: 'powerup_catnip', name: 'Catnip Bomb', emoji: '🌿', color: '#2ecc71', action: 'entertain' },
      { key: 'powerup_kibble', name: 'Mega Kibble', emoji: '🍖', color: '#e74c3c', action: 'feed' },
      { key: 'powerup_bath', name: 'Sparkle Bath', emoji: '✨', color: '#3498db', action: 'clean' },
    ];

    const type = Phaser.Utils.Array.GetRandom(types);
    const x = 100 + Math.random() * 600;
    const y = 300 + Math.random() * 160;

    const powerUp = this.add.image(x, y, type.key).setScale(0.9).setDepth(5);
    powerUp.powerUpType = type;

    // Bobbing animation
    this.tweens.add({
      targets: powerUp,
      y: y - 8,
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glow pulse
    this.tweens.add({
      targets: powerUp,
      alpha: { from: 0.7, to: 1.0 },
      scale: { from: 0.85, to: 1.0 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Label
    const label = this.add.text(x, y + 28, type.name, {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: type.color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(5);

    powerUp.label = label;
    this.powerUps.push(powerUp);

    // Auto-despawn after 10 seconds
    this.time.delayedCall(10000, () => {
      this.removePowerUp(powerUp);
    });
  }

  checkPowerUpClick(px, py) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      if (!pu || !pu.scene) continue;
      const dist = Phaser.Math.Distance.Between(px, py, pu.x, pu.y);
      if (dist < 30) {
        this.activatePowerUp(pu);
        return true;
      }
    }
    return false;
  }

  activatePowerUp(powerUp) {
    const type = powerUp.powerUpType;
    soundManager.powerUpSound();
    this.checkAchievement('powerup');

    // Big announcement
    this.showEventText(400, 200, `⚡ ${type.emoji} ${type.name.toUpperCase()}! ⚡`, type.color, 20);
    this.cameras.main.flash(200, ...this.hexToRGB(type.color));

    // Apply effect to ALL cats
    const gain = 20 + Math.random() * 10;
    this.cats.forEach(cat => {
      if (cat.state === 'sleeping') return; // Don't wake sleeping cats

      switch (type.action) {
        case 'feed':
          cat.hunger = Math.min(100, cat.hunger + gain);
          break;
        case 'clean':
          cat.cleanliness = Math.min(100, cat.cleanliness + gain);
          break;
        case 'entertain':
          cat.boredom = Math.min(100, cat.boredom + gain);
          break;
      }

      // Particle burst on each cat
      for (let j = 0; j < 3; j++) {
        this.time.delayedCall(j * 100, () => {
          cat.emitParticle(type.action === 'feed' ? 'kibble' : type.action === 'clean' ? 'star' : 'heart');
        });
      }
    });

    // Bonus score
    this.score += 200;
    const floatText = this.add.text(powerUp.x, powerUp.y - 30, '+200 ⚡', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: type.color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => floatText.destroy(),
    });

    // Screen shake
    this.cameras.main.shake(200, 0.004);

    this.removePowerUp(powerUp);
  }

  removePowerUp(powerUp) {
    if (!powerUp || !powerUp.scene) return;
    const idx = this.powerUps.indexOf(powerUp);
    if (idx !== -1) this.powerUps.splice(idx, 1);
    if (powerUp.label && powerUp.label.scene) powerUp.label.destroy();
    powerUp.destroy();
  }

  // --- Achievement / Toast System ---
  initAchievements() {
    this.achievements = {
      first_feed: { name: 'First Meal!', emoji: '🍖', desc: 'Fed your first cat', unlocked: false },
      first_clean: { name: 'Tidy Up!', emoji: '🧹', desc: 'Cleaned your first cat', unlocked: false },
      first_entertain: { name: 'Playtime!', emoji: '🎾', desc: 'Entertained your first cat', unlocked: false },
      combo_3: { name: 'Combo Starter', emoji: '🔥', desc: 'Hit a 3x combo', unlocked: false },
      combo_5: { name: 'Combo Master', emoji: '💥', desc: 'Hit a 5x combo', unlocked: false },
      combo_10: { name: 'COMBO GOD', emoji: '⚡', desc: 'Hit a 10x combo', unlocked: false },
      survive_1: { name: 'One Minute!', emoji: '⏱️', desc: 'Survived 1 minute', unlocked: false },
      survive_3: { name: 'Cat Wrangler', emoji: '🏅', desc: 'Survived 3 minutes', unlocked: false },
      survive_5: { name: 'Chaos Master', emoji: '🏆', desc: 'Survived 5 minutes', unlocked: false },
      score_1k: { name: '1K Club', emoji: '💰', desc: 'Reached 1,000 points', unlocked: false },
      score_5k: { name: 'High Roller', emoji: '💎', desc: 'Reached 5,000 points', unlocked: false },
      powerup: { name: 'Power Surge', emoji: '⚡', desc: 'Collected a power-up', unlocked: false },
      station_used: { name: 'Self-Service', emoji: '🏪', desc: 'Used a furniture station', unlocked: false },
      all_happy: { name: 'Cat Whisperer', emoji: '😺', desc: 'All cats above 70% needs', unlocked: false },
      wake_up: { name: 'Early Bird', emoji: '⏰', desc: 'Woke up a sleeping cat', unlocked: false },
    };
    this.toastQueue = [];
    this.activeToast = null;
  }

  checkAchievement(key) {
    if (!this.achievements) return;
    const ach = this.achievements[key];
    if (!ach || ach.unlocked) return;
    ach.unlocked = true;
    this.showToast(ach);
  }

  checkAutoAchievements() {
    if (!this.achievements) return;

    // Combo achievements (use bestCombo so they persist after decay)
    if (this.bestCombo >= 3) this.checkAchievement('combo_3');
    if (this.bestCombo >= 5) this.checkAchievement('combo_5');
    if (this.bestCombo >= 10) this.checkAchievement('combo_10');

    // Time achievements
    if (this.gameTime >= 60) this.checkAchievement('survive_1');
    if (this.gameTime >= 180) this.checkAchievement('survive_3');
    if (this.gameTime >= 300) this.checkAchievement('survive_5');

    // Score achievements
    if (this.score >= 1000) this.checkAchievement('score_1k');
    if (this.score >= 5000) this.checkAchievement('score_5k');

    // All happy check (all cats have all needs > 70)
    const allHappy = this.cats.every(cat =>
      cat.hunger > 70 && cat.cleanliness > 70 && cat.boredom > 70
    );
    if (allHappy && this.gameTime > 5) this.checkAchievement('all_happy');
  }

  showToast(achievement) {
    this.toastQueue.push(achievement);
    if (!this.activeToast) {
      this.displayNextToast();
    }
  }

  displayNextToast() {
    if (this.toastQueue.length === 0) {
      this.activeToast = null;
      return;
    }

    const ach = this.toastQueue.shift();
    soundManager.milestoneSound();

    const container = this.add.container(400, -60).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-140, -25, 280, 50, 12);
    bg.lineStyle(2, 0xf1c40f, 0.8);
    bg.strokeRoundedRect(-140, -25, 280, 50, 12);
    container.add(bg);

    const icon = this.add.text(-120, 0, ach.emoji, { fontSize: '24px' }).setOrigin(0, 0.5);
    container.add(icon);

    const title = this.add.text(-90, -8, `🏆 ${ach.name}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#f1c40f', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    container.add(title);

    const desc = this.add.text(-90, 10, ach.desc, {
      fontSize: '10px', fontFamily: 'Arial', color: '#bdc3c7',
    }).setOrigin(0, 0.5);
    container.add(desc);

    this.activeToast = container;

    // Slide in
    this.tweens.add({
      targets: container,
      y: 80,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Slide out after 2.5s
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: container,
        y: -60,
        alpha: 0,
        duration: 300,
        ease: 'Sine.easeIn',
        onComplete: () => {
          container.destroy();
          this.displayNextToast();
        }
      });
    });
  }

  hexToRGB(hex) {
    const color = Phaser.Display.Color.HexStringToColor(hex);
    return [color.red, color.green, color.blue];
  }

  saveHighScore() {
    try {
      const raw = localStorage.getItem('crazycats_highscores');
      let scores = raw ? JSON.parse(raw) : [];
      scores.push({
        score: this.score,
        time: this.gameTime,
        difficulty: this.difficulty || 'normal',
        date: Date.now(),
      });
      // Sort by score descending, keep top 10
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 10);
      localStorage.setItem('crazycats_highscores', JSON.stringify(scores));

      // Check if this is a new high score
      return scores[0].score === this.score;
    } catch (e) {
      return false;
    }
  }

  triggerGameOver() {
    this.gameOver = true;
    soundManager.gameOverSound();

    // Big screen shake
    this.cameras.main.shake(500, 0.01);

    // Flash red
    this.cameras.main.flash(300, 255, 0, 0);

    // Clean up power-ups
    this.powerUps.forEach(pu => {
      if (pu.label && pu.label.scene) pu.label.destroy();
      if (pu.scene) pu.destroy();
    });
    this.powerUps = [];

    // Clean up warning border
    if (this.warningBorder) {
      this.warningBorder.destroy();
      this.warningBorder = null;
    }

    // Save high score
    const isNewHighScore = this.saveHighScore();

    // Dark overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0).setDepth(50);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.8,
      duration: 500,
    });

    // Game over text
    const gameOverText = this.add.text(400, 150, '😿 GAME OVER 😿', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Impact, sans-serif',
      color: '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(51);

    this.add.text(400, 210, 'The cats have gone completely insane!', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ecf0f1',
    }).setOrigin(0.5).setDepth(51);

    // Stats panel
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = this.gameTime % 60;
    const statsLines = [
      `🏆 Final Score: ${this.score}`,
      `⏱️ Time Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`,
      `🐱 Cats Managed: ${this.cats.length}`,
      `🎯 Total Actions: ${this.totalActions}`,
      `🔥 Best Combo: x${this.bestCombo}`,
      `📈 Difficulty: Level ${this.difficultyLevel}`,
    ];

    statsLines.forEach((line, i) => {
      this.add.text(400, 265 + i * 26, line, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#f1c40f',
        align: 'center',
      }).setOrigin(0.5).setDepth(51);
    });

    // Cat status summary
    let craziest = this.cats[0];
    this.cats.forEach(c => {
      if (c.getCrazyLevel() > craziest.getCrazyLevel()) craziest = c;
    });
    // Achievement count
    const achCount = this.achievements ? Object.values(this.achievements).filter(a => a.unlocked).length : 0;
    const achTotal = this.achievements ? Object.keys(this.achievements).length : 0;
    this.add.text(400, 425, `🏆 Achievements: ${achCount}/${achTotal}`, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);

    this.add.text(400, 443, `Craziest cat: ${craziest.catName} (${Math.round(craziest.getCrazyLevel())}% crazy)`, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#e94560',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(51);

    // Funny quote
    const quotes = [
      '"They warned you about the nips..."',
      '"Laser pointers really ARE lies."',
      '"You shredded. Therefore, you lost."',
      '"At least the cats had fun."',
      '"Chaos Management Protocol: FAILED"',
      '"Next time, try more kibble."',
      '"The wine was a bad influence."',
      '"Princess is NOT amused."',
      '"Whiskey sends his regards."',
    ];
    this.add.text(400, 462, Phaser.Utils.Array.GetRandom(quotes), {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#95a5a6',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(51);

    // New high score banner
    if (isNewHighScore) {
      soundManager.highScoreSound();
      const hsText = this.add.text(400, 130, '🏆 NEW HIGH SCORE! 🏆', {
        fontSize: '20px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#f1c40f',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(52);

      this.tweens.add({
        targets: hsText,
        scaleX: { from: 1.0, to: 1.1 },
        scaleY: { from: 1.0, to: 1.1 },
        alpha: { from: 0.8, to: 1.0 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }

    // Retry button
    const retryBg = this.add.graphics().setDepth(51);
    retryBg.fillStyle(0xe94560, 1);
    retryBg.fillRoundedRect(295, 485, 100, 45, 12);
    retryBg.lineStyle(2, 0xffffff, 0.5);
    retryBg.strokeRoundedRect(295, 485, 100, 45, 12);

    const retryText = this.add.text(345, 508, '🔄 RETRY', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52);

    const retryHit = this.add.rectangle(345, 508, 100, 45, 0x000000, 0)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(53);

    retryHit.on('pointerdown', () => {
      this.scene.restart({
        difficulty: this.difficulty,
        decayMult: this.decayMult,
        eventDelay: this.baseEventDelay,
      });
    });

    retryHit.on('pointerover', () => {
      retryBg.clear();
      retryBg.fillStyle(0xff6b81, 1);
      retryBg.fillRoundedRect(295, 485, 100, 45, 12);
    });

    retryHit.on('pointerout', () => {
      retryBg.clear();
      retryBg.fillStyle(0xe94560, 1);
      retryBg.fillRoundedRect(295, 485, 100, 45, 12);
    });

    // Menu button
    const menuBg = this.add.graphics().setDepth(51);
    menuBg.fillStyle(0x3498db, 1);
    menuBg.fillRoundedRect(410, 485, 100, 45, 12);
    menuBg.lineStyle(2, 0xffffff, 0.5);
    menuBg.strokeRoundedRect(410, 485, 100, 45, 12);

    this.add.text(460, 508, '🏠 MENU', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52);

    const menuHit = this.add.rectangle(460, 508, 100, 45, 0x000000, 0)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(53);

    menuHit.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    menuHit.on('pointerover', () => {
      menuBg.clear();
      menuBg.fillStyle(0x5dade2, 1);
      menuBg.fillRoundedRect(410, 485, 100, 45, 12);
    });

    menuHit.on('pointerout', () => {
      menuBg.clear();
      menuBg.fillStyle(0x3498db, 1);
      menuBg.fillRoundedRect(410, 485, 100, 45, 12);
    });

    // Animate game over entrance
    gameOverText.setScale(0);
    this.tweens.add({
      targets: gameOverText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
  }
}
