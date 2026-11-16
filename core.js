var c = document.getElementById('c');
var ctx = c.getContext('2d');
function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

var isPhotoMode = false;

var emoSprite = { img: new Image(), loaded: false };
emoSprite.img.onload = function() { emoSprite.loaded = true; };
emoSprite.img.src = 'image/emotion.png';

var EMO = new Map([
  ['1', { col: 0, text: '!', colHex: '#e00', cmd: '/!' }],
  ['2', { col: 1, text: '?', colHex: '#06c', cmd: '/?' }],
  ['3', { col: 2, text: '♥', colHex: '#f36', cmd: '/lv' }],
  ['4', { col: 3, text: ';;', colHex: '#09f', cmd: '/swt' }],
  ['5', { col: 4, text: '^▽^', colHex: '#f80', cmd: '/heh' }],
  ['6', { col: 5, text: '怒', colHex: '#c00', cmd: '/ag' }],
  ['7', { col: 6, text: '！', colHex: '#eb0', cmd: '/ic' }],
  ['8', { col: 7, text: 'Zzz', colHex: '#558', cmd: '/zz' }],
  ['9', { col: 8, text: '♪', colHex: '#2a4', cmd: '/ho' }]
]);

function drawEmotionBubble(x, y, emoData, timer) {
  if (!emoData || timer <= 0) return;

  var t = 160 - timer;
  var fx = x + Math.sin(t * 0.08) * 6;
  var fy = y + Math.cos(t * 0.12) * 4;

  ctx.save();
  ctx.globalAlpha = timer < 25 ? timer / 25 : 1;
  ctx.translate(fx, fy);

  if (emoSprite.loaded) {
    var cellW = emoSprite.img.width / 9;
    var cellH = emoSprite.img.height;
    var drawSize = 36;
    ctx.drawImage(emoSprite.img, emoData.col * cellW, 0, cellW, cellH, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  } else {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = emoData.colHex;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoData.text, 0, 1);
  }
  ctx.restore();
}

var cam = { size: 48, ang: Math.PI / 4, pitch: 0.55 };

class Player {
  constructor() {
    this.name = 'ノービス';
    this.imgSrc = 'player.png';
    this.x = 8; this.y = 8; this.tx = 8; this.ty = 8;
    this.vx = 0; this.vy = 0; this.r = 0.45; this.f = 0; this.mv = false;
    this.msg = ''; this.mTime = 0;
    this.isMsgPinned = false; // ＠付き発言の固定表示フラグ
    this.emoData = null; this.eTime = 0;
    this.followMob = null;
    this.isAdmin = false; // イベント管理者フラグ（true / false）
    this.isGM = false;    // GMフラグ（true / false）
  }

  setAdmin(flag) {
    this.isAdmin = !!flag;
    if (typeof updateAdminChatUI === 'function') {
      updateAdminChatUI();
    }
  }

  setGM(flag) {
    this.isGM = !!flag;
    if (typeof updateAdminChatUI === 'function') {
      updateAdminChatUI();
    }
  }

  setImage(src) {
    this.imgSrc = src || 'player.png';
    playerSprite.loaded = false;
    playerSprite.img = new Image();
    playerSprite.img.onload = function() { playerSprite.loaded = true; };
    playerSprite.img.src = 'image/' + this.imgSrc;
  }

  // pinned が true の場合は画面クリックまで消えない
  say(text, duration, pinned) {
    this.msg = this.name + ' : ' + text;
    this.mTime = duration || 300;
    this.isMsgPinned = !!pinned;
  }

  emotion(emoKey) {
    var e = EMO.get(String(emoKey));
    if (e) {
      this.emoData = e;
      this.eTime = 160;
    }
  }
}

var p = new Player();

function toS(wx, wy) {
  var dx = wx - p.x, dy = wy - p.y;
  return {
    x: c.width / 2 + (dx * Math.cos(cam.ang) - dy * Math.sin(cam.ang)) * cam.size,
    y: c.height / 2 + (dx * Math.sin(cam.ang) + dy * Math.cos(cam.ang)) * cam.size * cam.pitch
  };
}

function toW(sx, sy) {
  var rx = (sx - c.width / 2) / cam.size, ry = (sy - c.height / 2) / (cam.size * cam.pitch);
  return {
    x: p.x + rx * Math.cos(-cam.ang) - ry * Math.sin(-cam.ang),
    y: p.y + rx * Math.sin(-cam.ang) + ry * Math.cos(-cam.ang)
  };
}