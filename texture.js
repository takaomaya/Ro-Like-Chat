var obsTextures = new Map();

function getObstacleTexture(src) {
  var path = 'image/' + src;
  if (obsTextures.has(path)) return obsTextures.get(path);
  var entry = { img: new Image(), loaded: false };
  entry.img.onload = function() { entry.loaded = true; };
  entry.img.src = path;
  obsTextures.set(path, entry);
  return entry;
}

function drawTexturedQuad(tex, p0, p1, p2, p3, shadeAlpha) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
  ctx.closePath();

  if (tex && tex.loaded) {
    ctx.clip();
    var w = tex.img.width, h = tex.img.height;
    var a = (p1.x - p0.x) / w, b = (p1.y - p0.y) / w, c = (p3.x - p0.x) / h, d = (p3.y - p0.y) / h;
    ctx.transform(a, b, c, d, p0.x, p0.y);
    ctx.drawImage(tex.img, 0, 0);
    if (shadeAlpha > 0) { ctx.fillStyle = 'rgba(0, 0, 0, ' + shadeAlpha + ')'; ctx.fillRect(0, 0, w, h); }
  } else {
    ctx.fillStyle = shadeAlpha > 0.2 ? '#445566' : (shadeAlpha > 0 ? '#556677' : '#778899');
    ctx.fill();
  }
  ctx.restore();
}

function lerpPt(a, b, ratio) {
  return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
}