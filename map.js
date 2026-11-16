class FieldMap {
  // wallTexSrc: 奥壁に貼る64x64テクスチャ画像名（例: 'red.png'）、wallHeight: 壁の高さ
  constructor(width, height, color1, color2, wallTexSrc, wallHeight) {
    this.width = width;
    this.height = height;
    this.color1 = color1 || '#5c9449';
    this.color2 = color2 || '#528740';
    this.wallTex = wallTexSrc ? getObstacleTexture(wallTexSrc) : null;
    this.wallHeight = wallHeight || 96; // 標準ズーム時の高さ(px)
    this.isMaintenance = false;

    // システム周知メッセージ用プロパティ
    this.sysMsg = '';
    this.sysTime = 0;
    this.isSysPinned = false;
  }

  // 管理者用システム周知メソッド
  // 例: gameMap.say('イベント終了まであと5分です！');
  // 例: gameMap.say('まもなくメンテナンスに入ります', 600, true, '運営');
  say(text, duration, pinned, senderName) {
    if (!text) return;
    var prefix = senderName ? (senderName + ' : ') : '';
    this.sysMsg = prefix + text;
    this.sysTime = duration || 300;
    this.isSysPinned = !!pinned;

    if (typeof addChatLog === 'function') {
      addChatLog(this.sysMsg, 'sys');
    }
  }

  // システム周知のタイマー更新
  updateNotice() {
    if (!this.isSysPinned && this.sysTime > 0) {
      this.sysTime--;
    }
  }

  // ミニマップより少し下の行・画面中央にシステム周知を描画する
  drawNotice() {
    if (this.sysTime <= 0 || !this.sysMsg) return;

    // ミニマップの下端位置を基準にする（フォトモード中でも同じ高さを維持）
    var miniBottom = 152;
    if (typeof getMinimapBounds === 'function') {
      var b = getMinimapBounds();
      miniBottom = b.y + b.h;
    }
    var noticeY = miniBottom + 24;

    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 消える直前はふわっとフェードアウトさせる
    if (!this.isSysPinned && this.sysTime < 25) {
      ctx.globalAlpha = this.sysTime / 25;
    }

    var padX = 18;
    var boxH = 30;
    var w = ctx.measureText(this.sysMsg).width + padX * 2;
    var cx = c.width / 2;

    // 背景と金枠
    ctx.fillStyle = 'rgba(10, 18, 28, 0.85)';
    ctx.fillRect(cx - w / 2, noticeY - boxH / 2, w, boxH);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - w / 2, noticeY - boxH / 2, w, boxH);

    // 周知テキスト
    ctx.fillStyle = '#fde047';
    ctx.fillText(this.sysMsg, cx, noticeY + 1);
    ctx.restore();
  }

  // メンテナンスモードの切り替えメソッド
  setMaintenanceMode(active, message, title) {
    this.isMaintenance = !!active;
    var overlay = document.getElementById('maintenance-overlay');
    if (!overlay) return;

    if (this.isMaintenance) {
      var titleEl = document.getElementById('maintenance-title');
      var msgEl = document.getElementById('maintenance-message');
      if (titleEl) {
        titleEl.textContent = title || 'メンテナンス中';
      }
      if (msgEl) {
        msgEl.innerHTML = message || '現在メンテナンスを行っています。<br>しばらくお待ちください。';
      }
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  // 現在のメンテナンス状態を反転させるメソッド
  toggleMaintenanceMode(message, title) {
    this.setMaintenanceMode(!this.isMaintenance, message, title);
  }

  isInside(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }

  clampEntity(ent) {
    ent.x = Math.max(ent.r, Math.min(this.width - ent.r, ent.x));
    ent.y = Math.max(ent.r, Math.min(this.height - ent.r, ent.y));
  }

  // マップ外周の「カメラから見て奥側の2辺」だけに壁を描画する
  drawBackWalls() {
    var sc = cam.size / 48;
    var h = this.wallHeight * sc;
    var w = this.width;
    var d = this.height;

    var c0 = toS(0, 0);
    var c1 = toS(w, 0);
    var c2 = toS(w, d);
    var c3 = toS(0, d);

    var edges = [
      { a: c0, b: c1, steps: w, shade: 0.10 },
      { a: c1, b: c2, steps: d, shade: 0.22 },
      { a: c2, b: c3, steps: w, shade: 0.10 },
      { a: c3, b: c0, steps: d, shade: 0.22 }
    ];

    var self = this;
    edges.forEach(function(edge) {
      if (edge.b.x - edge.a.x > 0) {
        var ta = { x: edge.a.x, y: edge.a.y - h };
        var tb = { x: edge.b.x, y: edge.b.y - h };

        if (self.wallTex && self.wallTex.loaded) {
          var count = Math.max(1, Math.round(edge.steps));
          for (var i = 0; i < count; i++) {
            var r0 = i / count;
            var r1 = (i + 1) / count;
            drawTexturedQuad(
              self.wallTex,
              lerpPt(ta, tb, r0), lerpPt(ta, tb, r1),
              lerpPt(edge.a, edge.b, r1), lerpPt(edge.a, edge.b, r0),
              edge.shade
            );
          }
        } else {
          ctx.fillStyle = edge.shade > 0.15 ? '#5c6672' : '#707b88';
          ctx.beginPath();
          ctx.moveTo(edge.a.x, edge.a.y);
          ctx.lineTo(edge.b.x, edge.b.y);
          ctx.lineTo(tb.x, tb.y);
          ctx.lineTo(ta.x, ta.y);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = '#2b303a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(edge.a.x, edge.a.y);
        ctx.lineTo(edge.b.x, edge.b.y);
        ctx.lineTo(tb.x, tb.y);
        ctx.lineTo(ta.x, ta.y);
        ctx.closePath();
        ctx.stroke();
      }
    });
  }

  draw() {
    this.drawBackWalls();

    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        var p0 = toS(x, y), p1 = toS(x + 1, y), p2 = toS(x + 1, y + 1), p3 = toS(x, y + 1);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = (x + y) % 2 === 0 ? this.color1 : this.color2;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.15)';
        ctx.stroke();
      }
    }
  }
}