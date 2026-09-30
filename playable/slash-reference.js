'use strict';
const referenceVideo = document.getElementById('referenceVideo');
const referenceFile = document.getElementById('referenceFile');
const referenceStatus = document.getElementById('referenceStatus');
const syncReference = document.getElementById('syncReference');
const markStart = document.getElementById('markStart');
const markEnd = document.getElementById('markEnd');
let referenceUrl = null, referenceStart = 0, referenceEnd = 0;
function describeReference() {
  const valid = referenceEnd > referenceStart;
  syncReference.disabled = !valid;
  if (!valid) syncReference.checked = false;
  referenceStatus.textContent = `構え ${referenceStart.toFixed(3)}秒 → 振り抜き ${referenceEnd.toFixed(3)}秒` + (valid ? '' : '：振り抜きを構えより後に設定してください');
}
referenceFile.onchange = () => {
  syncReference.checked = false;
  syncReference.disabled = markStart.disabled = markEnd.disabled = true;
  referenceVideo.pause();
  referenceVideo.removeAttribute('src');
  if (referenceUrl) URL.revokeObjectURL(referenceUrl);
  referenceUrl = null;
  const file = referenceFile.files[0];
  referenceVideo.hidden = !file;
  if (!file) { referenceStatus.textContent = '動画未選択'; return; }
  referenceStatus.textContent = '動画を読み込み中';
  referenceUrl = URL.createObjectURL(file);
  referenceVideo.src = referenceUrl;
};
referenceVideo.onloadedmetadata = () => {
  if (!Number.isFinite(referenceVideo.duration) || referenceVideo.duration <= 0) {
    referenceStatus.textContent = '長さを取得できる動画を選んでください'; return;
  }
  referenceStart = 0; referenceEnd = referenceVideo.duration;
  markStart.disabled = markEnd.disabled = false;
  describeReference();
};
referenceVideo.onerror = () => {
  syncReference.checked = false;
  syncReference.disabled = markStart.disabled = markEnd.disabled = true;
  referenceStatus.textContent = 'この動画は再生できません。別の形式の動画を選んでください';
};
markStart.onclick = () => { referenceStart = referenceVideo.currentTime; describeReference(); };
markEnd.onclick = () => { referenceEnd = referenceVideo.currentTime; describeReference(); };
syncReference.onchange = () => { if (syncReference.checked) referenceVideo.pause(); };
referenceVideo.onplay = () => { syncReference.checked = false; };
function updateReference() {
  if (!syncReference.checked || referenceVideo.readyState < 2 || referenceVideo.seeking) return;
  const fraction = Math.max(0, Math.min(1, (p - .16) / (.72 - .16)));
  const target = referenceStart + fraction * (referenceEnd - referenceStart);
  if (Math.abs(referenceVideo.currentTime - target) > .015) referenceVideo.currentTime = target;
}
