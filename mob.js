var mobImages = new Map();

function getMobImage(src) {
  var path = 'image/' + src;
  if (!mobImages.has(path)) {
    var entry = { img: new Image(), loaded: false };
    entry.img.onload = function() { entry.loaded = true; };
    entry.img.src = path;
    mobImages.set(path, entry);
  }
  return mobImages.get(path);
}

class Mob {
  constructor(key, x, y, wait, imgSrc, name) {
    this.key = key;
    this.x = x; this.y = y; this.tx = x; this.ty = y;
    this.vx = 0; this.vy = 0; this.r = 0.42;
    this.wait = wait || 40; this.f = Math.random() * 10; this.mv = false;
    this.facingBack = false; this.facingRight = false;
    this.sprite = getMobImage(imgSrc || 'player.png');
    this.name = name || 'ポリン';
    this.msg = '';
    this.mTime = 0;
    this.emoData = null;
    this.eTime = 0;
    this.modalTitle = null;
    this.modalHtml = null;
  }

  setModalContent(title, htmlContent) {
    this.modalTitle = title;
    this.modalHtml = htmlContent;
    return this;
  }

  say(text, duration) {
    var range = (typeof gameMap !== 'undefined' && gameMap.sayRange !== undefined) ? gameMap.sayRange : 5;
    var dist = (typeof p !== 'undefined') ? Math.hypot(this.x - p.x, this.y - p.y) : 0;

    // 範囲が0より大きく、プレイヤーとの距離が範囲を超えている場合
    if (range > 0 && dist > range) {
      this.msg = '……';
      this.mTime = duration || 240;
      return; // ログには残さず終了
    }

    this.msg = this.name + ' : ' + text;
    this.mTime = duration || 240;
    if (typeof addChatLog === 'function') {
      addChatLog(this.msg, 'npc');
    }
  }

  emotion(emoKey) {
    var e = EMO.get(String(emoKey));
    if (e) {
      this.emoData = e;
      this.eTime = 160;
    }
  }

  updateDirection(dx, dy) {
    if (Math.hypot(dx, dy) < 0.005) return;
    var sdx = dx * Math.cos(cam.ang) - dy * Math.sin(cam.ang);
    var sdy = dx * Math.sin(cam.ang) + dy * Math.cos(cam.ang);
    this.facingBack = sdy < 0;
    if (Math.abs(sdx) > 0.002) this.facingRight = sdx > 0;
  }

  update() {
    this.f++;
    if (this.mTime > 0) this.mTime--;
    if (this.eTime > 0) this.eTime--;

    var prevX = this.x, prevY = this.y;
    var dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
    if (d > 0.05) {
      var dirX = dx / d, dirY = dy / d;
      var moveX = dirX, moveY = dirY;

      if (this.stuckTimer > 0) {
        this.stuckTimer--;
        var side = this.avoidSign || 1;
        moveX = dirX * 0.35 + (-dirY * side) * 0.93;
        moveY = dirY * 0.35 + (dirX * side) * 0.93;
        var mLen = Math.hypot(moveX, moveY);
        moveX /= mLen; moveY /= mLen;
      }

      this.x += moveX * 0.035;
      this.y += moveY * 0.035;
      this.mv = true;
      this.updateDirection(moveX, moveY);
    } else {
      this.mv = false;
      this.stuckTimer = 0;
      if (--this.wait <= 0) {
        this.tx = Math.max(1, Math.min(gameMap.width - 1, this.x + (Math.random() - 0.5) * 6));
        this.ty = Math.max(1, Math.min(gameMap.height - 1, this.y + (Math.random() - 0.5) * 6));
        this.wait = 60 + Math.random() * 120;
      }
    }
    this.x += this.vx; this.y += this.vy;
    gameMap.clampEntity(this);
    this.vx *= 0.85; this.vy *= 0.85;

    // 移動中なのに前のフレームからほとんど動けていない場合は迂回方向をセット
    if (this.mv && this.lastStepX !== undefined) {
      if (Math.hypot(this.x - this.lastStepX, this.y - this.lastStepY) < 0.01) {
        this.stuckCount = (this.stuckCount || 0) + 1;
        if (this.stuckCount >= 6) {
          if (!this.stuckTimer || this.stuckTimer <= 0) {
            this.avoidSign = (typeof chooseAvoidSide === 'function')
              ? chooseAvoidSide(this, (this.tx - this.x) / (d || 1), (this.ty - this.y) / (d || 1))
              : 1;
          }
          this.stuckTimer = 35;
          this.stuckCount = 0;
        }
      } else {
        this.stuckCount = 0;
      }
    }
    this.lastStepX = prevX;
    this.lastStepY = prevY;
  }
  draw(s, sc) {
    if (!isPhotoMode && p.followMob === this) {
      ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 18 * sc, 18 * sc * cam.pitch, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
    }
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 14 * sc, 14 * sc * cam.pitch, 0, 0, 7); ctx.fill();

