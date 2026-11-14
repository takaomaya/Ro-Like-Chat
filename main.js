function updatePlayer() {
  if (isLeftDown && !isMinimapDrag) {
    var mw = toW(lastMouseX, lastMouseY);
    if (gameMap.isInside(mw.x, mw.y)) { p.tx = mw.x; p.ty = mw.y; }
  }

  var kx = 0, ky = 0;
  if (keys.has('arrowup') || keys.has('w')) ky -= 1;
  if (keys.has('arrowdown') || keys.has('s')) ky += 1;
  if (keys.has('arrowleft') || keys.has('a')) kx -= 1;
  if (keys.has('arrowright') || keys.has('d')) kx += 1;

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

  // 固定表示中でない場合のみ表示タイマーを減らす
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