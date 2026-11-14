var isLeftDown = false, isRightDown = false, isMinimapDrag = false;
var prevX = 0, prevY = 0, lastMouseX = 0, lastMouseY = 0;
var keys = new Set();

// スマホ用 2本指ジェスチャー管理変数
var isPinching = false;
var pinchStartDist = 0;
var pinchStartSize = 48;
var prevPinchMidX = 0;
var prevPinchMidY = 0;

window.addEventListener('keydown', function(e) {
  if (e.ctrlKey && EMO.has(e.key)) { e.preventDefault(); setEmo(e.key); return; }
  if (e.key === 'Enter') { document.activeElement === inp ? sendChat() : inp.focus(); return; }
  if (document.activeElement !== inp) keys.add(e.key.toLowerCase());
});

window.addEventListener('keyup', function(e) {
  keys.delete(e.key.toLowerCase());
});

window.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// ==========================================
// 1. ポインター操作（PCマウス ＋ スマホ1本指タップ移動）
// ==========================================
c.onpointerdown = function(e) {
  if (isPinching) return;
  inp.blur();

  if (p.isMsgPinned) {
    p.isMsgPinned = false;
    p.mTime = 0;
  }

  lastMouseX = prevX = e.clientX;
  lastMouseY = prevY = e.clientY;

  if (e.button === 0) {
    // 1. ミニマップ上のクリック判定
    var miniPos = screenToMinimapWorld(e.clientX, e.clientY);
    if (miniPos) {
      isMinimapDrag = true;
      p.followMob = null;
      p.tx = miniPos.x; p.ty = miniPos.y;
      return;
    }

    // 2. ロングウォールの上面（天板）クリック判定
    var clickedWall = Array.from(obstacles.items.values()).find(function(o) {
      return typeof o.isTopClicked === 'function' && o.isTopClicked(e.clientX, e.clientY);
    });
    if (clickedWall) {
      openWallModal(clickedWall);
      return;
    }

    // 3. Shift + 左クリックでポリン追尾
    if (e.shiftKey) {
      var hit = Array.from(mobs.items.values()).find(function(m) {
        var s = toS(m.x, m.y);
        return Math.hypot(e.clientX - s.x, e.clientY - (s.y - 10)) < 26;
      });
      if (hit) { p.followMob = hit; return; }
    }

    // 4. 通常の左クリック（移動開始）
    isLeftDown = true;
    p.followMob = null;
    var w = toW(e.clientX, e.clientY);
    if (gameMap.isInside(w.x, w.y)) { p.tx = w.x; p.ty = w.y; }

  } else if (e.button === 2) {
    isRightDown = true;
  }
};

c.onpointermove = function(e) {
  if (isPinching) return;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  if (isMinimapDrag) {
    var miniPos = screenToMinimapWorld(e.clientX, e.clientY);
    if (miniPos) { p.tx = miniPos.x; p.ty = miniPos.y; }
    return;
  }

  if (isRightDown) {
    cam.ang += (e.clientX - prevX) * 0.008;
    cam.pitch = Math.max(0.25, Math.min(0.95, cam.pitch + (e.clientY - prevY) * 0.003));
    prevX = e.clientX; prevY = e.clientY;
  }
};

c.onpointerup = function(e) {
  if (e.button === 0) { isLeftDown = false; isMinimapDrag = false; }
  if (e.button === 2) { isRightDown = false; }
};

window.addEventListener('wheel', function(e) {
  cam.size = Math.max(24, Math.min(96, cam.size - e.deltaY * 0.05));
});

// ==========================================
// 2. スマホ専用 2本指ピンチズーム ＋ 2本指カメラ回転
// ==========================================
c.addEventListener('touchstart', function(e) {
  if (e.touches.length === 2) {
    isPinching = true;
    isLeftDown = false;
    isMinimapDrag = false;

    var t0 = e.touches.item(0);
    var t1 = e.touches.item(1);
    pinchStartDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    pinchStartSize = cam.size;
    prevPinchMidX = (t0.clientX + t1.clientX) / 2;
    prevPinchMidY = (t0.clientY + t1.clientY) / 2;
  }
}, { passive: false });

c.addEventListener('touchmove', function(e) {
  if (e.touches.length === 2 && isPinching) {
    e.preventDefault();
    var t0 = e.touches.item(0);
    var t1 = e.touches.item(1);

    // 1. 2本指の距離変化でズーム（ピンチイン・ピンチアウト）
    var currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    if (pinchStartDist > 0) {
      var scale = currentDist / pinchStartDist;
      cam.size = Math.max(24, Math.min(96, pinchStartSize * scale));
    }

    // 2. 2本指の中点の移動量でカメラを360度回転＆見下ろし角度変更
    var midX = (t0.clientX + t1.clientX) / 2;
    var midY = (t0.clientY + t1.clientY) / 2;
    cam.ang += (midX - prevPinchMidX) * 0.008;
    cam.pitch = Math.max(0.25, Math.min(0.95, cam.pitch + (midY - prevPinchMidY) * 0.003));
    prevPinchMidX = midX;
    prevPinchMidY = midY;
  }
}, { passive: false });

c.addEventListener('touchend', function(e) {
  if (e.touches.length < 2) {
    isPinching = false;
    pinchStartDist = 0;
  }
});