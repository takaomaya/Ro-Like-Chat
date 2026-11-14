var playerSprite = {
  img: new Image(),
  loaded: false,
  facingBack: false,
  facingRight: false
};

function updatePlayerDirection(dx, dy) {
  if (Math.hypot(dx, dy) < 0.01) return;
  var screenDx = dx * Math.cos(cam.ang) - dy * Math.sin(cam.ang);
  var screenDy = dx * Math.sin(cam.ang) + dy * Math.cos(cam.ang);
  playerSprite.facingBack = screenDy < 0;
  if (Math.abs(screenDx) > 0.005) playerSprite.facingRight = screenDx > 0;
}

function drawPlayer(s, sc) {
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(s.x, s.y, 16 * sc, 16 * sc * cam.pitch, 0, 0, 7); ctx.fill();

  if (!playerSprite.loaded) {
    ctx.fillStyle = '#3b6ea5'; ctx.fillRect(s.x - 10 * sc, s.y - 36 * sc, 20 * sc, 24 * sc);
  } else {
    var col = 1;
    if (p.mv) {
      var step = Math.floor(p.f / 7) % 4;
      col = (step === 0) ? 0 : (step === 2 ? 2 : 1);
    }
    var row = (!playerSprite.facingBack && playerSprite.facingRight) ? 0 :
              (playerSprite.facingBack && !playerSprite.facingRight) ? 1 :
              (!playerSprite.facingBack && !playerSprite.facingRight) ? 2 : 3;

    var cellW = playerSprite.img.width / 3, cellH = playerSprite.img.height / 4;
    var drawW = 58 * sc, drawH = drawW * (cellH / cellW);
    ctx.drawImage(playerSprite.img, col * cellW, row * cellH, cellW, cellH, s.x - drawW / 2, s.y + 4 * sc - drawH, drawW, drawH);
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. 名前はフォトモードOFFのときだけ表示
  if (!isPhotoMode) {
    ctx.font = 'bold 12px sans-serif';
    var nameY = s.y - 62 * sc;
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.strokeText(p.name, s.x, nameY);
    ctx.fillStyle = '#ffffff'; ctx.fillText(p.name, s.x, nameY);
  }

  // 2. チャット吹き出し（発言）はフォトモード中でも表示
  if (p.mTime > 0) {
    ctx.font = 'bold 13px sans-serif';
    var w = ctx.measureText(p.msg).width + 16;
    var msgY = s.y - (isPhotoMode ? 66 : 84) * sc;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(s.x - w / 2, msgY - 12, w, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p.msg, s.x, msgY);
  }
  ctx.restore();

  // 3. エモーション表示
  if (p.eTime > 0) {
    var emoY = s.y - (isPhotoMode ? 70 : 88) * sc - (p.mTime > 0 ? 30 : 0);
    drawEmotionBubble(s.x, emoY, p.emoData, p.eTime);
  }
}