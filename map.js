class FieldMap {
  // wallTexSrc: 奥壁に貼る64x64テクスチャ画像名（例: 'red.png'）、wallHeight: 壁の高さ
  constructor(width, height, color1, color2, wallTexSrc, wallHeight) {
    this.width = width;
    this.height = height;
    this.color1 = color1 || '#5c9449';
    this.color2 = color2 || '#528740';
    this.wallTex = wallTexSrc ? getObstacleTexture(wallTexSrc) : null;
    this.wallHeight = wallHeight || 96; // 標準ズーム時の高さ(px)
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

    // マップ四隅の地面スクリーン座標（時計回り: 北西 -> 北東 -> 南東 -> 南西）
    var c0 = toS(0, 0);
    var c1 = toS(w, 0);
    var c2 = toS(w, d);
    var c3 = toS(0, d);

    // 4辺の定義（stepsは繰り返しマス数）
    var edges = [
      { a: c0, b: c1, steps: w, shade: 0.10 }, // 北辺（y = 0）
      { a: c1, b: c2, steps: d, shade: 0.22 }, // 東辺（x = width）
      { a: c2, b: c3, steps: w, shade: 0.10 }, // 南辺（y = height）
      { a: c3, b: c0, steps: d, shade: 0.22 }  // 西辺（x = 0）
    ];

    var self = this;
    edges.forEach(function(edge) {
      // 時計回り定義のため、画面上で左から右へ向かう辺(b.x > a.x)が必ず「奥側」になる
      if (edge.b.x - edge.a.x > 0) {
        var ta = { x: edge.a.x, y: edge.a.y - h };
        var tb = { x: edge.b.x, y: edge.b.y - h };

        if (self.wallTex && self.wallTex.loaded) {
          // 1マスごとにテクスチャをタイル貼り付け
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
          // テクスチャ未指定・読み込み前は石壁風の単色で描画
          ctx.fillStyle = edge.shade > 0.15 ? '#5c6672' : '#707b88';
          ctx.beginPath();
          ctx.moveTo(edge.a.x, edge.a.y);
          ctx.lineTo(edge.b.x, edge.b.y);
          ctx.lineTo(tb.x, tb.y);
          ctx.lineTo(ta.x, ta.y);
          ctx.closePath();
          ctx.fill();
        }

        // 壁の輪郭線を描画
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
    // 1. 奥側の外周壁を先に描画（地面やキャラの背後に配置）
    this.drawBackWalls();

    // 2. 地面タイルを描画
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