var isLeftDown = false, isRightDown = false, isMinimapDrag = false;
var prevX = 0, prevY = 0, lastMouseX = 0, lastMouseY = 0;
var keys = new Set();

// スマホ用 2本指ジェスチャー管理変数
var isPinching = false;
var pinchStartDist = 0;
var pinchStartSize = 48;
var prevPinchMidX = 0;
var prevPinchMidY = 0;

// ポリン ダブルクリック（ダブルタップ）追尾用管理変数
var lastTapTime = 0;
var lastTapMob = null;
var lastTapX = 0;
var lastTapY = 0;

// 指定したスクリーン座標付近にいるポリン（Mob）を探す共通関数
function findMobAtScreen(sx, sy) {
  return Array.from(mobs.items.values()).find(function(m) {
    var s = toS(m.x, m.y);
    return Math.hypot(sx - s.x, sy - (s.y - 10)) < 30;
  });
}

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
// 1. ポインター操作（PCマウス ＋ スマホ1本指タップ移動・ダブルタップ追尾）
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
      lastTapMob = null;
      p.tx = miniPos.x; p.ty = miniPos.y;
      return;
    }

    // 2. ロングウォールの上面（天板）クリック判定
    var clickedWall = Array.from(obstacles.items.values()).find(function(o) {
      return typeof o.isTopClicked === 'function' && o.isTopClicked(e.clientX, e.clientY);
    });
    if (clickedWall) {
      lastTapMob = null;
      openWallModal(clickedWall);
      return;
    }

    // 3. Shift + 左クリックでポリン追尾（PC用ショートカット維持）
    if (e.shiftKey) {
      var hitShift = findMobAtScreen(e.clientX, e.clientY);
      if (hitShift) { p.followMob = hitShift; return; }
    }

    // 4. ポリンのダブルクリック（ダブルタップ）判定
    var now = Date.now();
    var hitMob = findMobAtScreen(e.clientX, e.clientY);
    if (hitMob && hitMob === lastTapMob && (now - lastTapTime) < 350 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 36) {
      p.followMob = hitMob;
      isLeftDown = false;
      lastTapTime = 0;
      lastTapMob = null;
      if (typeof addChatLog === 'function') {
        addChatLog('【システム】' + hitMob.name + ' の追尾を開始しました。', 'sys');
      }
      return;
    }

    // 1回目のタップ情報を記録
    lastTapTime = now;
    lastTapMob = hitMob || null;
    lastTapX = e.clientX;
    lastTapY = e.clientY;

    // 5. 通常の左クリック（移動開始）
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

c.onpointercancel = function() {
  isLeftDown = false;
  isRightDown = false;
  isMinimapDrag = false;
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
    lastTapMob = null;

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