    if (!this.sprite.loaded) {
      ctx.fillStyle = '#ff77aa'; ctx.beginPath(); ctx.ellipse(s.x, s.y - 11 * sc, 15 * sc, 12 * sc, 0, 0, 7); ctx.fill();
    } else {
      var col = 1;
      if (this.mv) {
        var step = Math.floor(this.f / 8) % 4;
        col = (step === 0) ? 0 : (step === 2 ? 2 : 1);
      }
      var row = (!this.facingBack && this.facingRight) ? 0 :
                (this.facingBack && !this.facingRight) ? 1 :
                (!this.facingBack && !this.facingRight) ? 2 : 3;
      var cellW = this.sprite.img.width / 3, cellH = this.sprite.img.height / 4;
      var drawW = 52 * sc, drawH = drawW * (cellH / cellW);
      ctx.drawImage(this.sprite.img, col * cellW, row * cellH, cellW, cellH, s.x - drawW / 2, s.y + 4 * sc - drawH, drawW, drawH);
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (!isPhotoMode) {
      ctx.font = 'bold 11px sans-serif';
      var nameY = s.y - 56 * sc;
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.strokeText(this.name, s.x, nameY);
      ctx.fillStyle = (p.followMob === this) ? '#80f0ff' : '#ffd1e3'; ctx.fillText(this.name, s.x, nameY);
    }

    if (this.mTime > 0) {
      ctx.font = 'bold 12px sans-serif';
      var w = ctx.measureText(this.msg).width + 14;
      var msgY = s.y - (isPhotoMode ? 60 : 78) * sc;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(s.x - w / 2, msgY - 11, w, 22);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.msg, s.x, msgY);
    }
    ctx.restore();

    if (this.eTime > 0) {
      var emoY = s.y - (isPhotoMode ? 64 : 82) * sc - (this.mTime > 0 ? 30 : 0);
      drawEmotionBubble(s.x, emoY, this.emoData, this.eTime);
    }
  }
}

function bounce(a, b, pw, withSound) {
  var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), md = a.r + b.r;
  if (d > 0 && d < md) {
    var nx = dx / d, ny = dy / d, ov = (md - d) * 0.5;
    a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
    a.vx -= nx * pw; a.vy -= ny * pw; b.vx += nx * pw; b.vy += ny * pw;
    a.tx = a.x; a.ty = a.y; b.tx = b.x; b.ty = b.y;
    if (withSound) playPoyonSound();
  }
}

var mobs = {
  items: new Map(),

  add: function(key, x, y, wait, imgSrc, name) {
    var obj = new Mob(key, x, y, wait, imgSrc, name);
    this.items.set(key, obj);
    return obj;
  },

  say: function(key, text, duration) {
    var target = this.items.get(key);
    if (target) target.say(text, duration);
  },

  emotion: function(key, emoKey) {
    var target = this.items.get(key);
    if (target) target.emotion(emoKey);
  },

  delete: function(key) {
    var target = this.items.get(key);
    if (target && p.followMob === target) p.followMob = null;
    return this.items.delete(key);
  },

  get: function(key) {
    return this.items.get(key);
  },

  clear: function() {
    p.followMob = null;
    this.items.clear();
  },

  updateAll: function() {
    var list = Array.from(this.items.values());
    list.forEach(function(m, i) {
      m.update();
      bounce(p, m, 0.14, true);
      for (var j = i + 1; j < list.length; j++) bounce(m, list.at(j), 0.1, false);
    });
  },

  collectRenderItems: function(list) {
    this.items.forEach(function(m) {
      list.push({ t: 'm', o: m, s: toS(m.x, m.y) });
    });
  }
};