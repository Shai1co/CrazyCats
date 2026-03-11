import Phaser from 'phaser';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.CANVAS,
  width: 1600,
  height: 1200,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  roundPixels: true,
  antialias: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true,
  },
  scene: [TitleScene, GameScene],
};

// Patch Phaser text factory to render at higher resolution
// Scale.FIT stretches 800×600 canvas to window, making text blurry.
// Force 3x resolution so text stays crisp when upscaled.
const _origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
  style = style || {};
  if (!style.resolution) {
    style.resolution = 3;
  }
  return _origText.call(this, x, y, text, style);
};

const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;
