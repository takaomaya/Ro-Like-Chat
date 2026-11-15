class LongWall {
  constructor(key, x, y, topSrc, frontSrc, boardSrc, signSrc, dir) {
    this.key = key;
    this.x = x; this.y = y;
    this.dir = (dir || 0) % 4;
    var isVertical = (this.dir === 1 || this.dir === 3);
    this.w = isVertical ? 1 : 3;
    this.d = isVertical ? 3 : 1;

    this.topTex = getObstacleTexture(topSrc || 'red.png');
    this.frontTex = getObstacleTexture(frontSrc || 'red.png');
    this.boardTex = getObstacleTexture(boardSrc || frontSrc || 'red.png');
    this.signTex = getObstacleTexture(signSrc || 'red.png');

    this.modalTitle = null;
    this.modalHtml = null;

    if (this.dir === 0) { this.bx1 = this.x - 1.5; this.by1 = this.y + 1.5; this.bx2 = this.x + 1.5; this.by2 = this.y + 1.5; }
    else if (this.dir === 1) { this.bx1 = this.x - 1.5; this.by1 = this.y - 1.5; this.bx2 = this.x - 1.5; this.by2 = this.y + 1.5; }
    else if (this.dir === 2) { this.bx1 = this.x - 1.5; this.by1 = this.y - 1.5; this.bx2 = this.x + 1.5; this.by2 = this.y - 1.5; }
    else { this.bx1 = this.x + 1.5; this.by1 = this.y - 1.5; this.bx2 = this.x + 1.5; this.by2 = this.y + 1.5; }
  }

  setModalContent(title, htmlContent) {
    this.modalTitle = title;
    this.modalHtml = htmlContent;
    return this;
  }

  isTopClicked(sx, sy) {
    var sc = cam.size / 48;
    var hw = this.w / 2, hd = this.d / 2, h = 22.5 * sc;
    var b0 = toS(this.x - hw, this.y - hd), b1 = toS(this.x + hw, this.y - hd);
    var b2 = toS(this.x + hw, this.y + hd), b3 = toS(this.x - hw, this.y + hd);

    var pts = [
      { x: b0.x, y: b0.y - h }, { x: b1.x, y: b1.y - h },
      { x: b2.x, y: b2.y - h }, { x: b3.x, y: b3.y - h }
    ];

    var inside = true;
    for (var i = 0; i < 4; i++) {
      var p1 = pts.at(i), p2 = pts.at((i + 1) % 4);
      var cross = (p2.x - p1.x) * (sy - p1.y) - (p2.y - p1.y) * (sx - p1.x);
      if (cross < 0) { inside = false; break; }
    }
    return inside;
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
    }
  }

  collectRenderItems(list) {
    var self = this;
    list.push({ type: 'custom', s: toS(this.x, this.y), drawFn: function(sc) { self.drawBody(sc); } });
    list.push({ type: 'custom', s: toS((this.bx1 + this.bx2) / 2, (this.by1 + this.by2) / 2), drawFn: function(sc) { self.drawBackBoard(sc); } });
  }

  drawBody(sc) {
    var hw = this.w / 2, hd = this.d / 2, h = 22.5 * sc;
    var b0 = toS(this.x - hw, this.y - hd), b1 = toS(this.x + hw, this.y - hd);
    var b2 = toS(this.x + hw, this.y + hd), b3 = toS(this.x - hw, this.y + hd);
    var t0 = { x: b0.x, y: b0.y - h }, t1 = { x: b1.x, y: b1.y - h };
    var t2 = { x: b2.x, y: b2.y - h }, t3 = { x: b3.x, y: b3.y - h };

    var nTex = null, eTex = null, sTex = null, wTex = null;
    if (this.dir === 0) nTex = this.frontTex;
    else if (this.dir === 1) eTex = this.frontTex;
    else if (this.dir === 2) sTex = this.frontTex;
    else wTex = this.frontTex;

    var sides = [
      { a: b0, b: b1, c: t1, d: t0, tex: nTex }, { a: b1, b: b2, c: t2, d: t1, tex: eTex },
      { a: b2, b: b3, c: t3, d: t2, tex: sTex }, { a: b3, b: b0, c: t0, d: t3, tex: wTex }
    ];

    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
    sides.forEach(function(s) {
      if (s.b.x - s.a.x < 0) {
        if (s.tex) drawTexturedQuad(s.tex, s.d, s.c, s.b, s.a, 0.15);
        else { ctx.fillStyle = '#111111'; ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.lineTo(s.c.x, s.c.y); ctx.lineTo(s.d.x, s.d.y); ctx.closePath(); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.lineTo(s.c.x, s.c.y); ctx.lineTo(s.d.x, s.d.y); ctx.closePath(); ctx.stroke();
      }
    });

    // 上面の描画
    ctx.save();
    ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.closePath();
    if (this.topTex && this.topTex.loaded) {
      ctx.clip();
      var iw = this.topTex.img.width, ih = this.topTex.img.height;
      if (this.dir === 0 || this.dir === 2) ctx.transform((t1.x - t0.x) / iw, (t1.y - t0.y) / iw, (t3.x - t0.x) / ih, (t3.y - t0.y) / ih, t0.x, t0.y);
      else ctx.transform((t3.x - t0.x) / iw, (t3.y - t0.y) / iw, (t1.x - t0.x) / ih, (t1.y - t0.y) / ih, t0.x, t0.y);
      ctx.drawImage(this.topTex.img, 0, 0);
    } else { ctx.fillStyle = '#778899'; ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.closePath(); ctx.stroke();

    // 前面右側の正方形パネルを描画
    this.drawFrontSign(sc);
  }

  drawFrontSign(sc) {
    var hw = this.w / 2, hd = this.d / 2;
    var signH = 45 * sc;
    var span = 45 / 48;

    var rPt, lPt;
    if (this.dir === 0) {
      rPt = { x: this.x - hw, y: this.y - hd };
      lPt = { x: rPt.x + span, y: rPt.y };
    } else if (this.dir === 1) {
      rPt = { x: this.x + hw, y: this.y - hd };
      lPt = { x: rPt.x, y: rPt.y + span };
    } else if (this.dir === 2) {
      rPt = { x: this.x + hw, y: this.y + hd };
      lPt = { x: rPt.x - span, y: rPt.y };
    } else {
      rPt = { x: this.x - hw, y: this.y + hd };
      lPt = { x: rPt.x, y: rPt.y - span };
    }

    var bR = toS(rPt.x, rPt.y);
    var bL = toS(lPt.x, lPt.y);

    // 前面がカメラ側を向いているとき（画面上で左端bLより右端bRが右側にあるとき）のみ描画
    if (bR.x > bL.x) {
      var tR = { x: bR.x, y: bR.y - signH };
      var tL = { x: bL.x, y: bL.y - signH };

      drawTexturedQuad(this.signTex, tL, tR, bR, bL, 0.05);

      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bL.x, bL.y); ctx.lineTo(bR.x, bR.y);
      ctx.lineTo(tR.x, tR.y); ctx.lineTo(tL.x, tL.y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  drawBackBoard(sc) {
    var floatY = 32 * sc;
    var h = 64 * sc;
    var p1 = toS(this.bx1, this.by1), p2 = toS(this.bx2, this.by2);
    var b1 = { x: p1.x, y: p1.y - floatY }, b2 = { x: p2.x, y: p2.y - floatY };
    var t1 = { x: p1.x, y: p1.y - floatY - h }, t2 = { x: p2.x, y: p2.y - floatY - h };

    var postW = 6 * sc;
    [ { ground: p1, top: t1 }, { ground: p2, top: t2 } ].forEach(function(post) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath(); ctx.ellipse(post.ground.x, post.ground.y, 6 * sc, 6 * sc * cam.pitch, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a5568'; ctx.strokeStyle = '#1a202c'; ctx.lineWidth = 1.5;
      ctx.fillRect(post.ground.x - postW / 2, post.top.y, postW, post.ground.y - post.top.y);
      ctx.strokeRect(post.ground.x - postW / 2, post.top.y, postW, post.ground.y - post.top.y);
    });

    if (p2.x > p1.x) drawTexturedQuad(this.boardTex, t1, t2, b2, b1, 0.05);
    else drawTexturedQuad(this.boardTex, t2, t1, b1, b2, 0.15);

    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y); ctx.closePath(); ctx.stroke();
  }
}