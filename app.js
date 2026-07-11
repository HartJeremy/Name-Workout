const STORAGE_KEY = 'nameWorkoutExercises';

// Source: "The Name Workout Challenge" poster. amount/unit is the base rep or
// second count; "each" describes how the (X each side/leg) note is derived:
//   'split'   -> note shows half of amount, e.g. 10 total -> "(5 each leg)"
//   'perSide' -> amount IS the per-side count, note just labels it
//   null      -> no note
const DEFAULT_EXERCISES = {
  A: { amount: 5,  unit: 'reps', name: 'Burpees' },
  B: { amount: 10, unit: 'reps', name: 'Crunches' },
  C: { amount: 10, unit: 'reps', name: 'Squats' },
  D: { amount: 30, unit: 'sec',  name: 'Bridge' },
  E: { amount: 10, unit: 'reps', name: 'Squats' },
  F: { amount: 30, unit: 'sec',  name: 'Plank' },
  G: { amount: 10, unit: 'reps', name: 'Lunges', each: 'split', eachLabel: 'leg' },
  H: { amount: 10, unit: 'reps', name: 'Leg Raises' },
  I: { amount: 10, unit: 'reps', name: 'Side Lunges', each: 'split', eachLabel: 'side' },
  J: { amount: 15, unit: 'reps', name: 'Bicycle Crunches' },
  K: { amount: 10, unit: 'reps', name: 'Reverse Lunges', each: 'split', eachLabel: 'leg' },
  L: { amount: 10, unit: 'reps', name: 'Toe Touches' },
  M: { amount: 10, unit: 'reps', name: 'Single-Leg Squats', each: 'split', eachLabel: 'leg' },
  N: { amount: 10, unit: 'reps', name: 'Bent-Leg Jackknives' },
  O: { amount: 20, unit: 'reps', name: 'Jumping Jacks' },
  P: { amount: 20, unit: 'reps', name: 'Cross-Country Skiers' },
  Q: { amount: 20, unit: 'reps', name: 'Scissor Kicks' },
  R: { amount: 20, unit: 'reps', name: 'Mountain Climbers' },
  S: { amount: 20, unit: 'reps', name: 'High Knees' },
  T: { amount: 20, unit: 'reps', name: 'Mountain Climbers' },
  U: { amount: 15, unit: 'reps', name: 'Clamshells', each: 'perSide', eachLabel: 'side' },
  V: { amount: 15, unit: 'reps', name: 'Side Leg Lifts', each: 'perSide', eachLabel: 'side' },
  W: { amount: 15, unit: 'reps', name: 'Glute Leg Lifts' },
  X: { amount: 15, unit: 'reps', name: 'Superman Lifts' },
  Y: { amount: 15, unit: 'reps', name: 'Supermans' },
  Z: { amount: 15, unit: 'reps', name: 'Donkey Kicks', each: 'perSide', eachLabel: 'leg' }
};

const words = [
  'dragon','burpee','squat','plank','sweat','chaos','strong','lunge','rocket','winner',
  'runner','coffee','theatre','fitness','goblin','cardio','grit','power','focus','stride',
  'pickle','wizard','sunrise','beast','engine','spark','tempo','quest','motion','active'
];

const $ = id => document.getElementById(id);
let mode = 'letters';
let deferredPrompt;
let exercises = loadExercises();
let intensity = 1;
let lastDraw = '';
let lastRawLetters = '';
let lastWorkout = [];

function loadExercises() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') {
      const merged = {};
      Object.keys(DEFAULT_EXERCISES).forEach(letter => {
        merged[letter] = { ...DEFAULT_EXERCISES[letter], ...(saved[letter] || {}) };
      });
      return merged;
    }
  } catch (e) { /* fall through to defaults */ }
  return JSON.parse(JSON.stringify(DEFAULT_EXERCISES));
}

function saveExercises() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
}

function resetExercises() {
  exercises = JSON.parse(JSON.stringify(DEFAULT_EXERCISES));
  saveExercises();
  renderEditor();
  if (lastRawLetters) applyDraw(lastRawLetters);
}

function setMode(next) {
  mode = next;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.querySelectorAll('.input-panel').forEach(p => p.classList.remove('active'));
  $(`${mode}Panel`).classList.add('active');
}

