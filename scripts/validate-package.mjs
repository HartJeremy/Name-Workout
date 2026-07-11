import { access, readFile } from 'node:fs/promises';

const required = [
  'index.html', 'app.js', 'styles.css', 'sw.js', 'manifest.webmanifest',
  'notify-schedule.json', 'icon-192.png', 'icon-512.png', 'wod-hero.jpg',
  'scripts/send-daily-notification.mjs', '.github/workflows/daily-name-wod.yml'
];

for (const file of required) await access(new URL(`../${file}`, import.meta.url));

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

console.log(`Package valid: ${required.length} required files and ${schedule.length} schedule entries.`);
