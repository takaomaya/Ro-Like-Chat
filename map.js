class FieldMap {
  // wallTexSrc: 奥壁に貼る64x64テクスチャ画像名、wallHeight: 壁の高さ、showSkyDome: スカイドーム表示フラグ
  constructor(width, height, wallTexSrc, wallHeight, showSkyDome) {
    this.width = width;
    this.height = height;
    this.color1 = '#5c9449'; // 床色Aのデフォルト値
    this.color2 = '#528740'; // 床色Bのデフォルト値
    this.wallTex = wallTexSrc ? getObstacleTexture(wallTexSrc) : null;
    this.wallHeight = wallHeight || 96; // 標準ズーム時の高さ(px)
    this.isMaintenance = false;

    // スカイドーム設定
    this.showSkyDome = (showSkyDome !== undefined) ? !!showSkyDome : true;
    this.skyDomeColor = '#4aa8ff'; // 初期値：空の色の青

    this.sayRange = 5;

    // システム周知メッセージ用プロパティ
    this.sysMsg = '';
    this.sysTime = 0;
  }

  // 床色Aを変更するメソッド
  setFloorColorA(color) {
    if (color) {
      this.color1 = color;
    }
    return this;
  }

  // 床色Bを変更するメソッド
  setFloorColorB(color) {
    if (color) {
      this.color2 = color;
    }
    return this;
  }

  // スカイドームの表示・非表示を切り替えるメソッド
  setSkyDomeVisible(visible) {
    this.showSkyDome = !!visible;
    return this;
  }

  // スカイドームの色を指定するメソッド
  setSkyDomeColor(color) {
    if (color) {
      this.skyDomeColor = color;
    }
    return this;
  }
 
  // 管理者用システム周知メソッド（時間経過で自動消去）
  // 例: gameMap.say('イベント終了まであと5分です！');
  // 例: gameMap.say('まもなくメンテナンスに入ります', 600, '運営');
  say(text, duration, senderName) {
    if (!text) return;
    var prefix = senderName ? (senderName + ' : ') : '';
    this.sysMsg = prefix + text;
    this.sysTime = duration || 300;

    if (typeof addChatLog === 'function') {
      addChatLog(this.sysMsg, 'sys');
    }
  }

  // システム周知のタイマー更新
  updateNotice() {
    if (this.sysTime > 0) {
      this.sysTime--;
    }
  }

  // ミニマップより少し下の行・画面中央にシステム周知を描画する
  // ミニマップより少し下の行・画面中央にシステム周知を描画する（長文の自動折り返し対応）
  drawNotice() {
    if (this.sysTime <= 0 || !this.sysMsg) return;

    var miniBottom = 152;
    if (typeof getMinimapBounds === 'function') {
      var b = getMinimapBounds();
      miniBottom = b.y + b.h;
    }
    var startTopY = miniBottom + 10;

    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 消える直前はふわっとフェードアウトさせる
    if (this.sysTime < 25) {
      ctx.globalAlpha = this.sysTime / 25;
    }

    var padX = 18;
    var padY = 8;
    var lineHeight = 20;
    // 画面幅の88%（最大680px）をテキストの最大横幅とする
    var maxTextWidth = Math.max(180, Math.min(680, c.width * 0.88 - padX * 2));

    // 改行コード(\n)および最大横幅での自動折り返し処理
    var lines = [];
    var paragraphs = this.sysMsg.split('\n');
    paragraphs.forEach(function(para) {
      if (para === '') {
        lines.push('');
        return;
      }
      var currentLine = '';
      for (var i = 0; i < para.length; i++) {
        var ch = para.charAt(i);
        var testLine = currentLine + ch;
        if (ctx.measureText(testLine).width > maxTextWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = ch;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
    });

    // 全行の中で最も長い行の幅に合わせてボックス横幅を決定
    var maxLineW = 0;
    lines.forEach(function(line) {
      var lw = ctx.measureText(line).width;
      if (lw > maxLineW) maxLineW = lw;
    });

    var boxW = maxLineW + padX * 2;
    var boxH = lines.length * lineHeight + padY * 2;
    var cx = c.width / 2;

    // 背景と金枠
    ctx.fillStyle = 'rgba(10, 18, 28, 0.85)';
    ctx.fillRect(cx - boxW / 2, startTopY, boxW, boxH);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - boxW / 2, startTopY, boxW, boxH);

    // 各行のテキストを描画
    ctx.fillStyle = '#fde047';
    lines.forEach(function(line, idx) {
      var lineY = startTopY + padY + lineHeight * idx + lineHeight / 2;
      ctx.fillText(line, cx, lineY);
    });

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

  // スカイドーム（マップ全体を覆う球状の天蓋の内壁）を描画する
  drawSkyDome() {
    if (!this.showSkyDome) return;

    var sc = cam.size / 48;
    // マップ中心を基準に、マップ全体を囲う半径を自動計算（対角線の半分＋余白）
    var cx = this.width / 2;
    var cy = this.height / 2;
    var radiusW = Math.hypot(this.width, this.height) * 0.55;
    // 縦方向の高さ（標準ズーム時のピクセル高さ）
    var domeHeight = radiusW * 48 * 0.85;

    // 3D空間上のドーム頂点を2Dスクリーン座標に変換する内部関数
    function projectDomePt(wx, wy, wz) {
      var s = toS(wx, wy);
      // 見下ろし角度(pitch)に応じて高さの見え方を自然に補正
      var heightScale = Math.cos(cam.pitch * 0.65);
      return {
        x: s.x,
        y: s.y - wz * sc * heightScale
      };
    }

    var rings = 10;    // 緯度分割数（天頂〜地平線）
    var segments = 32; // 経度分割数（ぐるり1周）

    ctx.save();
    for (var r = 0; r < rings; r++) {
      var phi0 = (r / rings) * (Math.PI / 2);       // 上側の緯度角 (0 = 天頂)
      var phi1 = ((r + 1) / rings) * (Math.PI / 2); // 下側の緯度角 (PI/2 = 地面)

      var rad0 = Math.sin(phi0) * radiusW;
      var rad1 = Math.sin(phi1) * radiusW;
      var z0 = Math.cos(phi0) * domeHeight;
      var z1 = Math.cos(phi1) * domeHeight;

      // 天頂に向かって少し明るくなる空のグラデーション表現
      var shadeAlpha = (r / rings) * 0.22;

      for (var s = 0; s < segments; s++) {
        var theta0 = (s / segments) * Math.PI * 2;
        var theta1 = ((s + 1) / segments) * Math.PI * 2;
        var midTheta = (theta0 + theta1) * 0.5;

        // カメラから見て「奥側」にある面だけを描画（手前側は透明でカメラを遮らない）
        var dirX = Math.cos(midTheta);
        var dirY = Math.sin(midTheta);
        var screenDepthY = dirX * Math.sin(cam.ang) + dirY * Math.cos(cam.ang);
        if (screenDepthY > 0.15) continue;

        var p00 = projectDomePt(cx + Math.cos(theta0) * rad0, cy + Math.sin(theta0) * rad0, z0);
        var p10 = projectDomePt(cx + Math.cos(theta1) * rad0, cy + Math.sin(theta1) * rad0, z0);
        var p11 = projectDomePt(cx + Math.cos(theta1) * rad1, cy + Math.sin(theta1) * rad1, z1);
        var p01 = projectDomePt(cx + Math.cos(theta0) * rad1, cy + Math.sin(theta0) * rad1, z1);

        // ベースとなる空色を描画（ポリゴン同士の隙間を防ぐため同色で極細ストロークも引く）
        ctx.beginPath();
        ctx.moveTo(p00.x, p00.y);
        ctx.lineTo(p10.x, p10.y);
        ctx.lineTo(p11.x, p11.y);
        ctx.lineTo(p01.x, p01.y);
        ctx.closePath();

        ctx.fillStyle = this.skyDomeColor;
        ctx.fill();
        ctx.strokeStyle = this.skyDomeColor;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // 球体の丸み（立体感）を出すための薄い陰影オーバーレイ
        if (shadeAlpha > 0.01) {
          ctx.fillStyle = 'rgba(0, 15, 40, ' + shadeAlpha.toFixed(3) + ')';
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  draw() {
    this.drawSkyDome();
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