function formatLetters(str) {
  if ($('lowerCase').checked && !$('upperCase').checked) return str.toLowerCase();
  return str.toUpperCase();
}

function randomLetters(count, allowDuplicates) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const out = [];
  for (let i = 0; i < count; i++) {
    if (!allowDuplicates && alphabet.length === 0) break;
    const source = allowDuplicates ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') : alphabet;
    const index = Math.floor(Math.random() * source.length);
    out.push(source[index]);
    if (!allowDuplicates) alphabet.splice(index, 1);
  }
  return out.join('');
}

function randomWord(maxLength, allowDuplicates) {
  const candidates = words.filter(w => w.length <= maxLength && (allowDuplicates || new Set(w).size === w.length));
  if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  return randomLetters(maxLength, allowDuplicates);
}

function getDraw() {
  const allowDuplicates = $('allowDuplicates').checked;
  if (mode === 'custom') return $('customText').value || 'Jeremy Hart';
  if (mode === 'word') return randomWord(Number($('maxWordLength').value || 8), allowDuplicates);
  return randomLetters(Number($('letterCount').value || 8), allowDuplicates);
}

// Scales an entry's amount by the intensity multiplier and formats display text.
function formatExercise(entry, multiplier) {
  let amount;
  if (entry.unit === 'sec') {
    amount = Math.max(5, Math.round((entry.amount * multiplier) / 5) * 5);
  } else {
    amount = Math.max(1, Math.round(entry.amount * multiplier));
  }

  let main = entry.unit === 'sec' ? `${entry.name} \u2013 ${amount} sec` : `${amount} ${entry.name}`;
  let note = '';
  if (entry.each === 'split') {
    const half = Math.max(1, Math.round(amount / 2));
    note = ` (${half} each ${entry.eachLabel})`;
  } else if (entry.each === 'perSide') {
    note = ` (each ${entry.eachLabel})`;
  }
  return { text: main + note, amount };
}

function buildWorkout(raw) {
  const letters = raw.toUpperCase().replace(/[^A-Z]/g, '').split('');
  return letters
    .map(letter => {
      const entry = exercises[letter];
      if (!entry) return null;
      const formatted = formatExercise(entry, intensity);
      return {
        letter,
        exercise: formatted.text,
        name: entry.name,
        unit: entry.unit,
        amount: formatted.amount,
        each: entry.each,
        eachLabel: entry.eachLabel
      };
    })
    .filter(Boolean);
}

function applyDraw(raw) {
  const workout = buildWorkout(raw);
  const display = formatLetters(raw.replace(/[^A-Za-z]/g, '')) || 'No letters found';
  lastDraw = display;
  lastRawLetters = raw;
  lastWorkout = workout;
  $('drawText').textContent = display;
  $('summary').textContent = `${workout.length} move${workout.length === 1 ? '' : 's'}`;
  $('heroCount').textContent = workout.length;
  $('emptyState').classList.toggle('hidden', workout.length > 0);
  $('exerciseList').innerHTML = workout.map((x, index) => `<li><span class="letter-badge">${x.letter}</span><span><span class="move-name">${x.exercise}</span><span class="move-meta">Round ${index + 1}</span></span></li>`).join('');

  // Group by exercise name/unit/split-style and SUM the actual reps or seconds,
  // instead of showing "2x 20 Burpees" show the real total "40 Burpees".
  const totalsMap = workout.reduce((acc, x) => {
    const key = `${x.name}|${x.unit}|${x.each || ''}|${x.eachLabel || ''}`;
    if (!acc[key]) acc[key] = { name: x.name, unit: x.unit, each: x.each, eachLabel: x.eachLabel, sum: 0 };
    acc[key].sum += x.amount;
    return acc;
  }, {});

  $('totals').innerHTML = Object.values(totalsMap).map(t => {
    let label;
    if (t.unit === 'sec') {
      label = `${t.sum} sec ${t.name}`;
    } else {
      let note = '';
      if (t.each === 'split') note = ` (${Math.max(1, Math.round(t.sum / 2))} each ${t.eachLabel})`;
      else if (t.each === 'perSide') note = ` (each ${t.eachLabel})`;
      label = `${t.sum} ${t.name}${note}`;
    }
    return `<div class="total"><b>${label}</b></div>`;
  }).join('');
}

function render() {
  applyDraw(getDraw());
}

