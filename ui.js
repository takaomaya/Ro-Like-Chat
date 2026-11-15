var inp = document.getElementById('in');
var btn = document.getElementById('btn');
var saveBtn = document.getElementById('save-btn');
var photoBtn = document.getElementById('photo-btn');
var fsBtn = document.getElementById('fullscreen-btn');
var emoBtn = document.getElementById('emo-btn');
var emoPanel = document.getElementById('emo-panel');
var chatContainer = document.getElementById('chat-container');
var chatLog = document.getElementById('chat-log');

var fullChatHistory = [];

chatLog.addEventListener('wheel', function(e) {
  e.stopPropagation();
});

function addChatLog(text, type) {
  if (!chatLog) return;

  var now = new Date();
  var timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(function(n) { return String(n).padStart(2, '0'); })
    .join(':');
  fullChatHistory.push('[' + timeStr + '] ' + text);

  var line = document.createElement('div');
  line.className = 'log-line log-' + (type || 'self');
  line.textContent = text;
  chatLog.appendChild(line);

  while (chatLog.children.length > 100) {
    chatLog.removeChild(chatLog.firstChild);
  }
  chatLog.scrollTop = chatLog.scrollHeight;
}

function saveChatLogFile() {
  if (fullChatHistory.length === 0) return;

  var content = fullChatHistory.join('\r\n');
  var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);

  var now = new Date();
  var stamp = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  var a = document.createElement('a');
  a.href = url;
  a.download = 'chatlog_' + stamp + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  addChatLog('【システム】チャットログを保存しました (' + a.download + ')', 'sys');
  saveBtn.blur();
}

saveBtn.onclick = saveChatLogFile;

addChatLog('【システム】ようこそ！頭に＠を付けて発言するとクリックするまで表示が残ります。', 'sys');

photoBtn.onclick = function() {
  isPhotoMode = !isPhotoMode;
  photoBtn.textContent = isPhotoMode ? 'フォトモード: ON' : 'フォトモード: OFF';
  photoBtn.classList.toggle('active', isPhotoMode);
  chatContainer.style.display = isPhotoMode ? 'none' : 'flex';

  if (fsBtn && document.documentElement.requestFullscreen) {
    fsBtn.style.display = isPhotoMode ? 'none' : 'block';
  }
  if (emoBtn) {
    emoBtn.style.display = isPhotoMode ? 'none' : 'block';
  }
  if (emoPanel && isPhotoMode) {
    emoPanel.classList.add('hidden');
    if (emoBtn) emoBtn.classList.remove('active');
  }
  photoBtn.blur();
};

// ==========================================
// 全画面（フルスクリーン）表示の切り替え制御
// ==========================================
var hasFullscreenSupport = !!(fsBtn && document.documentElement.requestFullscreen);
if (fsBtn) {
  if (!hasFullscreenSupport) {
    fsBtn.style.display = 'none';
    // 全画面ボタンがない環境ではエモーションボタンの位置を上に詰める
    if (emoBtn) emoBtn.style.top = '48px';
    if (emoPanel) emoPanel.style.top = '88px';
  }

  fsBtn.onclick = function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function() {});
    } else {
      document.exitFullscreen();
    }
    fsBtn.blur();
  };

  document.addEventListener('fullscreenchange', function() {
    var isFs = !!document.fullscreenElement;
    fsBtn.textContent = isFs ? '全画面解除' : '全画面';
    fsBtn.classList.toggle('active', isFs);
  });
}

// ==========================================
// エモーション開閉パレットの生成と制御
// ==========================================
if (emoBtn && emoPanel && typeof EMO !== 'undefined') {
  EMO.forEach(function(val, key) {
    var itemBtn = document.createElement('button');
    itemBtn.className = 'emo-item';
    itemBtn.textContent = val.text;
    itemBtn.style.color = val.colHex;
    itemBtn.title = val.cmd + ' (Ctrl+' + key + ')';

    itemBtn.onclick = function() {
      p.emotion(key);
      emoPanel.classList.add('hidden');
      emoBtn.classList.remove('active');
      itemBtn.blur();
    };
    emoPanel.appendChild(itemBtn);
  });

  emoBtn.onclick = function() {
    var isHidden = emoPanel.classList.toggle('hidden');
    emoBtn.classList.toggle('active', !isHidden);
    emoBtn.blur();
  };
}

