// ミニマップの位置と縮尺を計算して返す関数（描画とクリック判定で共通利用）
function getMinimapBounds() {
  var maxSize = 140;
  var scale = maxSize / Math.max(gameMap.width, gameMap.height);
  var w = gameMap.width * scale;
  var h = gameMap.height * scale;
  return {
    x: c.width - w - 12,
    y: 12,
    w: w,
    h: h,
    scale: scale
  };
}

// 画面のクリック座標がミニマップ内なら、マップ上のワールド座標(wx, wy)に変換して返す
function screenToMinimapWorld(sx, sy) {
  if (isPhotoMode) return null;
  var b = getMinimapBounds();
  if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
    return {
      x: (sx - b.x) / b.scale,
      y: (sy - b.y) / b.scale
    };
  }
  return null; // ミニマップ外のクリック
}

// ミニマップの描画処理
function drawMinimap() {
  var b = getMinimapBounds();

  ctx.save();
  ctx.translate(b.x, b.y);

  // 1. 半透明の背景と外枠
  ctx.fillStyle = 'rgba(15, 25, 35, 0.75)';
  ctx.fillRect(0, 0, b.w, b.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, b.w, b.h);

  // 2. 障害物の描画（obstacles.items をループ）
  obstacles.items.forEach(function(o) {
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect((o.x - o.w / 2) * b.scale, (o.y - o.d / 2) * b.scale, o.w * b.scale, o.d * b.scale);

    if (o.bx1 !== undefined) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(o.bx1 * b.scale, o.by1 * b.scale);
      ctx.lineTo(o.bx2 * b.scale, o.by2 * b.scale);
      ctx.stroke();
    }
  });
  // 3. ポリンの描画
  mobs.items.forEach(function(m) {
    ctx.fillStyle = (p.followMob === m) ? '#00e5ff' : '#ff77aa';
    ctx.beginPath();
    ctx.arc(m.x * b.scale, m.y * b.scale, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. 移動中の目的地マーカー（赤い十字フラッグ）
  if (p.mv && !p.followMob) {
    var tx = p.tx * b.scale;
    var ty = p.ty * b.scale;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx - 4, ty); ctx.lineTo(tx + 4, ty);
    ctx.moveTo(tx, ty - 4); ctx.lineTo(tx, ty + 4);
    ctx.stroke();
  }

  // 5. 自キャラの座標とカメラの向き
  var px = p.x * b.scale;
  var py = p.y * b.scale;
  var viewAngle = -cam.ang + Math.PI / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, 20, viewAngle - 0.5, viewAngle + 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ff3333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}