function copyWorkout() {
  const lines = [
    lastDraw || $('drawText').textContent,
    '',
    ...lastWorkout.map((x, i) => `${i + 1}. ${x.letter}: ${x.exercise}`)
  ];
  navigator.clipboard?.writeText(lines.join('\n'));
}

function reset() {
  lastDraw = '';
  lastRawLetters = '';
  lastWorkout = [];
  $('drawText').textContent = 'Ready';
  $('summary').textContent = '0 moves';
  $('heroCount').textContent = '0';
  $('emptyState').classList.remove('hidden');
  $('exerciseList').innerHTML = '';
  $('totals').innerHTML = '';
}

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
$('generateBtn').addEventListener('click', render);
$('copyBtn').addEventListener('click', copyWorkout);
$('resetBtn').addEventListener('click', reset);
$('upperCase').addEventListener('change', () => { if ($('upperCase').checked) $('lowerCase').checked = false; });
$('lowerCase').addEventListener('change', () => { if ($('lowerCase').checked) $('upperCase').checked = false; });

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  $('installBtn').classList.remove('hidden');
});
$('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt = null;
  $('installBtn').classList.add('hidden');
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

function syncPair(rangeId, numberId) {
  const range = $(rangeId);
  const number = $(numberId);
  const sync = source => {
    const min = Number(source.min);
    const max = Number(source.max);
    const value = Math.min(max, Math.max(min, Number(source.value || min)));
    range.value = value;
    number.value = value;
  };
  range.addEventListener('input', () => sync(range));
  number.addEventListener('input', () => sync(number));
}
syncPair('letterCount', 'letterCountNumber');
syncPair('maxWordLength', 'maxWordLengthNumber');

// ---- Intensity slider ----
function updateIntensityLabel() {
  const clean = intensity.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  $('intensityLabel').textContent = `${clean}x`;
}
$('intensitySlider').addEventListener('input', e => {
  intensity = Number(e.target.value);
  updateIntensityLabel();
  if (lastRawLetters) applyDraw(lastRawLetters);
});
intensity = Number($('intensitySlider').value);
updateIntensityLabel();

// ---- Exercise editor ----
const UNIT_OPTIONS = ['reps', 'sec'];
const EACH_OPTIONS = [
  { value: '', label: 'No split' },
  { value: 'split', label: 'Split (half each)' },
  { value: 'perSide', label: 'Per side (as listed)' }
];

function renderEditor() {
  const grid = $('editorGrid');
  grid.innerHTML = Object.keys(exercises).map(letter => {
    const e = exercises[letter];
    const unitOpts = UNIT_OPTIONS.map(u => `<option value="${u}" ${e.unit === u ? 'selected' : ''}>${u}</option>`).join('');
    const eachOpts = EACH_OPTIONS.map(o => `<option value="${o.value}" ${(e.each || '') === o.value ? 'selected' : ''}>${o.label}</option>`).join('');
    return `
      <div class="editor-row" data-letter="${letter}">
        <span class="editor-letter">${letter}</span>
        <input class="number-box editor-amount" type="number" min="1" value="${e.amount}" aria-label="${letter} amount" />
        <select class="editor-unit" aria-label="${letter} unit">${unitOpts}</select>
        <input class="text-box editor-name" type="text" value="${e.name}" aria-label="${letter} exercise name" />
        <select class="editor-each" aria-label="${letter} split style">${eachOpts}</select>
        <input class="text-box editor-eachlabel" type="text" placeholder="leg / side" value="${e.eachLabel || ''}" aria-label="${letter} split label" ${e.each ? '' : 'disabled'} />
      </div>`;
  }).join('');

  grid.querySelectorAll('.editor-row').forEach(row => {
    const letter = row.dataset.letter;
    const amountEl = row.querySelector('.editor-amount');
    const unitEl = row.querySelector('.editor-unit');
    const nameEl = row.querySelector('.editor-name');
    const eachEl = row.querySelector('.editor-each');
    const eachLabelEl = row.querySelector('.editor-eachlabel');

    const commit = () => {
      exercises[letter] = {
        amount: Math.max(1, Number(amountEl.value) || 1),
        unit: unitEl.value,
        name: nameEl.value.trim() || exercises[letter].name,
        each: eachEl.value || undefined,
        eachLabel: eachLabelEl.value.trim() || undefined
      };
      eachLabelEl.disabled = !eachEl.value;
      saveExercises();
      if (lastRawLetters) applyDraw(lastRawLetters);
    };

    amountEl.addEventListener('change', commit);
    unitEl.addEventListener('change', commit);
    nameEl.addEventListener('change', commit);
    eachEl.addEventListener('change', commit);
    eachLabelEl.addEventListener('change', commit);
  });
}

$('resetExercisesBtn').addEventListener('click', () => {
  if (confirm('Reset all exercises back to the original Name Workout Challenge list?')) resetExercises();
});

$('exportExercisesBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(exercises, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'name-workout-exercises.json';
  a.click();
  URL.revokeObjectURL(url);
});

