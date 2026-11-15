function updateCameraByKeys() {
  // 1. 水平回転（A: 左回転 / D: 右回転）
  if (keys.has('a')) cam.ang -= 0.03;
  if (keys.has('d')) cam.ang += 0.03;

  // 2. 見下ろし角度・縦回転（W: 角度を深く・上から見下ろす / S: 角度を浅く・水平に近づける）
  if (keys.has('w')) cam.pitch = Math.min(0.95, cam.pitch + 0.015);
  if (keys.has('s')) cam.pitch = Math.max(0.25, cam.pitch - 0.015);

  // 3. ズーム（Z: ズームイン・拡大 / X: ズームアウト・縮小）
  if (keys.has('z')) cam.size = Math.min(96, cam.size + 1.2);
  if (keys.has('x')) cam.size = Math.max(24, cam.size - 1.2);
}

function updatePlayer() {
  if (isLeftDown && !isMinimapDrag) {
    var mw = toW(lastMouseX, lastMouseY);
    if (gameMap.isInside(mw.x, mw.y)) { p.tx = mw.x; p.ty = mw.y; }
  }

  // プレイヤー移動は矢印キー（↑↓←→）で操作（WASDはカメラ操作へ割り当て）
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

  var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
  p.mv = d > 0.05;
  if (p.mv) {
    p.x += (dx / d) * 0.08;
    p.y += (dy / d) * 0.08;
    p.f++;
    updatePlayerDirection(dx, dy);
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
  updateCameraByKeys();
  updatePlayer();
  mobs.updateAll();
  obstacles.items.forEach(function(o) {
    o.hit(p);
    mobs.items.forEach(function(m) { o.hit(m); });
  });
  drawAll();
  requestAnimationFrame(loop);
}
loop();