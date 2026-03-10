import Phaser from 'phaser';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.CANVAS,
  width: 800,
  height: 600,
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

const game = new Phaser.Game(config);
window.__PHASER_GAME__ = game;
