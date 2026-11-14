// ==========================================
// Web Audio API を使った効果音ジェネレーター
// ==========================================
var audioCtx = null;
var lastSoundTime = 0;

function initAudio() {
  if (!audioCtx) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// ポリンとぶつかったときの「ぽよん♪」音
function playPoyonSound() {
  initAudio();
  var now = audioCtx.currentTime;
  if (now - lastSoundTime < 0.12) return; // 連続鳴りすぎ防止
  lastSoundTime = now;

  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.18);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}