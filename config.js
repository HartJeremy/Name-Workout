export const APP_CONFIG = Object.freeze({
  name: 'AMPED',
  timezone: 'America/New_York',
  path: '/Name-Workout/',
  publicUrl: 'https://hartjeremy.github.io/Name-Workout/',
  scheduleUrl: 'notify-schedule.json',
  dictionaryModuleUrl: 'https://cdn.jsdelivr.net/npm/random-words@2.0.1/+esm',
  mascot: Object.freeze({
    name: 'Max',
    type: 'bulb',
    toastDurationMs: 2600
  }),
  notifications: Object.freeze({
    enabled: false,
    oneSignalAppId: 'f753f501-63a3-42b9-85c9-a8e9a8d5bd30'
  }),
  d20: Object.freeze({
    manualRollDurationMs: 900,
    workoutRollDurationMs: 1000,
    autoRollPauseMs: 950
  })
});

export const STORAGE_KEYS = Object.freeze({
  exercises: 'nameWorkoutExercises',
  exerciseLibraryVersion: 'nameWorkoutExerciseLibraryVersion',
  recentNames: 'nameWorkoutRecentNames',
  dailyNameEnabled: 'nameWorkoutDailyNameEnabled',
  defaultMode: 'nameWorkoutDefaultMode',
  notificationTime: 'nameWorkoutNotificationTime',
  d20Exercises: 'ampedD20Exercises',
  d20ExerciseLibraryVersion: 'ampedD20ExerciseLibraryVersion'
});

export const EXERCISE_LIBRARY_VERSION = '3';
export const D20_EXERCISE_LIBRARY_VERSION = '1';

export const MODE_HERO_COPY = Object.freeze({
  custom: {verb:'Spell it.',description:'Spell a name into today’s workout.'},
  letters:{verb:'Draw it.',description:'Draw random letters and turn them into today’s workout.'},
  word:{verb:'Pick it.',description:'Pick a random word and turn it into today’s workout.'},
  d20:{verb:'Roll it.',description:'Roll the D20 for today’s workout, or switch to Name, Letters, or Word.'}
});

export const FINISH_MESSAGES = Object.freeze([
  'STRONGER TODAY.',
  'MOMENTUM BUILT.',
  'WORK PUT IN.',
  'KEEP BUILDING.',
  'SHOWED UP STRONG.',
  'ONE MORE IN.',
  'PROGRESS EARNED.',
  'BUILT FOR MORE.'
]);

export const MASCOT_MESSAGE_TEMPLATES = Object.freeze([
  '{mascot} is fully charged.',
  '{mascot} has an idea. It involves reps.',
  '{mascot} was told this was a light workout.',
  'Current status: {app}.',
  '{mascot} brought the energy. You bring the reps.',
  '{mascot} says the circuit is live.',
  '{mascot} says the bulb is on. Your turn.',
  '{mascot} is operating at maximum wattage.',
  '{mascot} says this one has potential.',
  "{mascot} says today’s forecast: 100% chance of reps.",
  '{mascot} is glowing with questionable confidence.',
  "{mascot} says that’s enough thinking.",
  '{mascot} says resistance is part of the circuit.',
  '{mascot} is suspiciously excited about burpees.',
  '{mascot} says this looked easier on paper.',
  "{mascot} says don’t blame the dice.",
  '{mascot} claims the D20 made him do it.',
  "{mascot} says it’s only a few reps. He may be lying.",
  '{mascot} has zero muscles and many opinions.',
  '{mascot} says sweat is just the cooling system.',
  '{mascot} says no warranty coverage for skipped reps.',
  "{mascot} says one more won’t trip the breaker.",
  '{mascot} is monitoring your voltage.',
  '{mascot} says consider this a power cycle.',
  '{mascot} says your rest period is under review.',
  "{mascot} says you’re cleared for full power.",
  '{mascot} says the switch only works if you flip it.',
  '{mascot} says the current plan is: keep moving.',
  '{mascot} says every rep adds a little charge.',
  '{mascot} says low battery still counts as battery.',
  '{mascot} says the meter is moving in the right direction.',
  "{mascot} says you’ve got enough juice for one more.",
  '{mascot} says this is how you build a stronger circuit.',
  '{mascot} says the light stays on until the workout is done.',
  '{mascot} says power up. No dramatic montage required.',
  '{mascot} says progress is currently flowing.',
  '{mascot} says your output is looking suspiciously good.',
  '{mascot} says this workout is now officially energized.',
  '{mascot} says the breaker is holding. Keep going.',
  "{mascot} says you’re more charged than you think."
]);

export function buildMascotMessages(config = APP_CONFIG) {
  return MASCOT_MESSAGE_TEMPLATES.map(template => template
    .replaceAll('{mascot}', config.mascot.name)
    .replaceAll('{app}', config.name));
}

export const INTENSITY_LEVELS = Object.freeze([
  {value:0.5,label:'✨ Spark',color:'#45c4e8'},
  {value:0.75,label:'🔋 Energized',color:'#55d187'},
  {value:1,label:'💡 Powered',color:'#e6c94f'},
  {value:1.25,label:'🎚️ Amped',color:'#f29a3f'},
  {value:1.5,label:'⚡ Surging',color:'#ef624f'},
  {value:2,label:'💥 Overload',color:'#d44fe8'}
]);
