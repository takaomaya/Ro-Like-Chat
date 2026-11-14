class Obstacle {
  constructor(key, x, y, w, d, texSrc) {
    this.key = key;
    this.x = x; this.y = y; this.w = w; this.d = d;
    this.tex = getObstacleTexture(texSrc || 'red.png');
  }

  hit(ent) {
    var hw = this.w / 2, hd = this.d / 2;
    var cx = Math.max(this.x - hw, Math.min(ent.x, this.x + hw));
    var cy = Math.max(this.y - hd, Math.min(ent.y, this.y + hd));
    var dx = ent.x - cx, dy = ent.y - cy, dist = Math.hypot(dx, dy);
    if (dist < ent.r) {
      var ov = ent.r - dist;
      ent.x += (dist > 0 ? dx / dist : 1) * ov;
      ent.y += (dist > 0 ? dy / dist : 0) * ov;
      ent.tx = ent.x; ent.ty = ent.y;
    }
  }

  collectRenderItems(list) {
    list.push({ type: 'obs', obj: this, s: toS(this.x, this.y) });
  }

  draw(sc) {
    var hw = this.w / 2, hd = this.d / 2, h = 45 * sc;
    var b0 = toS(this.x - hw, this.y - hd), b1 = toS(this.x + hw, this.y - hd);
    var b2 = toS(this.x + hw, this.y + hd), b3 = toS(this.x - hw, this.y + hd);
    var t0 = { x: b0.x, y: b0.y - h }, t1 = { x: b1.x, y: b1.y - h };
    var t2 = { x: b2.x, y: b2.y - h }, t3 = { x: b3.x, y: b3.y - h };

    var sides = [
      { a: b0, b: b1, c: t1, d: t0, shade: 0.15, steps: this.w },
      { a: b1, b: b2, c: t2, d: t1, shade: 0.30, steps: this.d },
      { a: b2, b: b3, c: t3, d: t2, shade: 0.15, steps: this.w },
      { a: b3, b: b0, c: t0, d: t3, shade: 0.30, steps: this.d }
    ];

    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
    sides.forEach(function(s) {
      if (s.b.x - s.a.x < 0) {
        var count = Math.max(1, Math.round(s.steps));
        for (var i = 0; i < count; i++) {
          var r0 = i / count, r1 = (i + 1) / count;
          drawTexturedQuad(this.tex, lerpPt(s.d, s.c, r0), lerpPt(s.d, s.c, r1), lerpPt(s.a, s.b, r1), lerpPt(s.a, s.b, r0), s.shade);
        }
        ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.lineTo(s.c.x, s.c.y); ctx.lineTo(s.d.x, s.d.y); ctx.closePath(); ctx.stroke();
      }
    }, this);

    var cols = Math.max(1, Math.round(this.w)), rows = Math.max(1, Math.round(this.d));
    for (var ix = 0; ix < cols; ix++) {
      var u0 = ix / cols, u1 = (ix + 1) / cols;
      var topL = lerpPt(t0, t1, u0), topR = lerpPt(t0, t1, u1), botL = lerpPt(t3, t2, u0), botR = lerpPt(t3, t2, u1);
      for (var iy = 0; iy < rows; iy++) {
        var v0 = iy / rows, v1 = (iy + 1) / rows;
        drawTexturedQuad(this.tex, lerpPt(topL, botL, v0), lerpPt(topR, botR, v0), lerpPt(topR, botR, v1), lerpPt(topL, botL, v1), 0);
      }
    }
    ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.closePath(); ctx.stroke();
  }
}

var obstacles = {
  items: new Map(),

  add: function(key, x, y, w, d, texSrc) {
    var obj = new Obstacle(key, x, y, w, d, texSrc);
    this.items.set(key, obj);
    return obj;
  },

  addLongWall: function(key, x, y, topSrc, frontSrc, boardSrc, signSrc, dir) {
    var obj = new LongWall(key, x, y, topSrc, frontSrc, boardSrc, signSrc, dir);
    this.items.set(key, obj);
    return obj;
  },

  delete: function(key) {
    return this.items.delete(key);
  },

  get: function(key) {
    return this.items.get(key);
  },

  clear: function() {
    this.items.clear();
  },

  hitAll: function() {
    this.items.forEach(function(o) {
      o.hit(p);
      mobs.items.forEach(function(m) { o.hit(m); });
    });
  },

  collectRenderItems: function(list) {
    this.items.forEach(function(o) {
      o.collectRenderItems(list);
    });
  }
};