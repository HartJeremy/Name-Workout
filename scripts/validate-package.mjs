import { access, readFile } from 'node:fs/promises';
import { APP_CONFIG, STORAGE_KEYS } from '../config.js';
import { DEFAULT_EXERCISES, DEFAULT_D20_EXERCISES, D20_WORKOUTS } from '../workout-data.js';
import { EXERCISE_GUIDES } from '../exercise-guides.js';

const required = [
  'index.html', 'app.js', 'config.js', 'workout-data.js', 'exercise-guides.js', 'styles.css', 'sw.js', 'manifest.webmanifest',
  'notify-schedule.json', 'icon-192.png', 'icon-512.png', 'wod-hero.jpg',
  'scripts/send-daily-notification.mjs', '.github/workflows/daily-name-wod.yml', 'CODE-REVIEW.md'
];

for (const file of required) await access(new URL(`../${file}`, import.meta.url));

if (!APP_CONFIG.name?.trim()) throw new Error('APP_CONFIG.name is required');
if (!APP_CONFIG.mascot?.name?.trim()) throw new Error('APP_CONFIG.mascot.name is required');
if (Object.keys(DEFAULT_EXERCISES).length !== 26) throw new Error('A-Z library must contain exactly 26 exercises');
if (DEFAULT_D20_EXERCISES.length !== 20) throw new Error('D20 library must contain exactly 20 exercises');
if (D20_WORKOUTS.length !== 20) throw new Error('Workout-by-Roll must contain exactly 20 templates');

for (const [index, workout] of D20_WORKOUTS.entries()) {
  if (!workout.name?.trim() || !workout.group?.trim()) throw new Error(`D20 workout ${index + 1} needs a name and group`);
  if (!Array.isArray(workout.rolls) || workout.rolls.length !== 6) throw new Error(`D20 workout ${index + 1} must contain 6 moves`);
  for (const roll of workout.rolls) if (!Number.isInteger(roll) || roll < 1 || roll > 20) throw new Error(`Invalid D20 exercise roll ${roll} in workout ${index + 1}`);
}

const defaultNames = new Set([
  ...Object.values(DEFAULT_EXERCISES).map(entry => entry.name),
  ...DEFAULT_D20_EXERCISES.map(entry => entry.name)
]);
for (const name of defaultNames) if (!EXERCISE_GUIDES[name]) throw new Error(`Missing exercise guide for: ${name}`);

const storageValues = Object.values(STORAGE_KEYS);
if (new Set(storageValues).size !== storageValues.length) throw new Error('Storage keys must be unique');


const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = ids.filter((id,index) => ids.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`Duplicate HTML ids: ${[...new Set(duplicateIds)].join(', ')}`);
const requiredRunnerIds = [
  'runnerStateSummary','runnerStateDots','runnerMoveState','runnerSkipNotice',
  'skipReviewScreen','skipReviewTitle','skipReviewText','skipReviewList',
  'doSkippedBtn','finishWithSkipsBtn','wakeBtn','runnerInfoBtn','exerciseInfoSheet','exerciseInfoTitle','exerciseInfoHow'
];
for (const id of requiredRunnerIds) if (!html.includes(`id="${id}"`)) throw new Error(`Missing runner/skip UI id: ${id}`);
for (const state of ['remaining','completed','skipped']) if (!appSource.includes(`${state}`)) throw new Error(`Missing workout move state: ${state}`);

const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
if (manifest.start_url !== APP_CONFIG.path || manifest.scope !== APP_CONFIG.path || manifest.id !== APP_CONFIG.path) {
  throw new Error('Manifest id/start_url/scope must match APP_CONFIG.path');
}
if (!APP_CONFIG.publicUrl.endsWith(APP_CONFIG.path)) throw new Error('APP_CONFIG.publicUrl must end with APP_CONFIG.path');

const schedule = JSON.parse(await readFile(new URL('../notify-schedule.json', import.meta.url), 'utf8'));
const dates = new Set();
for (const entry of schedule) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) throw new Error(`Invalid date: ${entry.date}`);
  if (dates.has(entry.date)) throw new Error(`Duplicate date: ${entry.date}`);
  dates.add(entry.date);
  if (!entry.name?.trim()) throw new Error(`Missing name for ${entry.date}`);
  if (/[()]/.test(entry.name)) throw new Error(`Put clarifiers in note, not name: ${entry.date}`);
  if (!entry.title?.trim() || !entry.message?.trim()) throw new Error(`Missing notification copy for ${entry.date}`);
}

console.log(`Package valid: ${required.length} required files, ${schedule.length} schedule entries, 26 A-Z moves, 20 D20 moves, 20 D20 workouts, ${defaultNames.size} exercise guides, and unique HTML ids.`);
