const exercises = {
  A: '15 Burpees', B: '30 Crunches', C: '20 Jump Squats', D: 'Bridge 60 Seconds',
  E: '25 Squats', F: 'Plank 60 Seconds', G: '30 Lunges', H: '25 Legs Down',
  I: '30 Side Lunges', J: '50 Bicycle Crunches', K: '25 Jump Lunges', L: '30 Toe Touch Situps',
  M: '20 Single Leg Squats', N: '20 Bent Leg Jack Knives', O: '50 Jumping Jacks',
  P: '50 Cross Country Skiers', Q: '50 Scissor Kicks', R: '50 Mountain Climbers',
  S: '50 High Knees', T: '50 Mountain Climbers', U: '40 Clamshells',
  V: '40 Leg Lifts (Side)', W: '40 Leg Lifts (on Back)', X: '40 Leg Lifts (on Stomach)',
  Y: '30 Supermans', Z: '30 Donkey Kicks'
};

const words = [
  'dragon','burpee','squat','plank','sweat','chaos','strong','lunge','rocket','winner',
  'runner','coffee','theatre','fitness','goblin','cardio','grit','power','focus','stride',
  'pickle','wizard','sunrise','beast','engine','spark','tempo','quest','motion','active'
];

const $ = id => document.getElementById(id);
let mode = 'letters';
let deferredPrompt;

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

function buildWorkout(raw) {
  const letters = raw.toUpperCase().replace(/[^A-Z]/g, '').split('');
  return letters.map(letter => ({ letter, exercise: exercises[letter] })).filter(x => x.exercise);
}

function render() {
  const raw = getDraw();
  const workout = buildWorkout(raw);
  const display = formatLetters(raw.replace(/[^A-Za-z]/g, '')) || 'No letters found';
  $('drawText').textContent = display;
  $('summary').textContent = `${workout.length} move${workout.length === 1 ? '' : 's'}`;
  $('heroCount').textContent = workout.length;
  $('emptyState').classList.toggle('hidden', workout.length > 0);
  $('exerciseList').innerHTML = workout.map((x, index) => `<li><span class="letter-badge">${x.letter}</span><span><span class="move-name">${x.exercise}</span><span class="move-meta">Round ${index + 1}</span></span></li>`).join('');

  const totals = workout.reduce((acc, x) => {
    acc[x.exercise] = (acc[x.exercise] || 0) + 1;
    return acc;
  }, {});
  $('totals').innerHTML = Object.entries(totals)
    .map(([exercise, count]) => `<div class="total"><b>${count}x</b> ${exercise}</div>`).join('');
}

function copyWorkout() {
  const lines = [$('drawText').textContent, ...Array.from($('exerciseList').children).map(li => li.textContent)];
  navigator.clipboard?.writeText(lines.join('\n'));
}

function reset() {
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

$('legendGrid').innerHTML = Object.entries(exercises).map(([letter, exercise]) => `<div class="legend-item"><strong>${letter}</strong><span>${exercise}</span></div>`).join('');

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
