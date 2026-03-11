/**
 * Generates all placeholder sprites as canvas textures
 * so we don't need external sprite files
 */
export function generateSprites(scene) {
  // Skip if already generated
  if (scene.textures.exists('cat_black')) return;

  generateCatSprite(scene, 'cat_black', '#2a2a2a', '#1a1a1a', '#00ff66', 'whiskey');
  generateCatSprite(scene, 'cat_orange', '#e8832a', '#c46b1a', '#ffcc00', 'nacho');
  generateCatSprite(scene, 'cat_gray', '#888888', '#666666', '#66ccff', 'shadow');
  generateCatSprite(scene, 'cat_white', '#f0f0f0', '#cccccc', '#ff69b4', 'princess');
  generateCatSprite(scene, 'cat_calico', '#e8a050', '#885533', '#44cc44', 'patches');

  generateFoodBowl(scene);
  generateLitterBox(scene);
  generateToyMouse(scene);
  generateYarnBall(scene);
  generatePosters(scene);
  generateFurniture(scene);
  generateParticles(scene);
  generatePowerUps(scene);
}

function generateCatSprite(scene, key, bodyColor, stripeColor, eyeColor, name) {
  const w = 64, h = 64;
  const canvas = scene.textures.createCanvas(key, w, h);
  const ctx = canvas.context;

  ctx.clearRect(0, 0, w, h);

  // Body (oval)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(32, 38, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Stripes for orange/calico cats
  if (key === 'cat_orange' || key === 'cat_calico') {
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 2;
    for (let i = -8; i <= 8; i += 6) {
      ctx.beginPath();
      ctx.moveTo(32 + i - 2, 28);
      ctx.lineTo(32 + i + 2, 48);
      ctx.stroke();
    }
  }

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(32, 22, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Ears
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(22, 14);
  ctx.lineTo(18, 2);
  ctx.lineTo(28, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(42, 14);
  ctx.lineTo(46, 2);
  ctx.lineTo(36, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner ears
  ctx.fillStyle = '#ff9999';
  ctx.beginPath();
  ctx.moveTo(22, 12);
  ctx.lineTo(20, 5);
  ctx.lineTo(27, 11);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(42, 12);
  ctx.lineTo(44, 5);
  ctx.lineTo(37, 11);
  ctx.closePath();
  ctx.fill();

  // Notched ear for Whiskey
  if (name === 'whiskey') {
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(17, 4);
    ctx.lineTo(21, 2);
    ctx.lineTo(19, 7);
    ctx.closePath();
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.ellipse(27, 20, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(37, 20, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(27, 20, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(37, 20, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#ff6b81';
  ctx.beginPath();
  ctx.moveTo(32, 25);
  ctx.lineTo(30, 23);
  ctx.lineTo(34, 23);
  ctx.closePath();
  ctx.fill();

  // Mouth / smirk
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 26);
  ctx.quadraticCurveTo(32, 29, 34, 26);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  for (let side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(32 + side * 6, 24 + i * 2);
      ctx.lineTo(32 + side * 20, 22 + i * 3);
      ctx.stroke();
    }
  }

  // Tail
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(50, 38);
  ctx.quadraticCurveTo(58, 25, 52, 15);
  ctx.stroke();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 38);
  ctx.quadraticCurveTo(58, 25, 52, 15);
  ctx.stroke();

  // Legs
  ctx.fillStyle = bodyColor;
  for (let x of [24, 32, 40]) {
    ctx.fillRect(x - 3, 48, 6, 10);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 3, 48, 6, 10);
  }

  // Paws
  ctx.fillStyle = key === 'cat_white' ? '#eee' : '#ddd';
  for (let x of [24, 32, 40]) {
    ctx.beginPath();
    ctx.ellipse(x, 58, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Accessories
  if (name === 'whiskey') {
    // Skull collar
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(20, 30, 24, 4);
    ctx.fillStyle = '#fff';
    ctx.font = '6px Arial';
    ctx.fillText('☠', 30, 34);
  }
  if (name === 'nacho') {
    // Gold chain
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(32, 33, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Backwards cap
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(22, 8, 20, 4);
    ctx.fillRect(36, 5, 10, 6);
  }
  if (name === 'princess') {
    // Tiny bow
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.moveTo(42, 8);
    ctx.lineTo(48, 4);
    ctx.lineTo(46, 10);
    ctx.lineTo(42, 8);
    ctx.lineTo(38, 4);
    ctx.lineTo(40, 10);
    ctx.closePath();
    ctx.fill();
  }

  canvas.refresh();

  // Also generate a sleeping version
  const sleepCanvas = scene.textures.createCanvas(key + '_sleep', w, h);
  const sctx = sleepCanvas.context;
  // Draw rotated/curled up cat
  sctx.clearRect(0, 0, w, h);
  sctx.fillStyle = bodyColor;
  sctx.beginPath();
  sctx.ellipse(32, 36, 20, 16, 0, 0, Math.PI * 2);
  sctx.fill();
  sctx.strokeStyle = '#111';
  sctx.lineWidth = 2;
  sctx.stroke();
  // Tail wrapping around
  sctx.strokeStyle = bodyColor;
  sctx.lineWidth = 6;
  sctx.beginPath();
  sctx.arc(32, 36, 18, -0.5, 1.5);
  sctx.stroke();
  sctx.strokeStyle = '#111';
  sctx.lineWidth = 2;
  sctx.beginPath();
  sctx.arc(32, 36, 18, -0.5, 1.5);
  sctx.stroke();
  // Head tucked in
  sctx.fillStyle = bodyColor;
  sctx.beginPath();
  sctx.arc(22, 30, 10, 0, Math.PI * 2);
  sctx.fill();
  sctx.strokeStyle = '#111';
  sctx.lineWidth = 2;
  sctx.stroke();
  // Closed eyes (Zs)
  sctx.fillStyle = '#fff';
  sctx.font = 'bold 10px Arial';
  sctx.fillText('Z', 38, 20);
  sctx.font = 'bold 8px Arial';
  sctx.fillText('z', 44, 14);
  sctx.font = 'bold 6px Arial';
  sctx.fillText('z', 48, 10);

  if (key === 'cat_orange') {
    sctx.strokeStyle = stripeColor;
    sctx.lineWidth = 2;
    for (let i = -8; i <= 8; i += 6) {
      sctx.beginPath();
      sctx.moveTo(32 + i, 24);
      sctx.lineTo(32 + i, 48);
      sctx.stroke();
    }
  }

  sleepCanvas.refresh();
}

function generateFoodBowl(scene) {
  const canvas = scene.textures.createCanvas('food_bowl', 48, 32);
  const ctx = canvas.context;
  ctx.clearRect(0, 0, 48, 32);

  // Bowl
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.ellipse(24, 22, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Food
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.ellipse(24, 18, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kibble dots
  ctx.fillStyle = '#A0522D';
  for (let i = 0; i < 8; i++) {
    const x = 16 + Math.random() * 16;
    const y = 15 + Math.random() * 6;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 6px Arial';
  ctx.fillText('NOMS', 13, 26);

  canvas.refresh();
}

function generateLitterBox(scene) {
  const canvas = scene.textures.createCanvas('litter_box', 56, 40);
  const ctx = canvas.context;
  ctx.clearRect(0, 0, 56, 40);

  // Box
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(4, 12, 48, 24);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 12, 48, 24);

  // Sand/litter
  ctx.fillStyle = '#f5deb3';
  ctx.fillRect(8, 16, 40, 16);

  // Scoop
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(46, 8);
  ctx.lineTo(50, 16);
  ctx.stroke();
  ctx.fillStyle = '#999';
  ctx.beginPath();
  ctx.ellipse(46, 6, 5, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Stink lines
  ctx.strokeStyle = '#90EE90';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(20 + i * 8, 14);
    ctx.quadraticCurveTo(22 + i * 8, 8, 20 + i * 8, 2);
    ctx.stroke();
  }

  canvas.refresh();
}

function generateToyMouse(scene) {
  const canvas = scene.textures.createCanvas('toy_mouse', 32, 24);
  const ctx = canvas.context;
  ctx.clearRect(0, 0, 32, 24);

  // Body
  ctx.fillStyle = '#9b59b6';
  ctx.beginPath();
  ctx.ellipse(16, 14, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ear
  ctx.fillStyle = '#8e44ad';
  ctx.beginPath();
  ctx.arc(8, 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(9, 12, 2, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#9b59b6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 14);
  ctx.quadraticCurveTo(34, 8, 30, 4);
  ctx.stroke();

  canvas.refresh();
}

function generateYarnBall(scene) {
  const canvas = scene.textures.createCanvas('yarn_ball', 32, 32);
  const ctx = canvas.context;
  ctx.clearRect(0, 0, 32, 32);

  // Ball
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Yarn lines
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(16, 16, 4 + i * 2, i * 0.5, i * 0.5 + 3);
    ctx.stroke();
  }

  // Trailing yarn
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(26, 20);
  ctx.quadraticCurveTo(32, 26, 28, 30);
  ctx.stroke();

  canvas.refresh();
}

function generatePosters(scene) {
  const posters = [
    { key: 'poster_shred', text: 'I SHRED\nTHEREFORE\nI AM', color: '#2c3e50', accent: '#e74c3c' },
    { key: 'poster_nips', text: 'BEWARE\nOF THE\nNIPS', color: '#8e44ad', accent: '#f39c12' },
    { key: 'poster_laser', text: 'LASER\nPOINTERS\n= LIES', color: '#27ae60', accent: '#e74c3c' },
    { key: 'poster_chaos', text: 'CHAOS MGMT\n1.DONT DIE\n2.FEED EM', color: '#c0392b', accent: '#ecf0f1' },
    { key: 'poster_wine', text: 'WINE IS\nFOR THE\nCATLORD', color: '#722f37', accent: '#ffd700' },
    { key: 'poster_3am', text: '3 AM\nZOOMIES\nSCHEDULE', color: '#1a1a3e', accent: '#3498db' },
  ];

  posters.forEach(p => {
    const canvas = scene.textures.createCanvas(p.key, 80, 90);
    const ctx = canvas.context;
    ctx.clearRect(0, 0, 80, 90);

    // Background
    ctx.fillStyle = p.color;
    ctx.fillRect(2, 2, 76, 86);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 76, 86);

    // Border accent
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 68, 78);

    // Text
    ctx.fillStyle = p.accent;
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    const lines = p.text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 40, 30 + i * 18);
    });

    canvas.refresh();
  });
}

function generateFurniture(scene) {
  // Couch
  const couchCanvas = scene.textures.createCanvas('couch', 160, 80);
  const cctx = couchCanvas.context;
  cctx.clearRect(0, 0, 160, 80);
  cctx.fillStyle = '#3498db';
  cctx.fillRect(10, 20, 140, 50);
  cctx.fillStyle = '#2980b9';
  cctx.fillRect(10, 10, 140, 20);
  // Armrests
  cctx.fillStyle = '#2c3e50';
  cctx.fillRect(2, 15, 16, 55);
  cctx.fillRect(142, 15, 16, 55);
  // Claw marks
  cctx.strokeStyle = '#1a5276';
  cctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    cctx.beginPath();
    cctx.moveTo(40 + i * 25, 30);
    cctx.lineTo(42 + i * 25, 55);
    cctx.stroke();
    cctx.beginPath();
    cctx.moveTo(44 + i * 25, 30);
    cctx.lineTo(46 + i * 25, 55);
    cctx.stroke();
  }
  cctx.strokeStyle = '#111';
  cctx.lineWidth = 2;
  cctx.strokeRect(10, 10, 140, 60);
  couchCanvas.refresh();

  // Scratching post
  const postCanvas = scene.textures.createCanvas('scratch_post', 40, 100);
  const pctx = postCanvas.context;
  pctx.clearRect(0, 0, 40, 100);
  // Base
  pctx.fillStyle = '#8B4513';
  pctx.fillRect(5, 85, 30, 12);
  // Post
  pctx.fillStyle = '#DEB887';
  pctx.fillRect(14, 20, 12, 68);
  // Rope wrapping
  pctx.strokeStyle = '#D2B48C';
  pctx.lineWidth = 3;
  for (let y = 25; y < 85; y += 6) {
    pctx.beginPath();
    pctx.moveTo(14, y);
    pctx.lineTo(26, y + 3);
    pctx.stroke();
  }
  // Platform on top
  pctx.fillStyle = '#cd853f';
  pctx.fillRect(2, 14, 36, 10);
  pctx.strokeStyle = '#111';
  pctx.lineWidth = 1.5;
  pctx.strokeRect(2, 14, 36, 10);
  postCanvas.refresh();

  // Cardboard box
  const boxCanvas = scene.textures.createCanvas('cardboard_box', 60, 50);
  const bctx = boxCanvas.context;
  bctx.clearRect(0, 0, 60, 50);
  bctx.fillStyle = '#c69c6d';
  bctx.fillRect(4, 10, 52, 36);
  // Flaps
  bctx.fillStyle = '#b8860b';
  bctx.beginPath();
  bctx.moveTo(4, 10);
  bctx.lineTo(16, 2);
  bctx.lineTo(30, 10);
  bctx.closePath();
  bctx.fill();
  bctx.beginPath();
  bctx.moveTo(30, 10);
  bctx.lineTo(44, 2);
  bctx.lineTo(56, 10);
  bctx.closePath();
  bctx.fill();
  bctx.strokeStyle = '#111';
  bctx.lineWidth = 1.5;
  bctx.strokeRect(4, 10, 52, 36);
  // KEEP OUT text
  bctx.fillStyle = '#c0392b';
  bctx.font = 'bold 8px Arial';
  bctx.textAlign = 'center';
  bctx.fillText('KEEP OUT', 30, 32);
  boxCanvas.refresh();

  // Window
  const winCanvas = scene.textures.createCanvas('window', 100, 80);
  const wctx = winCanvas.context;
  wctx.clearRect(0, 0, 100, 80);
  // Frame
  wctx.fillStyle = '#8B7355';
  wctx.fillRect(0, 0, 100, 80);
  // Sky
  wctx.fillStyle = '#1a1a3e';
  wctx.fillRect(5, 5, 42, 70);
  wctx.fillRect(53, 5, 42, 70);
  // City skyline
  wctx.fillStyle = '#2c3e50';
  const buildings = [10, 30, 20, 40, 15, 35, 25];
  buildings.forEach((h, i) => {
    wctx.fillRect(7 + i * 6, 75 - h, 5, h);
    // Windows on buildings
    wctx.fillStyle = '#f1c40f';
    for (let y = 75 - h + 3; y < 72; y += 6) {
      wctx.fillRect(8 + i * 6, y, 2, 2);
    }
    wctx.fillStyle = '#2c3e50';
  });
  // Right pane buildings
  buildings.forEach((h, i) => {
    wctx.fillStyle = '#2c3e50';
    wctx.fillRect(55 + i * 6, 75 - h, 5, h);
    wctx.fillStyle = '#f1c40f';
    for (let y = 75 - h + 3; y < 72; y += 6) {
      wctx.fillRect(56 + i * 6, y, 2, 2);
    }
  });
  // Moon
  wctx.fillStyle = '#ecf0f1';
  wctx.beginPath();
  wctx.arc(75, 20, 8, 0, Math.PI * 2);
  wctx.fill();
  // Cross bar
  wctx.fillStyle = '#8B7355';
  wctx.fillRect(47, 0, 6, 80);
  wctx.fillRect(0, 37, 100, 6);
  wctx.strokeStyle = '#111';
  wctx.lineWidth = 2;
  wctx.strokeRect(0, 0, 100, 80);
  winCanvas.refresh();

  // Bookshelf
  const shelfCanvas = scene.textures.createCanvas('bookshelf', 70, 100);
  const sctx = shelfCanvas.context;
  sctx.clearRect(0, 0, 70, 100);
  sctx.fillStyle = '#8B4513';
  sctx.fillRect(2, 2, 66, 96);
  sctx.strokeStyle = '#111';
  sctx.lineWidth = 2;
  sctx.strokeRect(2, 2, 66, 96);
  // Shelves
  for (let y of [30, 60]) {
    sctx.fillStyle = '#A0522D';
    sctx.fillRect(4, y, 62, 4);
  }
  // Books
  const bookColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  for (let shelf = 0; shelf < 3; shelf++) {
    let x = 8;
    const baseY = shelf === 0 ? 8 : shelf === 1 ? 36 : 66;
    for (let b = 0; b < 5; b++) {
      const bw = 6 + Math.random() * 4;
      const bh = 18 + Math.random() * 4;
      sctx.fillStyle = bookColors[Math.floor(Math.random() * bookColors.length)];
      sctx.fillRect(x, baseY + (22 - bh), bw, bh);
      sctx.strokeStyle = '#111';
      sctx.lineWidth = 0.5;
      sctx.strokeRect(x, baseY + (22 - bh), bw, bh);
      x += bw + 2;
    }
    // Knocked over book on last shelf
    if (shelf === 2) {
      sctx.save();
      sctx.translate(50, 85);
      sctx.rotate(0.8);
      sctx.fillStyle = '#e67e22';
      sctx.fillRect(-3, -10, 8, 18);
      sctx.restore();
    }
  }
  shelfCanvas.refresh();

  // Wine bottle (Kitten Cabernet)
  const wineCanvas = scene.textures.createCanvas('wine_bottle', 20, 48);
  const wctx2 = wineCanvas.context;
  wctx2.clearRect(0, 0, 20, 48);
  // Bottle body
  wctx2.fillStyle = '#722f37';
  wctx2.fillRect(5, 16, 10, 28);
  // Neck
  wctx2.fillStyle = '#722f37';
  wctx2.fillRect(7, 4, 6, 14);
  // Cap
  wctx2.fillStyle = '#ffd700';
  wctx2.fillRect(7, 2, 6, 4);
  // Label
  wctx2.fillStyle = '#f5deb3';
  wctx2.fillRect(6, 24, 8, 12);
  wctx2.fillStyle = '#722f37';
  wctx2.font = '4px Arial';
  wctx2.textAlign = 'center';
  wctx2.fillText('KITN', 10, 30);
  wctx2.fillText('CABR', 10, 35);
  wctx2.strokeStyle = '#111';
  wctx2.lineWidth = 1;
  wctx2.strokeRect(5, 4, 10, 40);
  wineCanvas.refresh();

  // Cat door
  const doorCanvas = scene.textures.createCanvas('cat_door', 40, 50);
  const dctx = doorCanvas.context;
  dctx.clearRect(0, 0, 40, 50);
  dctx.fillStyle = '#8B7355';
  dctx.fillRect(0, 0, 40, 50);
  // Door hole
  dctx.fillStyle = '#1a1a2e';
  dctx.beginPath();
  dctx.arc(20, 30, 14, 0, Math.PI * 2);
  dctx.fill();
  // Flap
  dctx.fillStyle = '#666';
  dctx.beginPath();
  dctx.arc(20, 30, 12, -0.5, Math.PI + 0.5);
  dctx.fill();
  dctx.strokeStyle = '#111';
  dctx.lineWidth = 2;
  dctx.strokeRect(0, 0, 40, 50);
  doorCanvas.refresh();
}

function generateParticles(scene) {
  // Heart particle
  const heartCanvas = scene.textures.createCanvas('heart', 16, 16);
  const hctx = heartCanvas.context;
  hctx.clearRect(0, 0, 16, 16);
  hctx.fillStyle = '#e74c3c';
  hctx.font = '14px Arial';
  hctx.fillText('❤', 1, 13);
  heartCanvas.refresh();

  // Stink particle
  const stinkCanvas = scene.textures.createCanvas('stink', 16, 16);
  const sctx = stinkCanvas.context;
  sctx.clearRect(0, 0, 16, 16);
  sctx.fillStyle = '#90EE90';
  sctx.font = '12px Arial';
  sctx.fillText('~', 3, 12);
  stinkCanvas.refresh();

  // Star particle
  const starCanvas = scene.textures.createCanvas('star', 16, 16);
  const stctx = starCanvas.context;
  stctx.clearRect(0, 0, 16, 16);
  stctx.fillStyle = '#f1c40f';
  stctx.font = '14px Arial';
  stctx.fillText('★', 1, 13);
  starCanvas.refresh();

  // Angry symbol
  const angryCanvas = scene.textures.createCanvas('angry_symbol', 16, 16);
  const actx = angryCanvas.context;
  actx.clearRect(0, 0, 16, 16);
  actx.fillStyle = '#e74c3c';
  actx.font = 'bold 12px Arial';
  actx.fillText('💢', 0, 13);
  angryCanvas.refresh();

  // Poop
  const poopCanvas = scene.textures.createCanvas('poop', 16, 16);
  const pctx = poopCanvas.context;
  pctx.clearRect(0, 0, 16, 16);
  pctx.fillStyle = '#8B4513';
  pctx.font = '12px Arial';
  pctx.fillText('💩', 0, 13);
  poopCanvas.refresh();

  // Kibble
  const kibbleCanvas = scene.textures.createCanvas('kibble', 8, 8);
  const kctx = kibbleCanvas.context;
  kctx.fillStyle = '#8B4513';
  kctx.beginPath();
  kctx.ellipse(4, 4, 3, 2, 0, 0, Math.PI * 2);
  kctx.fill();
  kctx.strokeStyle = '#5D3A1A';
  kctx.lineWidth = 1;
  kctx.stroke();
  kibbleCanvas.refresh();
}

function generatePowerUps(scene) {
  // Catnip Bomb - green sparkly circle
  const catnipCanvas = scene.textures.createCanvas('powerup_catnip', 40, 40);
  const cnctx = catnipCanvas.context;
  cnctx.clearRect(0, 0, 40, 40);
  // Glow
  const grd1 = cnctx.createRadialGradient(20, 20, 4, 20, 20, 18);
  grd1.addColorStop(0, '#2ecc71');
  grd1.addColorStop(1, '#27ae6033');
  cnctx.fillStyle = grd1;
  cnctx.beginPath();
  cnctx.arc(20, 20, 18, 0, Math.PI * 2);
  cnctx.fill();
  // Inner circle
  cnctx.fillStyle = '#2ecc71';
  cnctx.beginPath();
  cnctx.arc(20, 20, 12, 0, Math.PI * 2);
  cnctx.fill();
  cnctx.strokeStyle = '#1a9c5a';
  cnctx.lineWidth = 2;
  cnctx.stroke();
  // Leaf icon
  cnctx.fillStyle = '#ffffff';
  cnctx.font = '16px Arial';
  cnctx.textAlign = 'center';
  cnctx.fillText('🌿', 20, 26);
  catnipCanvas.refresh();

  // Mega Kibble - orange/red power food
  const kibblePUCanvas = scene.textures.createCanvas('powerup_kibble', 40, 40);
  const kpctx = kibblePUCanvas.context;
  kpctx.clearRect(0, 0, 40, 40);
  // Glow
  const grd2 = kpctx.createRadialGradient(20, 20, 4, 20, 20, 18);
  grd2.addColorStop(0, '#e74c3c');
  grd2.addColorStop(1, '#e74c3c33');
  kpctx.fillStyle = grd2;
  kpctx.beginPath();
  kpctx.arc(20, 20, 18, 0, Math.PI * 2);
  kpctx.fill();
  // Inner circle
  kpctx.fillStyle = '#e74c3c';
  kpctx.beginPath();
  kpctx.arc(20, 20, 12, 0, Math.PI * 2);
  kpctx.fill();
  kpctx.strokeStyle = '#c0392b';
  kpctx.lineWidth = 2;
  kpctx.stroke();
  // Food icon
  kpctx.fillStyle = '#ffffff';
  kpctx.font = '16px Arial';
  kpctx.textAlign = 'center';
  kpctx.fillText('🍖', 20, 26);
  kibblePUCanvas.refresh();

  // Sparkle Bath - blue sparkly
  const bathCanvas = scene.textures.createCanvas('powerup_bath', 40, 40);
  const bpctx = bathCanvas.context;
  bpctx.clearRect(0, 0, 40, 40);
  // Glow
  const grd3 = bpctx.createRadialGradient(20, 20, 4, 20, 20, 18);
  grd3.addColorStop(0, '#3498db');
  grd3.addColorStop(1, '#3498db33');
  bpctx.fillStyle = grd3;
  bpctx.beginPath();
  bpctx.arc(20, 20, 18, 0, Math.PI * 2);
  bpctx.fill();
  // Inner circle
  bpctx.fillStyle = '#3498db';
  bpctx.beginPath();
  bpctx.arc(20, 20, 12, 0, Math.PI * 2);
  bpctx.fill();
  bpctx.strokeStyle = '#2980b9';
  bpctx.lineWidth = 2;
  bpctx.stroke();
  // Sparkle icon
  bpctx.fillStyle = '#ffffff';
  bpctx.font = '16px Arial';
  bpctx.textAlign = 'center';
  bpctx.fillText('✨', 20, 26);
  bathCanvas.refresh();
}
