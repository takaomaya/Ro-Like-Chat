// 指定した座標が障害物の内部に入っているか判定する補助関数
function isInsideAnyObstacle(wx, wy, margin) {
  var m = margin || 0;
  return Array.from(obstacles.items.values()).some(function(o) {
    var hw = o.w / 2 + m;
    var hd = o.d / 2 + m;
    return Math.abs(wx - o.x) < hw && Math.abs(wy - o.y) < hd;
  });
}

// 壁に正面からぶつかったときに左右どちらへ迂回すべきか判定する補助関数
function chooseAvoidSide(ent, dirX, dirY) {
  var leftX = -dirY, leftY = dirX;
  var rightX = dirY, rightY = -dirX;
  var step = 1.2;

  // 左右それぞれの少し先が障害物に塞がっていないか・目的地に近いかで判定
  var leftBlocked = isInsideAnyObstacle(ent.x + leftX * step, ent.y + leftY * step, ent.r * 0.8);
  var rightBlocked = isInsideAnyObstacle(ent.x + rightX * step, ent.y + rightY * step, ent.r * 0.8);

  if (leftBlocked && !rightBlocked) return -1; // 右へ迂回
  if (rightBlocked && !leftBlocked) return 1; // 左へ迂回

  var leftDist = Math.hypot(ent.tx - (ent.x + leftX), ent.ty - (ent.y + leftY));
  var rightDist = Math.hypot(ent.tx - (ent.x + rightX), ent.ty - (ent.y + rightY));
  return leftDist <= rightDist ? 1 : -1;
}

function updateCameraByKeys() {
  // 1. 水平回転（A: 左回転 / D: 右回転）
  if (keys.has('a')) cam.ang -= 0.03;
  if (keys.has('d')) cam.ang += 0.03;

  // 2. 見下ろし角度・縦回転（W: 角度を深く / S: 角度を浅く）
  if (keys.has('w')) cam.pitch = Math.min(0.95, cam.pitch + 0.015);
  if (keys.has('s')) cam.pitch = Math.max(0.25, cam.pitch - 0.015);

  // 3. ズーム（Z: 拡大 / X: 縮小）
  if (keys.has('z')) cam.size = Math.min(96, cam.size + 1.2);
  if (keys.has('x')) cam.size = Math.max(24, cam.size - 1.2);
}

function updatePlayer() {
  if (isLeftDown && !isMinimapDrag) {
    var mw = toW(lastMouseX, lastMouseY);
    if (gameMap.isInside(mw.x, mw.y)) { p.tx = mw.x; p.ty = mw.y; }
  }

  // プレイヤー移動は矢印キー（↑↓←→）で操作
  var kx = 0, ky = 0;
  if (keys.has('arrowup')) ky -= 1;
  if (keys.has('arrowdown')) ky += 1;
  if (keys.has('arrowleft')) kx -= 1;
  if (keys.has('arrowright')) kx += 1;

  if (kx !== 0 || ky !== 0) {
    p.followMob = null;
    var wx = kx * Math.cos(-cam.ang) - ky * Math.sin(-cam.ang);
    var wy = kx * Math.sin(-cam.ang) + ky * Math.cos(-cam.ang);
    p.tx = Math.max(0, Math.min(gameMap.width, p.x + wx));
    p.ty = Math.max(0, Math.min(gameMap.height, p.y + wy));
  }

  if (p.followMob) {
    var fm = p.followMob;
    var fdist = Math.hypot(fm.x - p.x, fm.y - p.y);
    if (fdist > 1.1) { p.tx = fm.x; p.ty = fm.y; }
    else { p.tx = p.x; p.ty = p.y; updatePlayerDirection(fm.x - p.x, fm.y - p.y); }
  }

  // 目的地自体が障害物の中にある場合、壁の手前まで来たら到着扱いにする
  if (isInsideAnyObstacle(p.tx, p.ty, p.r * 0.5) && Math.hypot(p.tx - p.x, p.ty - p.y) < 1.6) {
    p.tx = p.x;
    p.ty = p.y;
  }

  var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
  p.mv = d > 0.05;
  if (p.mv) {
    var dirX = dx / d;
    var dirY = dy / d;
    var moveX = dirX;
    var moveY = dirY;

    // 引っかかり検知中は、選んだ迂回方向（横ベクトル）を強く混ぜて壁の角を回り込む
    if (p.stuckTimer > 0) {
      p.stuckTimer--;
      var side = p.avoidSign || 1;
      var perpX = -dirY * side;
      var perpY = dirX * side;
      moveX = dirX * 0.35 + perpX * 0.93;
      moveY = dirY * 0.35 + perpY * 0.93;
      var mLen = Math.hypot(moveX, moveY);
      moveX /= mLen;
      moveY /= mLen;
    }

    p.x += moveX * 0.08;
    p.y += moveY * 0.08;
    p.f++;
    updatePlayerDirection(moveX, moveY);
  } else {
    p.stuckTimer = 0;
  }

  p.x += p.vx;
  p.y += p.vy;
  gameMap.clampEntity(p);
  p.vx *= 0.85; p.vy *= 0.85;

  if (!p.isMsgPinned && p.mTime > 0) p.mTime--;
  if (p.eTime > 0) p.eTime--;
}

function drawAll() {
  ctx.fillStyle = '#1a2634';
  ctx.fillRect(0, 0, c.width, c.height);

  gameMap.draw();

  var sc = cam.size / 48;
  var list = new Array({ t: 'p', s: toS(p.x, p.y) });
  mobs.collectRenderItems(list);
  obstacles.collectRenderItems(list);
  list.sort(function(a, b) { return a.s.y - b.s.y; });

  list.forEach(function(it) {
    if (it.type === 'custom') it.drawFn(sc);
    else if (it.type === 'obs') it.obj.draw(sc);
    else if (it.t === 'm') it.o.draw(it.s, sc);
    else drawPlayer(it.s, sc);
  });

  if (!isPhotoMode) {
    drawMinimap();
  }
}

function loop() {
  // メンテナンスモード中は進行を一時停止し、描画のみ維持する
  if (gameMap && gameMap.isMaintenance) {
    drawAll();
    requestAnimationFrame(loop);
    return;
  }

  var prevPx = p.x, prevPy = p.y;

  updateCameraByKeys();
  updatePlayer();
  mobs.updateAll();

  obstacles.items.forEach(function(o) {
    o.hit(p);
    mobs.items.forEach(function(m) { o.hit(m); });
  });

  // 押し戻し後にほとんど動けていない（正面衝突している）場合は迂回タイマーを起動
  if (p.mv) {
    var actualMoved = Math.hypot(p.x - prevPx, p.y - prevPy);
    if (actualMoved < 0.025) {
      p.stuckCount = (p.stuckCount || 0) + 1;
      if (p.stuckCount >= 4) {
        if (!p.stuckTimer || p.stuckTimer <= 0) {
          var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy) || 1;
          p.avoidSign = chooseAvoidSide(p, dx / d, dy / d);
        }
        p.stuckTimer = 28; // 約0.45秒間、壁の角を抜けるまで横方向へ回り込む
        p.stuckCount = 0;
      }
    } else {
      p.stuckCount = 0;
    }
  } else {
    p.stuckCount = 0;
  }

  drawAll();
  requestAnimationFrame(loop);
}
loop();