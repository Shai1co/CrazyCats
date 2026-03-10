import Phaser from 'phaser';

const STATES = {
  IDLE: 'idle',
  WANDERING: 'wandering',
  SLEEPING: 'sleeping',
  EATING: 'eating',
  PLAYING: 'playing',
  CRAZY: 'crazy',
  ANGRY: 'angry',
  KNOCKING: 'knocking',
};

const SPEECH_BUBBLES = {
  tough: [
    "I'll shred your couch.",
    "Knives out. Always.",
    "Feed me or suffer.",
    "I own this place.",
    "You disgust me.",
    "*judges silently*",
    "...pathetic.",
  ],
  derpy: [
    "Where's my food??",
    "I sat on the remote!",
    "Oops I fell again",
    "Is that... a bug?!",
    "Huhh? What?",
    "FOOD FOOD FOOD",
    "*trips on nothing*",
  ],
  sassy: [
    "This bowl is DIRTY.",
    "Ugh, peasant food.",
    "I need a spa day.",
    "Don't TOUCH me.",
    "My litter is unacceptable.",
    "I deserve better.",
    "*flips hair*",
  ],
  chill: [
    "Zzz...",
    "5 more minutes...",
    "...*yawn*...",
    "Nap time is all time.",
    "I was sleeping.",
    "Whatever man...",
    "*stretches lazily*",
  ],
  chaotic: [
    "ZOOMIES!!!",
    "CATCH ME IF YOU CAN!",
    "AAAAAHHH!",
    "*knocks everything*",
    "CHAOS! CHAOS!",
    "I AM SPEED!",
    "YEEEEHAW!",
  ],
};

export default class Cat extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config) {
    super(scene, x, y);
    scene.add.existing(this);

    this.catName = config.name;
    this.spriteKey = config.spriteKey;
    this.personality = config.personality || 'normal';

    // Needs (0-100, lower = more urgent)
    this.hunger = 70 + Math.random() * 30;
    this.cleanliness = 70 + Math.random() * 30;
    this.boredom = 70 + Math.random() * 30;

    // State
    this.state = STATES.IDLE;
    this.stateTimer = 0;
    this.stateDuration = 2000;
    this.speed = 60 + Math.random() * 40;
    this.targetX = x;
    this.targetY = y;

    // Movement bounds (apartment floor area)
    this.boundsX = { min: 60, max: 740 };
    this.boundsY = { min: 280, max: 480 };

    // Speech bubble timer
    this.speechTimer = 5000 + Math.random() * 10000;
    this.activeSpeechBubble = null;

    // Hover state
    this.isHovered = false;

    // Create highlight glow (behind sprite)
    this.highlightGlow = scene.add.graphics();
    this.highlightGlow.setAlpha(0);
    this.add(this.highlightGlow);

    // Create sprite
    this.sprite = scene.add.image(0, 0, this.spriteKey);
    this.sprite.setScale(1.2);
    this.add(this.sprite);