$('importExercisesInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    Object.keys(DEFAULT_EXERCISES).forEach(letter => {
      if (parsed[letter]) exercises[letter] = { ...exercises[letter], ...parsed[letter] };
    });
    saveExercises();
    renderEditor();
    if (lastRawLetters) applyDraw(lastRawLetters);
  } catch (err) {
    alert('Could not read that file as exercise JSON.');
  }
  e.target.value = '';
});

renderEditor();

// ---- Notifications ----
const NOTIF_SETTINGS_KEY = 'nameWorkoutNotifSettings';

function loadNotifSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIF_SETTINGS_KEY));
    return saved && typeof saved === 'object'
      ? { dailyEnabled: false, dailyTime: '08:00', lastNotifiedDay: null, ...saved }
      : { dailyEnabled: false, dailyTime: '08:00', lastNotifiedDay: null };
  } catch (e) {
    return { dailyEnabled: false, dailyTime: '08:00', lastNotifiedDay: null };
  }
}
function saveNotifSettings(settings) {
  localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
}
let notifSettings = loadNotifSettings();

function updateNotifUI() {
  const status = $('notifStatus');
  const supported = 'Notification' in window;
  if (!supported) {
    status.textContent = 'Not supported on this browser';
    status.className = 'chip denied';
    $('enableNotifBtn').disabled = true;
    return;
  }
  if (Notification.permission === 'granted') {
    status.textContent = 'Enabled';
    status.className = 'chip granted';
  } else if (Notification.permission === 'denied') {
    status.textContent = 'Blocked \u2014 enable in browser settings';
    status.className = 'chip denied';
  } else {
    status.textContent = 'Not enabled';
    status.className = 'chip';
  }
}

function fireNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) reg.showNotification(title, { body, icon: 'icon.svg', badge: 'icon.svg' });
      else new Notification(title, { body, icon: 'icon.svg' });
    });
  } else {
    new Notification(title, { body, icon: 'icon.svg' });
  }
}

function checkNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  // General daily reminder
  if (notifSettings.dailyEnabled) {
    const [h, m] = (notifSettings.dailyTime || '08:00').split(':').map(Number);
    const reminderPassed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
    if (reminderPassed && notifSettings.lastNotifiedDay !== todayISO) {
      fireNotification('Name Workout Challenge', "Time for today's letter burn!");
      notifSettings.lastNotifiedDay = todayISO;
      saveNotifSettings(notifSettings);
    }
  }
}

$('enableNotifBtn').addEventListener('click', async () => {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  updateNotifUI();
  if (permission === 'granted') {
    fireNotification('Notifications enabled', "You'll get a daily reminder here to do your workout.");
    checkNotifications();
  }
});

$('dailyReminderToggle').addEventListener('change', e => {
  notifSettings.dailyEnabled = e.target.checked;
  saveNotifSettings(notifSettings);
  if (notifSettings.dailyEnabled) checkNotifications();
});

$('dailyReminderTime').addEventListener('change', e => {
  notifSettings.dailyTime = e.target.value;
  notifSettings.lastNotifiedDay = null; // allow re-trigger today at new time
  saveNotifSettings(notifSettings);
});

$('testNotifBtn').addEventListener('click', () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    fireNotification('Test notification', 'Notifications are working.');
  } else {
    alert('Enable notifications first using the button above.');
  }
});

$('dailyReminderToggle').checked = notifSettings.dailyEnabled;
$('dailyReminderTime').value = notifSettings.dailyTime;
updateNotifUI();
checkNotifications();
setInterval(checkNotifications, 60000); // re-check every minute while the tab stays open