function setEmo(k) {
  p.emotion(k);
}

function sendChat() {
  var t = inp.value.trim();
  if (t) {
    var hitKey = null;
    EMO.forEach(function(val, key) { if (val.cmd === t.toLowerCase()) hitKey = key; });
    if (hitKey) {
      p.emotion(hitKey);
    } else if (t.startsWith('@') || t.startsWith('＠')) {
      var body = t.slice(1).trim();
      if (body) {
        p.say(body, 300, true);
        addChatLog(p.name + ' : ' + body, 'self');
      }
    } else {
      p.say(t, 300, false);
      addChatLog(p.name + ' : ' + t, 'self');
    }
    inp.value = '';
  }
  inp.blur();
}
btn.onclick = sendChat;

// ==========================================
// ロングウォール上面クリック時のミニウィンドウ制御
// ==========================================
var wallModal = document.getElementById('wall-modal');
var wallModalHeader = document.getElementById('wall-modal-header');
var wallModalTitle = document.getElementById('wall-modal-title');
var wallModalBody = document.getElementById('wall-modal-body');
var wallModalClose = document.getElementById('wall-modal-close');
var isModalCentered = false;

function openWallModal(wall) {
  if (!wallModal) return;

  if (wall.modalTitle !== null || wall.modalHtml !== null) {
    wallModalTitle.textContent = wall.modalTitle || ('ID: ' + wall.key);
    wallModalBody.innerHTML = wall.modalHtml || '';
  } else {
    var dirNames = ['北向き (0)', '東向き (1)', '南向き (2)', '西向き (3)'];
    wallModalTitle.textContent = 'ID: ' + wall.key;
    wallModalBody.innerHTML =
      '中心座標: (' + wall.x + ', ' + wall.y + ')<br>' +
      '向き: ' + dirNames.at(wall.dir) + '<br>' +
      'サイズ: ' + wall.w + ' × ' + wall.d + ' マス';
  }

  wallModal.classList.remove('hidden');

  if (!isModalCentered) {
    wallModal.style.left = Math.max(12, (window.innerWidth - wallModal.offsetWidth) / 2) + 'px';
    isModalCentered = true;
  }
}

function closeWallModal() {
  if (wallModal) wallModal.classList.add('hidden');
}

if (wallModalClose) {
  wallModalClose.onclick = closeWallModal;
}

if (wallModalHeader && wallModal) {
  var isModalDragging = false;
  var modalOffsetX = 0;
  var modalOffsetY = 0;

  wallModalHeader.onpointerdown = function(e) {
    if (e.target === wallModalClose) return;
    isModalDragging = true;
    var rect = wallModal.getBoundingClientRect();
    modalOffsetX = e.clientX - rect.left;
    modalOffsetY = e.clientY - rect.top;
    wallModalHeader.setPointerCapture(e.pointerId);
  };

  wallModalHeader.onpointermove = function(e) {
    if (!isModalDragging) return;
    var maxX = window.innerWidth - wallModal.offsetWidth;
    var maxY = window.innerHeight - wallModal.offsetHeight;
    var nextX = Math.max(0, Math.min(maxX, e.clientX - modalOffsetX));
    var nextY = Math.max(0, Math.min(maxY, e.clientY - modalOffsetY));
    wallModal.style.left = nextX + 'px';
    wallModal.style.top = nextY + 'px';
  };

  wallModalHeader.onpointerup = function(e) {
    if (isModalDragging) {
      isModalDragging = false;
      wallModalHeader.releasePointerCapture(e.pointerId);
    }
  };
}