    // Name tag
    this.nameTag = scene.add.text(0, -48, this.catName, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    this.add(this.nameTag);

    // Needs indicator (small bars above cat)
    this.needsContainer = scene.add.container(0, -60);
    this.add(this.needsContainer);

    this.hungerBar = this.createMiniBar(scene, -18, 0, '#e74c3c');
    this.cleanBar = this.createMiniBar(scene, 0, 0, '#3498db');
    this.boredomBar = this.createMiniBar(scene, 18, 0, '#f39c12');

    // Need labels (hidden by default, shown on hover)
    this.needLabels = scene.add.container(0, -72);
    this.needLabels.setAlpha(0);
    const lblStyle = { fontSize: '8px', fontFamily: 'Arial', fontStyle: 'bold' };
    this.needLabels.add(scene.add.text(-18, 0, '🍖', lblStyle).setOrigin(0.5));
    this.needLabels.add(scene.add.text(0, 0, '🧹', lblStyle).setOrigin(0.5));
    this.needLabels.add(scene.add.text(18, 0, '🎾', lblStyle).setOrigin(0.5));
    this.add(this.needLabels);

    // Status emoji
    this.statusEmoji = scene.add.text(35, -35, '', {
      fontSize: '16px',
    }).setOrigin(0.5);
    this.add(this.statusEmoji);

    // BIGGER hitbox for easier clicking
    this.setSize(100, 80);
    this.setInteractive({ cursor: 'pointer', hitArea: new Phaser.Geom.Rectangle(-50, -40, 100, 80), hitAreaCallback: Phaser.Geom.Rectangle.Contains });

    // Hover effects
    this.on('pointerover', () => {
      this.isHovered = true;
      this.drawHighlight(true);
      scene.tweens.add({
        targets: this.needLabels,
        alpha: 1,
        duration: 150,
      });
      // Scale up slightly
      scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.35,
        scaleY: 1.35,
        duration: 100,
      });
      // Show detailed tooltip
      this.showDetailedTooltip();
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.drawHighlight(false);
      scene.tweens.add({
        targets: this.needLabels,
        alpha: 0,
        duration: 150,
      });
      // Scale back
      if (this.state !== STATES.SLEEPING) {
        scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 100,
        });
      }
      // Hide detailed tooltip
      this.hideDetailedTooltip();
    });

    // Personality modifiers
    this.setupPersonality();

    // Start AI
    this.pickNewState();
  }

  drawHighlight(show) {
    this.highlightGlow.clear();
    if (show) {
      // Determine color based on most urgent need
      let color = 0xf1c40f; // default yellow
      const minNeed = Math.min(this.hunger, this.cleanliness, this.boredom);
      if (minNeed < 25) {
        if (this.hunger <= this.cleanliness && this.hunger <= this.boredom) color = 0xe74c3c;
        else if (this.cleanliness <= this.hunger && this.cleanliness <= this.boredom) color = 0x3498db;
        else color = 0xf39c12;
      }

      this.highlightGlow.lineStyle(3, color, 0.6);
      this.highlightGlow.strokeCircle(0, 0, 40);
      this.highlightGlow.lineStyle(2, color, 0.3);
      this.highlightGlow.strokeCircle(0, 0, 46);
      this.highlightGlow.setAlpha(1);
    }
  }

  createMiniBar(scene, x, y, color) {
    const bg = scene.add.rectangle(x, y, 14, 4, 0x333333).setOrigin(0.5);
    const fill = scene.add.rectangle(x - 6, y, 12, 3, Phaser.Display.Color.HexStringToColor(color).color).setOrigin(0, 0.5);
    this.needsContainer.add([bg, fill]);
    return fill;
  }

  setupPersonality() {
    switch (this.personality) {
      case 'tough':
        this.hungerDecay = 0.8;
        this.cleanDecay = 0.5;
        this.boredomDecay = 1.0;
        this.crazyThreshold = 20;
        break;
      case 'derpy':
        this.hungerDecay = 1.5;
        this.cleanDecay = 0.8;
        this.boredomDecay = 0.6;
        this.crazyThreshold = 25;
        this.speed *= 0.8;
        break;
      case 'sassy':
        this.hungerDecay = 0.6;
        this.cleanDecay = 1.3;
        this.boredomDecay = 0.9;
        this.crazyThreshold = 30;
        break;
      case 'chill':
        this.hungerDecay = 0.5;
        this.cleanDecay = 0.4;
        this.boredomDecay = 0.4;
        this.crazyThreshold = 15;
        this.speed *= 0.6;
        break;
      case 'chaotic':
        this.hungerDecay = 1.0;
        this.cleanDecay = 1.0;
        this.boredomDecay = 1.5;
        this.crazyThreshold = 35;
        this.speed *= 1.3;
        break;
      default:
        this.hungerDecay = 0.8;
        this.cleanDecay = 0.7;
        this.boredomDecay = 0.8;
        this.crazyThreshold = 25;
    }
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Difficulty scaling - needs decay faster over time (game gets harder)
    const gameTime = this.scene.gameTime || 0;
    const baseDiffMult = this.scene.decayMult || 1.0; // from difficulty selection
    const timeMultiplier = 1 + (gameTime / 120) * 0.5; // 50% harder every 2 minutes
    const difficultyMultiplier = baseDiffMult * timeMultiplier;

    // Decay needs
    this.hunger -= this.hungerDecay * dt * 1.2 * difficultyMultiplier;
    this.cleanliness -= this.cleanDecay * dt * 0.9 * difficultyMultiplier;
    this.boredom -= this.boredomDecay * dt * 1.0 * difficultyMultiplier;

    this.hunger = Math.max(0, Math.min(100, this.hunger));
    this.cleanliness = Math.max(0, Math.min(100, this.cleanliness));
    this.boredom = Math.max(0, Math.min(100, this.boredom));

    // Update mini bars
    this.hungerBar.scaleX = this.hunger / 100;
    this.cleanBar.scaleX = this.cleanliness / 100;
    this.boredomBar.scaleX = this.boredom / 100;

    // Color mini bars red when critical
    if (this.hunger < 20) {
      this.hungerBar.fillColor = 0xff0000;
    } else {
      this.hungerBar.fillColor = 0xe74c3c;
    }
    if (this.cleanliness < 20) {
      this.cleanBar.fillColor = 0xff0000;
    } else {
      this.cleanBar.fillColor = 0x3498db;
    }
    if (this.boredom < 20) {
      this.boredomBar.fillColor = 0xff0000;
    } else {
      this.boredomBar.fillColor = 0xf39c12;
    }

    // State machine
    this.stateTimer += delta;
    if (this.stateTimer >= this.stateDuration) {
      this.pickNewState();
    }

    this.executeState(dt);
    this.updateStatusEmoji();

    // Speech bubbles
    this.speechTimer -= delta;
    if (this.speechTimer <= 0) {
      this.showSpeechBubble();
      this.speechTimer = 8000 + Math.random() * 15000;
    }

    // Update hover highlight if active
    if (this.isHovered) {
      this.drawHighlight(true);
    }

    // Draw urgency ring when needs are critical (even when not hovered)
    this.updateUrgencyRing(time);

    // Emit stink particles when dirty
    if (this.cleanliness < 15 && Math.random() < 0.02) {
      this.emitParticle('stink');
    }

    // Emit poop particle when very dirty
    if (this.cleanliness < 5 && Math.random() < 0.005) {
      this.emitParticle('poop');
    }

    // Emit angry particles when very bored
    if (this.boredom < 10 && Math.random() < 0.015) {
      this.emitParticle('angry_symbol');
    }

    // Emit heart particles when all needs happy
    if (this.hunger > 80 && this.cleanliness > 80 && this.boredom > 80 && Math.random() < 0.005) {
      this.emitParticle('heart');
    }
  }

  showSpeechBubble() {
    if (this.activeSpeechBubble) return;
    if (this.state === STATES.SLEEPING) return;

    const lines = SPEECH_BUBBLES[this.personality] || SPEECH_BUBBLES.derpy;
    const line = Phaser.Utils.Array.GetRandom(lines);

    // Create speech bubble (well above the need bars/labels)
    const bubble = this.scene.add.container(this.x, this.y - 95);
    bubble.setDepth(25);

    const bg = this.scene.add.graphics();
    const text = this.scene.add.text(0, 0, line, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#222',
      fontStyle: 'bold',
      padding: { x: 6, y: 3 },
      wordWrap: { width: 120 },
    }).setOrigin(0.5);

    const tw = text.width + 12;
    const th = text.height + 6;

    bg.fillStyle(0xffffff, 0.95);
    bg.fillRoundedRect(-tw / 2, -th / 2, tw, th, 8);
    bg.lineStyle(2, 0x333333, 0.8);
    bg.strokeRoundedRect(-tw / 2, -th / 2, tw, th, 8);

    // Speech bubble tail
    bg.fillStyle(0xffffff, 0.95);
    bg.fillTriangle(
      -5, th / 2 - 2,
      5, th / 2 - 2,
      0, th / 2 + 8
    );

    bubble.add([bg, text]);
    this.activeSpeechBubble = bubble;

    // Animate in
    bubble.setScale(0);
    this.scene.tweens.add({
      targets: bubble,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Fade out after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (bubble && bubble.scene) {
        this.scene.tweens.add({
          targets: bubble,
          alpha: 0,
          y: bubble.y - 15,
          duration: 500,
          onComplete: () => {
            bubble.destroy();
            this.activeSpeechBubble = null;
          }
        });
      } else {
        this.activeSpeechBubble = null;
      }
    });
  }

  pickNewState() {
    this.stateTimer = 0;

    const avgNeed = (this.hunger + this.cleanliness + this.boredom) / 3;
    const minNeed = Math.min(this.hunger, this.cleanliness, this.boredom);

    if (minNeed < this.crazyThreshold) {
      this.setState(STATES.CRAZY);
      this.stateDuration = 3000 + Math.random() * 2000;
      return;
    }

    if (minNeed < 35) {
      this.setState(STATES.ANGRY);
      this.stateDuration = 2000 + Math.random() * 1000;
      return;
    }

    const roll = Math.random();
    if (this.personality === 'chill' && roll < 0.4) {
      this.setState(STATES.SLEEPING);
      this.stateDuration = 4000 + Math.random() * 4000;
    } else if (this.personality === 'chaotic' && roll < 0.3) {
      this.setState(STATES.KNOCKING);
      this.stateDuration = 2000;
    } else if (roll < 0.15) {
      this.setState(STATES.SLEEPING);
      this.stateDuration = 3000 + Math.random() * 5000;
    } else if (roll < 0.35) {
      this.setState(STATES.IDLE);
      this.stateDuration = 1500 + Math.random() * 2000;
    } else if (roll < 0.5) {
      this.setState(STATES.PLAYING);
      this.stateDuration = 2000 + Math.random() * 2000;
    } else {
      this.setState(STATES.WANDERING);
      this.stateDuration = 2000 + Math.random() * 3000;
      this.targetX = this.boundsX.min + Math.random() * (this.boundsX.max - this.boundsX.min);
      this.targetY = this.boundsY.min + Math.random() * (this.boundsY.max - this.boundsY.min);
    }
  }

  setState(newState) {
    this.state = newState;

    if (newState === STATES.SLEEPING) {
      this.sprite.setTexture(this.spriteKey + '_sleep');
    } else {
      this.sprite.setTexture(this.spriteKey);
    }
  }

  executeState(dt) {
    switch (this.state) {
      case STATES.WANDERING:
        this.moveToTarget(dt);
        this.sprite.y = Math.sin(this.scene.time.now / 200) * 2;
        break;

      case STATES.SLEEPING:
        this.sprite.scaleX = 1.2 + Math.sin(this.scene.time.now / 800) * 0.05;
        this.sprite.scaleY = 1.2 - Math.sin(this.scene.time.now / 800) * 0.03;
        this.boredom = Math.min(100, this.boredom + dt * 0.3);
        break;

      case STATES.CRAZY:
        if (Math.random() < 0.05) {
          this.targetX = this.boundsX.min + Math.random() * (this.boundsX.max - this.boundsX.min);
          this.targetY = this.boundsY.min + Math.random() * (this.boundsY.max - this.boundsY.min);
        }
        this.moveToTarget(dt, 2.5);
        this.sprite.angle = Math.sin(this.scene.time.now / 50) * 15;
        this.sprite.y = Math.sin(this.scene.time.now / 100) * 5;
        if (Math.random() < 0.03) {
          this.emitParticle('angry_symbol');
        }
        break;

      case STATES.ANGRY:
        this.sprite.angle = Math.sin(this.scene.time.now / 80) * 8;
        if (Math.random() < 0.02) {
          this.emitParticle('angry_symbol');
        }
        break;

      case STATES.PLAYING:
        this.sprite.y = Math.abs(Math.sin(this.scene.time.now / 150)) * -10;
        this.sprite.angle = Math.sin(this.scene.time.now / 200) * 10;
        break;

      case STATES.KNOCKING:
        this.x += Math.sin(this.scene.time.now / 100) * 2;
        this.sprite.angle = Math.sin(this.scene.time.now / 80) * 5;
        break;

      case STATES.EATING:
        // Nom nom animation
        this.sprite.y = Math.sin(this.scene.time.now / 100) * 1;
        this.sprite.scaleX = 1.2 + Math.sin(this.scene.time.now / 150) * 0.05;
        break;

      case STATES.IDLE:
      default:
        this.sprite.angle = 0;
        this.sprite.y = 0;
        if (Math.random() < 0.01) {
          this.scene.tweens.add({
            targets: this.sprite,
            angle: { from: -5, to: 5 },
            duration: 200,
            yoyo: true,
          });
        }
        break;
    }

    // Update speech bubble position
    if (this.activeSpeechBubble && this.activeSpeechBubble.scene) {
      this.activeSpeechBubble.x = this.x;
      this.activeSpeechBubble.y = this.y - 95;
    }
  }

  moveToTarget(dt, speedMultiplier = 1) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const moveSpeed = this.speed * speedMultiplier * dt;
      this.x += (dx / dist) * moveSpeed;
      this.y += (dy / dist) * moveSpeed;
      this.sprite.flipX = dx < 0;
    }

    this.x = Phaser.Math.Clamp(this.x, this.boundsX.min, this.boundsX.max);
    this.y = Phaser.Math.Clamp(this.y, this.boundsY.min, this.boundsY.max);
  }

  updateStatusEmoji() {
    const minNeed = Math.min(this.hunger, this.cleanliness, this.boredom);

    if (this.state === STATES.SLEEPING) {
      this.statusEmoji.setText('💤');
    } else if (this.state === STATES.CRAZY) {
      this.statusEmoji.setText('🤪');
    } else if (this.state === STATES.ANGRY) {
      this.statusEmoji.setText('😾');
    } else if (this.state === STATES.EATING) {
      this.statusEmoji.setText('😋');
    } else if (this.hunger < 25) {
      this.statusEmoji.setText('🍖');
    } else if (this.cleanliness < 25) {
      this.statusEmoji.setText('🧹');
    } else if (this.boredom < 25) {
      this.statusEmoji.setText('😿');
    } else if (this.state === STATES.PLAYING) {
      this.statusEmoji.setText('⭐');
    } else if (minNeed > 70) {
      this.statusEmoji.setText('😺');
    } else {
      this.statusEmoji.setText('');
    }

    // Flash name tag red when critical
    if (minNeed < 15) {
      const flash = Math.sin(this.scene.time.now / 150) > 0;
      this.nameTag.setColor(flash ? '#ff0000' : '#ffffff');
      this.nameTag.setBackgroundColor(flash ? '#ff000066' : '#00000088');
    } else if (minNeed < 30) {
      this.nameTag.setColor('#ffaa00');
      this.nameTag.setBackgroundColor('#00000088');
    } else {
      this.nameTag.setColor('#ffffff');
      this.nameTag.setBackgroundColor('#00000088');
    }
  }

  emitParticle(key) {
    if (!this.scene) return;
    const p = this.scene.add.image(
      this.x + (Math.random() - 0.5) * 20,
      this.y - 30,
      key
    ).setScale(0.8).setDepth(15);

    this.scene.tweens.add({
      targets: p,
      y: p.y - 30,
      alpha: 0,
      scale: 0.3,
      duration: 800,
      onComplete: () => p.destroy()
    });
  }

  // Returns the most urgent need name
  getMostUrgentNeed() {
    if (this.hunger <= this.cleanliness && this.hunger <= this.boredom) return 'feed';
    if (this.cleanliness <= this.hunger && this.cleanliness <= this.boredom) return 'clean';
    return 'entertain';
  }

  // Action handlers
  feed() {
    if (this.state === STATES.SLEEPING) return false;
    const gain = 30 + Math.random() * 15;
    this.hunger = Math.min(100, this.hunger + gain);
    this.setState(STATES.EATING);
    this.stateDuration = 2000;
    this.stateTimer = 0;

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.4,
      scaleY: 1.0,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });

    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => this.emitParticle('heart'));
    }
    // Kibble spray
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 80, () => this.emitParticle('kibble'));
    }

    return true;
  }

  clean() {
    if (this.state === STATES.SLEEPING) return false;
    const gain = 30 + Math.random() * 15;
    this.cleanliness = Math.min(100, this.cleanliness + gain);
    this.stateTimer = 0;
    this.stateDuration = 1500;

    this.scene.tweens.add({
      targets: this.sprite,
      angle: { from: -10, to: 10 },
      duration: 150,
      yoyo: true,
      repeat: 3,
    });

    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 120, () => this.emitParticle('star'));
    }

    return true;
  }

  entertain() {
    if (this.state === STATES.SLEEPING) return false;
    const gain = 30 + Math.random() * 15;
    this.boredom = Math.min(100, this.boredom + gain);
    this.setState(STATES.PLAYING);
    this.stateDuration = 3000;
    this.stateTimer = 0;

    this.scene.tweens.add({
      targets: this,
      y: this.y - 20,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: 'Bounce'
    });

    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => this.emitParticle('star'));
    }
    for (let i = 0; i < 2; i++) {
      this.scene.time.delayedCall(i * 300, () => this.emitParticle('heart'));
    }

    return true;
  }

  // Wake up a sleeping cat
  wakeUp() {
    if (this.state !== STATES.SLEEPING) return false;
    this.setState(STATES.IDLE);
    this.stateTimer = 0;
    this.stateDuration = 1000;

    // Annoyed animation
    this.scene.tweens.add({
      targets: this.sprite,
      angle: { from: -15, to: 15 },
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    const text = this.scene.add.text(this.x, this.y - 50, '😾 "I was SLEEPING!"', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 2000,
      onComplete: () => text.destroy(),
    });

    // Small penalty for waking up
    this.boredom = Math.max(0, this.boredom - 5);

    return true;
  }

  // Pulsing urgency ring for cats that need attention
  updateUrgencyRing(time) {
    if (!this.urgencyRing) {
      this.urgencyRing = this.scene.add.graphics();
      this.add(this.urgencyRing);
      // Move behind sprite
      this.sendToBack(this.urgencyRing);
    }

    this.urgencyRing.clear();
    const minNeed = Math.min(this.hunger, this.cleanliness, this.boredom);

    if (this.state === 'sleeping' || minNeed > 35) {
      return; // No ring needed
    }

    // Determine color based on most urgent need
    let ringColor = 0xf39c12; // orange warning
    if (minNeed < 15) ringColor = 0xe74c3c; // red critical
    else if (minNeed < 25) ringColor = 0xff6b6b; // pink urgent

    // Pulsing alpha based on urgency
    const pulseSpeed = minNeed < 15 ? 100 : minNeed < 25 ? 200 : 400;
    const alpha = 0.2 + Math.abs(Math.sin(time / pulseSpeed)) * 0.4;
    const radius = 38 + Math.sin(time / 300) * 3;

    this.urgencyRing.lineStyle(2, ringColor, alpha);
    this.urgencyRing.strokeCircle(0, 0, radius);

    // Inner ring for critical
    if (minNeed < 15) {
      this.urgencyRing.lineStyle(1.5, 0xff0000, alpha * 0.7);
      this.urgencyRing.strokeCircle(0, 0, radius + 4);
    }
  }

  // Show detailed tooltip on hover
  showDetailedTooltip() {
    if (this.detailedTooltip) return;

    const padding = 8;
    const w = 130;
    const h = 95;

    // Position tooltip above cat, flipping if too close to top
    const tooltipY = this.y > 200 ? -100 : 50;
    const tooltipX = this.x > 650 ? -w : (this.x < 150 ? 0 : -w / 2);

    this.detailedTooltip = this.scene.add.container(this.x + tooltipX + w / 2, this.y + tooltipY);
    this.detailedTooltip.setDepth(30);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.92);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(1.5, 0xe94560, 0.7);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.detailedTooltip.add(bg);

    // Cat name + personality
    const nameText = this.scene.add.text(0, -h / 2 + 10, `${this.catName}`, {
      fontSize: '11px', fontFamily: 'Arial', color: '#f1c40f', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.detailedTooltip.add(nameText);

    const persText = this.scene.add.text(0, -h / 2 + 24, `(${this.personality})`, {
      fontSize: '8px', fontFamily: 'Arial', color: '#95a5a6', fontStyle: 'italic',
    }).setOrigin(0.5, 0);
    this.detailedTooltip.add(persText);

    // Need bars with labels and values
    const needs = [
      { label: '🍖 Hunger', value: this.hunger, color: '#e74c3c' },
      { label: '🧹 Clean', value: this.cleanliness, color: '#3498db' },
      { label: '🎾 Fun', value: this.boredom, color: '#f39c12' },
    ];

    needs.forEach((need, i) => {
      const y = -h / 2 + 38 + i * 18;

      const lbl = this.scene.add.text(-w / 2 + 8, y, need.label, {
        fontSize: '8px', fontFamily: 'Arial', color: '#bdc3c7',
      }).setOrigin(0, 0);
      this.detailedTooltip.add(lbl);

      // Bar background
      const barBg = this.scene.add.rectangle(20, y + 5, 50, 6, 0x333333).setOrigin(0, 0.5);
      this.detailedTooltip.add(barBg);

      // Bar fill
      const barWidth = Math.max(0, (need.value / 100) * 50);
      const fillColor = need.value < 20 ? 0xff0000 : Phaser.Display.Color.HexStringToColor(need.color).color;
      const barFill = this.scene.add.rectangle(20, y + 5, barWidth, 6, fillColor).setOrigin(0, 0.5);
      this.detailedTooltip.add(barFill);

      // Value text
      const valText = this.scene.add.text(w / 2 - 8, y, `${Math.round(need.value)}%`, {
        fontSize: '8px', fontFamily: 'Arial',
        color: need.value < 20 ? '#ff0000' : '#ecf0f1',
        fontStyle: need.value < 20 ? 'bold' : 'normal',
      }).setOrigin(1, 0);
      this.detailedTooltip.add(valText);
    });

    // Animate in
    this.detailedTooltip.setScale(0);
    this.scene.tweens.add({
      targets: this.detailedTooltip,
      scaleX: 1, scaleY: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  hideDetailedTooltip() {
    if (!this.detailedTooltip) return;
    const tooltip = this.detailedTooltip;
    this.detailedTooltip = null;
    this.scene.tweens.add({
      targets: tooltip,
      alpha: 0, scaleX: 0.8, scaleY: 0.8,
      duration: 100,
      onComplete: () => tooltip.destroy(),
    });
  }

  getCrazyLevel() {
    return 100 - ((this.hunger + this.cleanliness + this.boredom) / 3);
  }

  isCritical() {
    return Math.min(this.hunger, this.cleanliness, this.boredom) < 10;
  }
}
