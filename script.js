const audio = document.getElementById('audio');
const filePicker = document.getElementById('filePicker');
const playlistEl = document.getElementById('playlist');
const emptyState = document.getElementById('emptyState');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const playBtn = document.getElementById('playBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const volumeBar = document.getElementById('volumeBar');
const volumeValue = document.getElementById('volumeValue');
const clearBtn = document.getElementById('clearBtn');

let tracks = [];
let currentIndex = -1;
let shuffle = false;
let repeat = false;
let objectUrls = [];

audio.volume = Number(volumeBar.value);

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
function cleanName(filename) {
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || filename;
}
function addFiles(files) {
  const accepted = [...files].filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|opus|flac|weba|webm)$/i.test(file.name));
  accepted.forEach(file => {
    const url = URL.createObjectURL(file);
    objectUrls.push(url);
    tracks.push({ file, url, title: cleanName(file.name), duration: 0 });
  });
  renderPlaylist();
  if (currentIndex === -1 && tracks.length) loadTrack(0, false);
  filePicker.value = '';
}
function loadTrack(index, autoplay = true) {
  if (!tracks.length) return;
  currentIndex = (index + tracks.length) % tracks.length;
  const track = tracks[currentIndex];
  audio.src = track.url;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.file.name;
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '…';
  seekBar.value = 0;
  playBtn.textContent = autoplay ? 'Ⅱ' : '▶';
  playBtn.setAttribute('aria-label', autoplay ? 'Pause' : 'Play');
  renderPlaylist();
  if (autoplay) audio.play().catch(() => {
    playBtn.textContent = '▶';
    playBtn.setAttribute('aria-label', 'Play');
  });
}
function togglePlay() {
  if (currentIndex === -1) {
    if (tracks.length) loadTrack(0, true);
    else filePicker.click();
    return;
  }
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}
function nextTrack() {
  if (!tracks.length) return;
  if (shuffle && tracks.length > 1) {
    let next = currentIndex;
    while (next === currentIndex) next = Math.floor(Math.random() * tracks.length);
    loadTrack(next, true);
  } else {
    loadTrack((currentIndex + 1) % tracks.length, true);
  }
}
function previousTrack() {
  if (!tracks.length) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  loadTrack((currentIndex - 1 + tracks.length) % tracks.length, true);
}
function renderPlaylist() {
  playlistEl.innerHTML = '';
  emptyState.hidden = tracks.length > 0;
  tracks.forEach((track, index) => {
    const li = document.createElement('li');
    li.className = `track-row${index === currentIndex ? ' current' : ''}`;
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `Play ${track.title}`);
    const number = document.createElement('span');
    number.className = 'track-number';
    number.textContent = index === currentIndex && !audio.paused ? '♫' : String(index + 1).padStart(2, '0');
    const copy = document.createElement('div');
    copy.className = 'track-copy';
    const name = document.createElement('div');
    name.className = 'track-name';
    name.textContent = track.title;
    const meta = document.createElement('div');
    meta.className = 'track-meta';
    meta.textContent = track.file.name;
    copy.append(name, meta);
    const duration = document.createElement('span');
    duration.className = 'track-duration';
    duration.textContent = formatTime(track.duration);
    const remove = document.createElement('button');
    remove.className = 'remove-track';
    remove.type = 'button';
    remove.title = 'Remove song';
    remove.setAttribute('aria-label', `Remove ${track.title}`);
    remove.textContent = '×';
    remove.addEventListener('click', event => {
      event.stopPropagation();
      removeTrack(index);
    });
    li.append(number, copy, duration, remove);
    li.addEventListener('click', () => loadTrack(index, true));
    li.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        loadTrack(index, true);
      }
    });
    playlistEl.appendChild(li);
  });
}
function removeTrack(index) {
  const removed = tracks[index];
  if (!removed) return;
  const wasCurrent = index === currentIndex;
  tracks.splice(index, 1);
  if (wasCurrent) {
    audio.pause();
    audio.removeAttribute('src');
    currentIndex = -1;
    if (tracks.length) loadTrack(Math.min(index, tracks.length - 1), false);
    else {
      trackTitle.textContent = 'Choose a song';
      trackArtist.textContent = 'Your playlist is waiting';
      playBtn.textContent = '▶';
      seekBar.value = 0;
      currentTimeEl.textContent = '0:00';
      durationEl.textContent = '0:00';
    }
  } else if (index < currentIndex) {
    currentIndex--;
  }
  URL.revokeObjectURL(removed.url);
  objectUrls = objectUrls.filter(url => url !== removed.url);
  renderPlaylist();
}
filePicker.addEventListener('change', event => addFiles(event.target.files));
playBtn.addEventListener('click', togglePlay);
document.getElementById('prevBtn').addEventListener('click', previousTrack);
document.getElementById('nextBtn').addEventListener('click', nextTrack);
shuffleBtn.addEventListener('click', () => {
  shuffle = !shuffle;
  shuffleBtn.classList.toggle('active', shuffle);
  shuffleBtn.setAttribute('aria-pressed', String(shuffle));
});
repeatBtn.addEventListener('click', () => {
  repeat = !repeat;
  repeatBtn.classList.toggle('active', repeat);
  repeatBtn.setAttribute('aria-pressed', String(repeat));
});
volumeBar.addEventListener('input', () => {
  audio.volume = Number(volumeBar.value);
  volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
});
seekBar.addEventListener('input', () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (Number(seekBar.value) / 1000) * audio.duration;
  }
});
audio.addEventListener('loadedmetadata', () => {
  if (currentIndex >= 0 && tracks[currentIndex]) {
    tracks[currentIndex].duration = audio.duration;
    durationEl.textContent = formatTime(audio.duration);
    renderPlaylist();
  }
});
audio.addEventListener('timeupdate', () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  seekBar.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
});
audio.addEventListener('play', () => {
  playBtn.textContent = 'Ⅱ';
  playBtn.setAttribute('aria-label', 'Pause');
  renderPlaylist();
});
audio.addEventListener('pause', () => {
  playBtn.textContent = '▶';
  playBtn.setAttribute('aria-label', 'Play');
  renderPlaylist();
});
audio.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else if (currentIndex < tracks.length - 1 || shuffle) {
    nextTrack();
  } else {
    audio.currentTime = 0;
    playBtn.textContent = '▶';
    renderPlaylist();
  }
});
clearBtn.addEventListener('click', () => {
  audio.pause();
  audio.removeAttribute('src');
  tracks = [];
  currentIndex = -1;
  objectUrls.forEach(URL.revokeObjectURL);
  objectUrls = [];
  trackTitle.textContent = 'Choose a song';
  trackArtist.textContent = 'Your playlist is waiting';
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '0:00';
  seekBar.value = 0;
  playBtn.textContent = '▶';
  renderPlaylist();
});
window.addEventListener('beforeunload', () => objectUrls.forEach(URL.revokeObjectURL));
