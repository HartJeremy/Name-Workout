const ENABLE_NOTIFICATIONS = false;
const STORAGE_KEY = 'nameWorkoutExercises';
const EXERCISE_LIBRARY_VERSION_KEY = 'nameWorkoutExerciseLibraryVersion';
const EXERCISE_LIBRARY_VERSION = '2';
const RECENT_NAMES_KEY = 'nameWorkoutRecentNames';
const DAILY_NAME_ENABLED_KEY = 'nameWorkoutDailyNameEnabled';
const DEFAULT_MODE_KEY = 'nameWorkoutDefaultMode';
const NOTIFICATION_TIME_KEY = 'nameWorkoutNotificationTime';
const SCHEDULE_URL = 'notify-schedule.json';
const TIMEZONE = 'America/New_York';
const APP_PATH = '/Name-Workout/';
const ONE_SIGNAL_APP_ID = 'f753f501-63a3-42b9-85c9-a8e9a8d5bd30';
const DICTIONARY_MODULE_URL = 'https://cdn.jsdelivr.net/npm/random-words@2.0.1/+esm';
let dictionaryModulePromise = null;

const INTENSITY_LEVELS = [
  {value:0.5,label:'✨ Spark',color:'#45c4e8'},
  {value:0.75,label:'🔋 Energized',color:'#55d187'},
  {value:1,label:'💡 Powered',color:'#e6c94f'},
  {value:1.25,label:'🎚️ Amped',color:'#f29a3f'},
  {value:1.5,label:'⚡ Surging',color:'#ef624f'},
  {value:2,label:'💥 Overload',color:'#d44fe8'}
];

// Used only to migrate untouched installs away from the original leg-heavy map.
const LEGACY_DEFAULT_EXERCISES = {
  A:{amount:5,unit:'reps',name:'Burpees'},B:{amount:10,unit:'reps',name:'Crunches'},C:{amount:10,unit:'reps',name:'Squats'},D:{amount:30,unit:'sec',name:'Bridge'},E:{amount:10,unit:'reps',name:'Squats'},F:{amount:30,unit:'sec',name:'Plank'},G:{amount:10,unit:'reps',name:'Lunges',each:'split',eachLabel:'leg'},H:{amount:10,unit:'reps',name:'Leg Raises'},I:{amount:10,unit:'reps',name:'Side Lunges',each:'split',eachLabel:'side'},J:{amount:15,unit:'reps',name:'Bicycle Crunches'},K:{amount:10,unit:'reps',name:'Reverse Lunges',each:'split',eachLabel:'leg'},L:{amount:10,unit:'reps',name:'Toe Touches'},M:{amount:10,unit:'reps',name:'Single-Leg Squats',each:'split',eachLabel:'leg'},N:{amount:10,unit:'reps',name:'Bent-Leg Jackknives'},O:{amount:20,unit:'reps',name:'Jumping Jacks'},P:{amount:20,unit:'reps',name:'Cross-Country Skiers'},Q:{amount:20,unit:'reps',name:'Scissor Kicks'},R:{amount:20,unit:'reps',name:'Mountain Climbers'},S:{amount:20,unit:'reps',name:'High Knees'},T:{amount:20,unit:'reps',name:'Mountain Climbers'},U:{amount:15,unit:'reps',name:'Clamshells',each:'perSide',eachLabel:'side'},V:{amount:15,unit:'reps',name:'Side Leg Lifts',each:'perSide',eachLabel:'side'},W:{amount:15,unit:'reps',name:'Glute Leg Lifts'},X:{amount:15,unit:'reps',name:'Superman Lifts'},Y:{amount:15,unit:'reps',name:'Supermans'},Z:{amount:15,unit:'reps',name:'Donkey Kicks',each:'perSide',eachLabel:'leg'}
};

// Balanced A-Z bodyweight library: upper body, lower body, core, cardio and posterior chain.
const DEFAULT_EXERCISES = {
  A:{amount:8,unit:'reps',name:'Push-Ups'},
  B:{amount:12,unit:'reps',name:'Air Squats'},
  C:{amount:16,unit:'reps',name:'Bicycle Crunches'},
  D:{amount:15,unit:'reps',name:'Glute Bridges'},
  E:{amount:16,unit:'reps',name:'Shoulder Taps',each:'split',eachLabel:'shoulder'},
  F:{amount:30,unit:'sec',name:'Forearm Plank'},
  G:{amount:10,unit:'reps',name:'Reverse Lunges',each:'split',eachLabel:'leg'},
  H:{amount:12,unit:'reps',name:'Superman Lifts'},
  I:{amount:20,unit:'reps',name:'Jumping Jacks'},
  J:{amount:8,unit:'reps',name:'Pike Push-Ups'},
  K:{amount:16,unit:'reps',name:'Dead Bugs',each:'split',eachLabel:'side'},
  L:{amount:30,unit:'sec',name:'High Knees'},
  M:{amount:20,unit:'reps',name:'Mountain Climbers'},
  N:{amount:10,unit:'reps',name:'Plank Up-Downs'},
  O:{amount:10,unit:'reps',name:'Side Lunges',each:'split',eachLabel:'side'},
  P:{amount:8,unit:'reps',name:'Hand-Release Push-Ups'},
  Q:{amount:30,unit:'sec',name:'Wall Sit'},
  R:{amount:16,unit:'reps',name:'Skater Hops',each:'split',eachLabel:'side'},
  S:{amount:15,unit:'reps',name:'Good Mornings'},
  T:{amount:6,unit:'reps',name:'Burpees'},
  U:{amount:40,unit:'sec',name:'Side Plank',each:'split',eachLabel:'side'},
  V:{amount:20,unit:'reps',name:'Calf Raises'},
  W:{amount:25,unit:'sec',name:'Hollow Hold'},
  X:{amount:12,unit:'reps',name:'Bird Dogs',each:'split',eachLabel:'side'},
  Y:{amount:30,unit:'sec',name:'Bear Crawl'},
  Z:{amount:30,unit:'sec',name:'Fast Feet'}
};

const D20_EXERCISES = [
  {amount:10,unit:'reps',name:'Push-Ups'},
  {amount:15,unit:'reps',name:'Air Squats'},
  {amount:20,unit:'reps',name:'Bicycle Crunches'},
  {amount:12,unit:'reps',name:'Reverse Lunges',each:'split',eachLabel:'leg'},
  {amount:20,unit:'reps',name:'Mountain Climbers'},
  {amount:15,unit:'reps',name:'Glute Bridges'},
  {amount:20,unit:'reps',name:'Shoulder Taps',each:'split',eachLabel:'shoulder'},
  {amount:25,unit:'reps',name:'Jumping Jacks'},
  {amount:16,unit:'reps',name:'Dead Bugs',each:'split',eachLabel:'side'},
  {amount:8,unit:'reps',name:'Pike Push-Ups'},
  {amount:30,unit:'sec',name:'High Knees'},
  {amount:12,unit:'reps',name:'Superman Lifts'},
  {amount:40,unit:'sec',name:'Side Plank',each:'split',eachLabel:'side'},
  {amount:20,unit:'reps',name:'Calf Raises'},
  {amount:30,unit:'sec',name:'Bear Crawl'},
  {amount:30,unit:'sec',name:'Forearm Plank'},
  {amount:20,unit:'reps',name:'Skater Hops',each:'split',eachLabel:'side'},
  {amount:10,unit:'reps',name:'Plank Up-Downs'},
  {amount:8,unit:'reps',name:'Burpees'},
  {amount:15,unit:'reps',name:'Good Mornings'}
];

const D20_WORKOUTS = [
  {name:'Balanced Six',rolls:[1,2,3,6,8,16]},
  {name:'Push & Pace',rolls:[1,4,7,11,12,16]},
  {name:'Core Engine',rolls:[5,9,13,18,8,6]},
  {name:'Legs + Lungs',rolls:[2,4,14,17,11,3]},
  {name:'Upper Body Burn',rolls:[1,7,10,18,12,8]},
  {name:'Posterior Power',rolls:[6,12,20,2,5,16]},
  {name:'Cardio Circuit',rolls:[8,11,17,19,5,9]},
  {name:'Stability Day',rolls:[9,13,16,7,6,20]},
  {name:'Full-Body Charge',rolls:[19,2,1,3,12,11]},
  {name:'Steady Strength',rolls:[1,2,6,9,14,20]},
  {name:'Shoulders + Core',rolls:[10,7,18,13,5,12]},
  {name:'Athletic Mix',rolls:[17,4,1,15,3,20]},
  {name:'Quick Sweat',rolls:[8,5,19,11,3,16]},
  {name:'Strength Base',rolls:[1,2,4,6,10,12]},
  {name:'Core Control',rolls:[9,13,16,3,7,20]},
  {name:'Move & Brace',rolls:[15,5,4,18,6,8]},
  {name:'Upper + Posterior',rolls:[1,10,12,20,7,2]},
  {name:'Lower + Core',rolls:[2,4,17,6,9,13]},
  {name:'Conditioning Mix',rolls:[19,11,5,8,17,16]},
  {name:'Everything Day',rolls:[1,4,7,9,12,19]}
];

const $ = id => document.getElementById(id);
let mode = 'd20';
let d20Mode = 'exercise';
let d20Rolling = false;
let d20ManualRolls = [];
let deferredPrompt;
let exercises = loadExercises();
let intensity = 1;
let lastRawLetters = '';
let lastWorkout = [];
let workoutDisplayName = '';
let lastBuildKind = '';
let lastD20Rolls = [];
let lastD20WorkoutRoll = null;
let oneSignalInstance = null;
let todayScheduleEntry = null;
let scheduleData = [];
let scheduleLoaded = false;
let dailyNameEnabled = localStorage.getItem(DAILY_NAME_ENABLED_KEY) !== 'false';
let currentMove = 0;
let completedMoves = new Set();
let timerInterval = null;
let timerRemaining = 0;
let wakeLock = null;
const previewTimers = new Map();

function dateISOForOffset(days = 0) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', {timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function todayISO(){return dateISOForOffset(0)}

function sameExercise(a,b){
  if(!a || !b) return false;
  return ['amount','unit','name','each','eachLabel'].every(key => (a[key] ?? '') === (b[key] ?? ''));
}

function loadExercises(){
  let saved = null;
  try{saved = JSON.parse(localStorage.getItem(STORAGE_KEY));}catch(error){console.warn('Could not load saved exercises.',error)}
  if(!saved || typeof saved !== 'object'){
    localStorage.setItem(EXERCISE_LIBRARY_VERSION_KEY,EXERCISE_LIBRARY_VERSION);
    return structuredClone(DEFAULT_EXERCISES);
  }
  const currentVersion = localStorage.getItem(EXERCISE_LIBRARY_VERSION_KEY);
  const migrated = Object.fromEntries(Object.keys(DEFAULT_EXERCISES).map(letter => {
    const savedEntry = saved[letter];
    if(currentVersion !== EXERCISE_LIBRARY_VERSION && sameExercise(savedEntry,LEGACY_DEFAULT_EXERCISES[letter])){
      return [letter,{...DEFAULT_EXERCISES[letter]}];
    }
    return [letter,{...DEFAULT_EXERCISES[letter],...(savedEntry || {})}];
  }));
  localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
  localStorage.setItem(EXERCISE_LIBRARY_VERSION_KEY,EXERCISE_LIBRARY_VERSION);
  return migrated;
}
function saveExercises(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(exercises));
  localStorage.setItem(EXERCISE_LIBRARY_VERSION_KEY,EXERCISE_LIBRARY_VERSION);
}

function renderTomorrowName(){
  const card = $('tomorrowNameCard');
  const name = $('tomorrowName');
  if(!card || !name) return;
  const entry = scheduleData.find(item => item.date === dateISOForOffset(1));
  if(!entry?.name){card.classList.add('hidden');name.textContent='';return}
  name.textContent = normalizeFirstName(entry.name).toUpperCase();
  card.classList.remove('hidden');
}

function applyScheduledName(){
  const input = $('customText');
  const note = $('dailyNameNote');
  if(!dailyNameEnabled || !todayScheduleEntry?.name){
    if(input.dataset.scheduledName === 'true') input.value = '';
    input.removeAttribute('data-scheduled-name');
    if(note){note.textContent='';note.classList.add('hidden')}
    return;
  }
  input.value = normalizeFirstName(todayScheduleEntry.name);
  input.dataset.scheduledName = 'true';
  if(note){
    if(todayScheduleEntry.note){note.textContent=todayScheduleEntry.note;note.classList.remove('hidden')}
    else{note.textContent='';note.classList.add('hidden')}
  }
}

function updateNameModeAvailability(){
  if(!scheduleLoaded) return;
  const hasRemainingNames = scheduleData.some(entry => entry?.name && entry.date >= todayISO());
  $('nameModeTab').classList.toggle('hidden',!hasRemainingNames);
  const dailyNameSetting = $('dailyNameToggle')?.closest('.toggle-control');
  dailyNameSetting?.classList.toggle('hidden',!hasRemainingNames);
  const nameDefaultOption = $('defaultModeSelect')?.querySelector('option[value="custom"]');
  if(nameDefaultOption) nameDefaultOption.hidden = !hasRemainingNames;
  if(!hasRemainingNames && getDefaultMode() === 'custom'){
    localStorage.setItem(DEFAULT_MODE_KEY,'d20');
    if($('defaultModeSelect')) $('defaultModeSelect').value = 'd20';
  }
  if(!hasRemainingNames && mode === 'custom') setMode('d20');
}

async function loadTodaySchedule(){
  try{
    const response = await fetch(SCHEDULE_URL,{cache:'no-store'});
    if(!response.ok) throw new Error(`Schedule returned ${response.status}`);
    scheduleData = await response.json();
    scheduleLoaded = true;
    todayScheduleEntry = scheduleData.find(entry => entry.date === todayISO()) || null;
    if(!todayScheduleEntry) console.warn('No Name WOD schedule entry for',todayISO());
  }catch(error){
    scheduleData = [];
    scheduleLoaded = false;
    todayScheduleEntry = null;
    console.warn('Could not load today’s Name WOD schedule.',error);
  }
  applyScheduledName();
  updateNameModeAvailability();
  renderTomorrowName();
}

function normalizeFirstName(value){
  const clean = String(value || '').replace(/[^A-Za-z'’-]/g,' ').trim();
  const first = clean.split(/\s+/)[0] || '';
  return first.slice(0,24);
}
function loadRecentNames(){
  try{
    const saved = JSON.parse(localStorage.getItem(RECENT_NAMES_KEY)) || [];
    const cleaned = [...new Set(saved.map(normalizeFirstName).filter(Boolean))].slice(0,6);
    if(JSON.stringify(saved) !== JSON.stringify(cleaned)) localStorage.setItem(RECENT_NAMES_KEY,JSON.stringify(cleaned));
    return cleaned;
  }catch{return []}
}
function rememberName(name){
  if(mode !== 'custom') return;
  const firstName = normalizeFirstName(name);
  if(!firstName) return;
  const names = [firstName,...loadRecentNames().filter(item => item.toLowerCase() !== firstName.toLowerCase())].slice(0,6);
  localStorage.setItem(RECENT_NAMES_KEY,JSON.stringify(names));
  renderRecentNames();
}
function renderRecentNames(){
  const names = loadRecentNames();
  $('recentNames').innerHTML = names.map(name => `<button class="recent-name" type="button" data-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('');
  document.querySelectorAll('.recent-name').forEach(button => button.addEventListener('click',() => {
    $('customText').value = button.dataset.name;
    $('customText').focus();
  }));
}
function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function getDefaultMode(){
  const saved = localStorage.getItem(DEFAULT_MODE_KEY);
  return ['custom','letters','word','d20'].includes(saved) ? saved : 'd20';
}
function saveDefaultMode(value){
  const next = ['custom','letters','word','d20'].includes(value) ? value : 'd20';
  localStorage.setItem(DEFAULT_MODE_KEY,next);
  return next;
}

function setMode(next){
  if(next === 'custom' && $('nameModeTab').classList.contains('hidden')) next = 'letters';
  mode = next;
  document.querySelectorAll('.tab').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  document.querySelectorAll('.input-panel').forEach(panel => panel.classList.remove('active'));
  $(`${mode}Panel`).classList.add('active');
  updateBuilderCopy();
}

function updateBuilderCopy(){
  const copy = {
    custom:{title:'Which first name are we doing?',pill:'PICK A NAME',button:'BUILD THE WORKOUT',sub:'Map every letter to a move'},
    letters:{title:'Let the letters decide.',pill:'RANDOM LETTERS',button:'DRAW LETTERS',sub:'Generate a random letter workout'},
    word:{title:'Let a word decide.',pill:'RANDOM WORD',button:'DRAW A WORD',sub:'Turn a random word into a workout'},
    d20:{title:'Roll today’s workout.',pill:'D20 MODE',button:'',sub:''}
  }[mode];
  $('builderTitle').textContent = copy.title;
  $('movesPill').textContent = copy.pill;
  $('generateBtn').classList.toggle('hidden',mode === 'd20');
  $('duplicatesControl').classList.toggle('hidden',mode === 'd20');
  if(mode !== 'd20'){
    $('generateBtn').querySelector('span').textContent = copy.button;
    $('generateBtn').querySelector('small').textContent = copy.sub;
  }
  if(mode === 'd20') updateD20Controls();
}

function updateIntensitySlider(){
  const slider = $('intensityRange');
  const label = $('intensityLabel');
  if(!slider || !label) return;
  const index = Math.max(0,Math.min(INTENSITY_LEVELS.length-1,Number(slider.value)));
  const level = INTENSITY_LEVELS[index];
  const progress = (index/(INTENSITY_LEVELS.length-1))*100;
  intensity = level.value;
  label.textContent = `${level.label} • ${level.value}×`;
  slider.setAttribute('aria-valuetext',`${level.label} • ${level.value}×`);
  slider.style.setProperty('--intensity-progress',`${progress}%`);
  slider.style.setProperty('--intensity-color',level.color);
  label.style.color = level.color;
  rebuildLastWorkoutForIntensity();
}

function randomLetters(count,allowDuplicates){
  const available = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const result = [];
  for(let index=0; index<count; index+=1){
    if(!allowDuplicates && available.length === 0) break;
    const source = allowDuplicates ? [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] : available;
    const selectedIndex = Math.floor(Math.random()*source.length);
    result.push(source[selectedIndex]);
    if(!allowDuplicates) available.splice(selectedIndex,1);
  }
  return result.join('');
}
function loadDictionaryModule(){
  if(!dictionaryModulePromise) dictionaryModulePromise = import(DICTIONARY_MODULE_URL).catch(error => {
    console.warn('Dictionary module failed to load.',error);
    dictionaryModulePromise = null;
    return null;
  });
  return dictionaryModulePromise;
}
async function randomWord(maxLength,allowDuplicates){
  const mod = await loadDictionaryModule();
  if(mod){
    for(let attempt=0; attempt<100; attempt+=1){
      const word = mod.generate({minLength:3,maxLength});
      if(typeof word !== 'string') continue;
      if(allowDuplicates || new Set(word.toLowerCase()).size === word.length) return word;
    }
  }
  return randomLetters(maxLength,allowDuplicates).toLowerCase();
}
async function getDraw(){
  const allowDuplicates = $('allowDuplicates').checked;
  if(mode === 'custom'){
    const firstName = normalizeFirstName($('customText').value);
    $('customText').value = firstName;
    return firstName;
  }
  if(mode === 'word') return await randomWord(Number($('maxWordLength').value || 8),allowDuplicates);
  return randomLetters(Number($('letterCount').value || 8),allowDuplicates);
}

function formatExercise(entry,multiplier){
  let amount;
  if(entry.unit === 'sec') amount = Math.max(5,Math.round((entry.amount*multiplier)/5)*5);
  else if(entry.each === 'split') amount = Math.max(2,Math.round((entry.amount*multiplier)/2)*2);
  else amount = Math.max(1,Math.round(entry.amount*multiplier));
  let detail = '';
  let displayAmount = amount;
  if(entry.each === 'split') detail = `${amount/2} each ${entry.eachLabel}`;
  else if(entry.each === 'perSide'){
    if(entry.unit !== 'sec') displayAmount = amount*2;
    detail = `${amount} each ${entry.eachLabel}`;
  }
  return {
    amount:displayAmount,
    headline:entry.unit === 'sec' ? `${displayAmount}-second ${entry.name}` : `${displayAmount} ${entry.name}`,
    detail
  };
}

function entryToMove(entry,marker,sourceRoll = null){
  const formatted = formatExercise(entry,intensity);
  return {
    letter:String(marker),
    name:entry.name,
    unit:entry.unit,
    amount:formatted.amount,
    headline:formatted.headline,
    detail:formatted.detail,
    each:entry.each,
    eachLabel:entry.eachLabel,
    sourceRoll
  };
}
function buildWorkout(raw){
  return raw.toUpperCase().replace(/[^A-Z]/g,'').split('').map(letter => {
    const entry = exercises[letter];
    return entry ? entryToMove(entry,letter) : null;
  }).filter(Boolean);
}
function buildD20ExerciseWorkout(rolls){
  return rolls.map(roll => entryToMove(D20_EXERCISES[roll-1],roll,roll));
}
function buildD20TemplateWorkout(roll){
  const template = D20_WORKOUTS[roll-1];
  if(!template) return [];
  return template.rolls.map((exerciseRoll,index) => entryToMove(D20_EXERCISES[exerciseRoll-1],index+1,exerciseRoll));
}
function displayName(raw){
  const clean = mode === 'custom' ? normalizeFirstName(raw) : String(raw).replace(/[^A-Za-z]/g,'').trim();
  return $('upperCase').checked ? clean.toUpperCase() : clean;
}
function applyCase(value){return $('upperCase').checked ? String(value).toUpperCase() : String(value)}

async function buildWorkoutFromInput(){
  if(mode === 'd20'){await rollD20Selection();return}
  const raw = await getDraw();
  const workout = buildWorkout(raw);
  if(!workout.length){$('customText').focus();return}
  lastRawLetters = raw;
  lastWorkout = workout;
  workoutDisplayName = displayName(raw);
  lastBuildKind = 'letters';
  lastD20Rolls = [];
  lastD20WorkoutRoll = null;
  rememberName(raw);
  showPreview();
}

function secureRandomInt(max){
  if(globalThis.crypto?.getRandomValues){
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % max;
  }
  return Math.floor(Math.random()*max);
}
function rollD20(){return secureRandomInt(20)+1}
function wait(ms){return new Promise(resolve => setTimeout(resolve,ms))}

async function animateD20(finalValue,duration = 650){
  const die = document.querySelector('.d20-die');
  const value = $('d20Value');
  die.classList.remove('landed');
  die.style.setProperty('--d20-turn',`${2 + secureRandomInt(4)}turn`);
  die.style.setProperty('--d20-duration',`${duration}ms`);
  die.classList.add('rolling');
  const interval = setInterval(() => {value.textContent = String(rollD20())},55);
  await wait(duration);
  clearInterval(interval);
  value.textContent = String(finalValue);
  die.classList.remove('rolling');
  void die.offsetWidth;
  die.classList.add('landed');
  vibrate(35);
}

function getD20Mode(){return document.querySelector('input[name="d20Mode"]:checked')?.value || 'exercise'}
function resetD20Rolls(){
  d20ManualRolls = [];
  $('d20RollHistory').innerHTML = '';
  $('d20Status').textContent = 'Roll the die to build today’s workout.';
  $('d20ResetBtn').classList.add('hidden');
  updateD20Controls();
}
function renderD20History(rolls){
  $('d20RollHistory').innerHTML = rolls.map((roll,index) => {
    const exercise = D20_EXERCISES[roll-1];
    return `<span class="roll-chip"><b>${index+1}</b><strong>${roll}</strong><small>${escapeHtml(exercise.name)}</small></span>`;
  }).join('');
}
function updateD20Controls(){
  d20Mode = getD20Mode();
  const exerciseMode = d20Mode === 'exercise';
  $('d20ExerciseOptions').classList.toggle('hidden',!exerciseMode);
  if(exerciseMode){
    const count = Number($('d20RollCount').value || 6);
    const auto = $('d20AutoRoll').checked;
    $('d20ActionLabel').textContent = auto ? 'ROLL TODAY’S WORKOUT' : 'ROLL THE D20';
    $('d20ActionSub').textContent = auto ? `Auto-roll ${count} exercise${count===1?'':'s'}` : `Roll ${d20ManualRolls.length+1} of ${count}`;
    $('d20ResetBtn').classList.toggle('hidden',d20ManualRolls.length === 0);
  }else{
    $('d20ActionLabel').textContent = 'ROLL A WORKOUT';
    $('d20ActionSub').textContent = 'One roll • 20 complete workouts';
    $('d20ResetBtn').classList.add('hidden');
  }
}

function setD20RollingState(isRolling){
  $('d20RollBtn').disabled = isRolling;
  document.querySelectorAll('input[name="d20Mode"], #d20RollCount, #d20AutoRoll').forEach(control => {control.disabled = isRolling});
}

async function rollD20Selection({forceAuto=false} = {}){
  if(d20Rolling) return;
  d20Rolling = true;
  setD20RollingState(true);
  try{
    d20Mode = getD20Mode();
    if(d20Mode === 'workout') await rollFullWorkout();
    else await rollExerciseWorkout(forceAuto);
  }finally{
    d20Rolling = false;
    setD20RollingState(false);
    updateD20Controls();
  }
}

async function rollExerciseWorkout(forceAuto=false){
  const count = Number($('d20RollCount').value || 6);
  const auto = forceAuto || $('d20AutoRoll').checked;
  if(auto){
    d20ManualRolls = [];
    renderD20History([]);
    $('d20Status').textContent = `Rolling ${count} exercise${count===1?'':'s'}…`;
    const duration = count <= 6 ? 520 : count <= 12 ? 330 : 230;
    for(let index=0; index<count; index+=1){
      const roll = rollD20();
      await animateD20(roll,duration);
      d20ManualRolls.push(roll);
      renderD20History(d20ManualRolls);
      $('d20Status').textContent = `Roll ${index+1} of ${count}: ${roll} — ${D20_EXERCISES[roll-1].name}`;
      if(index < count-1) await wait(count > 12 ? 60 : 100);
    }
    finalizeD20ExerciseWorkout(d20ManualRolls);
    return;
  }

  if(d20ManualRolls.length >= count) resetD20Rolls();
  const roll = rollD20();
  await animateD20(roll,700);
  d20ManualRolls.push(roll);
  renderD20History(d20ManualRolls);
  $('d20Status').textContent = `Roll ${d20ManualRolls.length} of ${count}: ${roll} — ${D20_EXERCISES[roll-1].name}`;
  if(d20ManualRolls.length >= count) finalizeD20ExerciseWorkout(d20ManualRolls);
}

function finalizeD20ExerciseWorkout(rolls){
  lastD20Rolls = [...rolls];
  lastD20WorkoutRoll = null;
  lastWorkout = buildD20ExerciseWorkout(lastD20Rolls);
  lastRawLetters = '';
  lastBuildKind = 'd20-exercise';
  workoutDisplayName = applyCase(`D20 × ${lastWorkout.length}`);
  $('d20Status').textContent = `Workout locked: ${lastWorkout.length} rolls. Roll again anytime for a new draw.`;
  showPreview();
}

async function rollFullWorkout(){
  const roll = rollD20();
  $('d20Status').textContent = 'Rolling for 1 of 20 complete workouts…';
  await animateD20(roll,850);
  lastD20WorkoutRoll = roll;
  lastD20Rolls = [roll];
  lastWorkout = buildD20TemplateWorkout(roll);
  lastRawLetters = '';
  lastBuildKind = 'd20-workout';
  const template = D20_WORKOUTS[roll-1];
  workoutDisplayName = applyCase(`#${roll} ${template.name}`);
  $('d20RollHistory').innerHTML = `<span class="workout-roll-result"><b>D20 ${roll}</b><strong>${escapeHtml(template.name)}</strong><small>${template.rolls.length} moves</small></span>`;
  $('d20Status').textContent = `D20 ${roll}: ${template.name}.`;
  showPreview();
}

function rebuildLastWorkoutForIntensity(){
  if(!lastWorkout.length) return;
  if(lastBuildKind === 'letters' && lastRawLetters) lastWorkout = buildWorkout(lastRawLetters);
  else if(lastBuildKind === 'd20-exercise' && lastD20Rolls.length) lastWorkout = buildD20ExerciseWorkout(lastD20Rolls);
  else if(lastBuildKind === 'd20-workout' && lastD20WorkoutRoll) lastWorkout = buildD20TemplateWorkout(lastD20WorkoutRoll);
  else return;
  renderPreview();
}

function clearPreviewTimers(){
  previewTimers.forEach(state => {if(state.interval) clearInterval(state.interval)});
  previewTimers.clear();
}
function togglePreviewTimer(button){
  const index = button.dataset.index;
  const seconds = Number(button.dataset.seconds);
  const label = button.querySelector('.timer-btn-time');
  const state = previewTimers.get(index) || {remaining:seconds,interval:null};
  if(state.interval){
    clearInterval(state.interval);
    state.interval = null;
    button.classList.remove('running');
    label.textContent = `${state.remaining}s`;
    previewTimers.set(index,state);
    return;
  }
  if(state.remaining <= 0) state.remaining = seconds;
  button.classList.remove('done');
  button.classList.add('running');
  label.textContent = `${state.remaining}s`;
  state.interval = setInterval(() => {
    state.remaining -= 1;
    if(state.remaining <= 0){
      clearInterval(state.interval);
      state.interval = null;
      state.remaining = 0;
      button.classList.remove('running');
      button.classList.add('done');
      label.textContent = 'DONE';
      vibrate([120,80,120]);
      previewTimers.set(index,state);
      return;
    }
    label.textContent = `${state.remaining}s`;
    previewTimers.set(index,state);
  },1000);
  previewTimers.set(index,state);
}

function showPreview(){
  renderPreview();
  $('previewCard').classList.remove('hidden');
  $('previewCard').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderPreview(){
  clearPreviewTimers();
  $('drawText').textContent = workoutDisplayName;
  $('heroCount').textContent = lastWorkout.length;
  $('movesPill').textContent = `${lastWorkout.length} MOVE${lastWorkout.length===1?'':'S'}`;
  if(lastBuildKind === 'd20-exercise'){
    $('workoutTagline').textContent = `D20 rolls: ${lastD20Rolls.join(' • ')}`;
  }else if(lastBuildKind === 'd20-workout'){
    const template = D20_WORKOUTS[lastD20WorkoutRoll-1];
    $('workoutTagline').textContent = `D20 ${lastD20WorkoutRoll} selected ${template.name}.`;
  }else if(mode === 'custom'){
    $('workoutTagline').textContent = `${workoutDisplayName} is today’s workout. Spell every letter in sweat.`;
  }else{
    $('workoutTagline').textContent = 'Every letter earns a move.';
  }
  $('exercisePreview').innerHTML = lastWorkout.map((item,index) => `<div class="preview-move"><span class="preview-letter">${escapeHtml(item.letter)}</span><span><b>${escapeHtml(item.headline)}</b><small>${item.detail?escapeHtml(item.detail):item.sourceRoll?`D20 exercise ${item.sourceRoll}`:'Complete the full amount'}</small></span>${item.unit==='sec'?`<button class="preview-timer-btn" type="button" data-index="${index}" data-seconds="${item.amount}"><span class="timer-btn-time">${item.amount}s</span></button>`:`<em class="preview-index">${index+1}</em>`}</div>`).join('');
  document.querySelectorAll('.preview-timer-btn').forEach(button => button.addEventListener('click',() => togglePreviewTimer(button)));
  $('rerollBtn').classList.toggle('hidden',!lastBuildKind.startsWith('d20'));
  renderTomorrowName();
}

function workoutText({completed=false} = {}){
  const lead = completed ? `✅ ${workoutDisplayName} complete` : `Today's workout: ${workoutDisplayName}`;
  const lines = [lead];
  if(lastBuildKind === 'd20-exercise' && lastD20Rolls.length) lines.push(`🎲 D20 rolls: ${lastD20Rolls.join(', ')}`);
  if(lastBuildKind === 'd20-workout' && lastD20WorkoutRoll) lines.push(`🎲 D20 roll: ${lastD20WorkoutRoll}`);
  lines.push('',...lastWorkout.map((item,index) => `${index+1}. ${item.headline}${item.detail?` (${item.detail})`:''}`));
  return lines.join('\n');
}
async function writeClipboard(text){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return}
  const area=document.createElement('textarea');
  area.value=text;
  area.setAttribute('readonly','');
  area.style.position='fixed';
  area.style.opacity='0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}
async function copyWorkout({completed=false,button=null} = {}){
  if(!lastWorkout.length) return;
  const target = button || $('copyBtn');
  const original = target?.textContent;
  try{
    await writeClipboard(workoutText({completed}));
    if(target){target.textContent = completed ? 'Completed workout copied!' : 'Workout copied!';setTimeout(()=>{target.textContent=original},1400)}
    vibrate(30);
  }catch(error){
    console.error('Copy failed.',error);
    if(target){target.textContent='Copy failed';setTimeout(()=>{target.textContent=original},1400)}
  }
}

async function requestWakeLock(){
  if(!('wakeLock' in navigator)) return;
  try{
    wakeLock = await navigator.wakeLock.request('screen');
    $('wakeBtn').textContent = '☀';
    $('wakeBtn').title = 'Screen will stay awake';
  }catch(error){console.warn('Wake lock unavailable.',error)}
}
async function releaseWakeLock(){try{await wakeLock?.release()}catch{}wakeLock=null}
function startWorkout(){
  if(!lastWorkout.length) return;
  currentMove = 0;
  completedMoves = new Set();
  $('runner').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  requestWakeLock();
  renderRunner();
}
function renderRunner(){
  clearTimer();
  const item = lastWorkout[currentMove];
  $('runnerName').textContent = workoutDisplayName || 'TODAY’S WOD';
  $('runnerProgressText').textContent = `${currentMove+1} OF ${lastWorkout.length}`;
  $('progressBar').style.width = `${(completedMoves.size/lastWorkout.length)*100}%`;
  $('runnerLetter').textContent = item.letter;
  $('runnerExercise').textContent = item.headline;
  $('runnerSplit').textContent = item.detail;
  $('prevMoveBtn').disabled = currentMove === 0;
  $('completeMoveBtn').querySelector('span').textContent = completedMoves.has(currentMove) ? 'COMPLETED' : 'DONE';
  if(item.unit === 'sec'){
    $('timerBox').classList.remove('hidden');
    timerRemaining = item.amount;
    updateTimerDisplay();
  }else $('timerBox').classList.add('hidden');
}
function updateTimerDisplay(){
  $('timerValue').textContent = timerRemaining;
  $('timerBtn').textContent = timerInterval ? 'PAUSE TIMER' : timerRemaining === 0 ? 'RESET TIMER' : 'START TIMER';
}
function clearTimer(){if(timerInterval) clearInterval(timerInterval);timerInterval=null}
function toggleTimer(){
  const item = lastWorkout[currentMove];
  if(timerRemaining === 0) timerRemaining = item.amount;
  if(timerInterval){clearTimer();updateTimerDisplay();return}
  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    updateTimerDisplay();
    if(timerRemaining <= 0){
      clearTimer();
      timerRemaining = 0;
      updateTimerDisplay();
      vibrate([120,80,120]);
      completeCurrentMove();
    }
  },1000);
  updateTimerDisplay();
}
function vibrate(pattern=30){if($('vibrationToggle')?.checked && navigator.vibrate) navigator.vibrate(pattern)}
function completeCurrentMove(){
  completedMoves.add(currentMove);
  vibrate(40);
  if(completedMoves.size >= lastWorkout.length){finishWorkout();return}
  let next = currentMove+1;
  while(next < lastWorkout.length && completedMoves.has(next)) next += 1;
  if(next >= lastWorkout.length) next = [...Array(lastWorkout.length).keys()].find(index => !completedMoves.has(index)) ?? currentMove;
  currentMove = next;
  renderRunner();
}
function finishWorkout(){
  clearTimer();
  releaseWakeLock();
  $('runner').classList.add('hidden');
  $('finishTitle').innerHTML = `${escapeHtml(workoutDisplayName)}<br>CONQUERED.`;
  $('finishStats').textContent = `${lastWorkout.length} moves finished. Workout complete.`;
  $('finishScreen').classList.remove('hidden');
  vibrate([100,70,100,70,180]);
}
function exitRunner(){clearTimer();releaseWakeLock();$('runner').classList.add('hidden');document.body.style.overflow=''}
function closeFinish(){$('finishScreen').classList.add('hidden');document.body.style.overflow=''}

function syncRange(rangeId,outputId,onUpdate){
  const range = $(rangeId), output = $(outputId);
  const sync = () => {output.textContent=range.value;onUpdate?.()};
  range.addEventListener('input',sync);
  sync();
}

function renderEditor(){
  const units = ['reps','sec'];
  const options = [{value:'',label:'No split'},{value:'split',label:'Split half'},{value:'perSide',label:'Per side'}];
  $('editorGrid').innerHTML = Object.entries(exercises).map(([letter,entry]) => `<div class="editor-row" data-letter="${letter}"><span class="editor-letter">${letter}</span><input class="editor-amount" type="number" min="1" value="${entry.amount}"><select class="editor-unit">${units.map(unit=>`<option value="${unit}" ${entry.unit===unit?'selected':''}>${unit}</option>`).join('')}</select><input class="editor-name" value="${escapeHtml(entry.name)}"><select class="editor-each">${options.map(option=>`<option value="${option.value}" ${entry.each===option.value||(!entry.each&&!option.value)?'selected':''}>${option.label}</option>`).join('')}</select><input class="editor-label" value="${escapeHtml(entry.eachLabel||'')}" placeholder="side/leg" ${entry.each?'':'disabled'}></div>`).join('');
  document.querySelectorAll('.editor-row').forEach(row => {
    const letter=row.dataset.letter, amount=row.querySelector('.editor-amount'), unit=row.querySelector('.editor-unit'), name=row.querySelector('.editor-name'), each=row.querySelector('.editor-each'), label=row.querySelector('.editor-label');
    const commit = () => {
      exercises[letter] = {amount:Math.max(1,Number(amount.value)||1),unit:unit.value,name:name.value.trim()||DEFAULT_EXERCISES[letter].name,each:each.value||undefined,eachLabel:label.value.trim()||undefined};
      label.disabled = !each.value;
      saveExercises();
      if(lastBuildKind === 'letters' && lastRawLetters){lastWorkout=buildWorkout(lastRawLetters);renderPreview()}
    };
    [amount,unit,name,each,label].forEach(control => control.addEventListener('change',commit));
  });
}

function setNotificationStatus(text,detail){$('notifStatus').textContent=text;$('subscriptionDetail').textContent=detail}
function normalizeNotificationTime(value){return /^([01]\d|2[0-3]):[0-5]\d$/.test(value||'')?value:'07:00'}
function getNotificationTime(){return normalizeNotificationTime(localStorage.getItem(NOTIFICATION_TIME_KEY)||'07:00')}
async function syncNotificationPreferences(){
  if(!oneSignalInstance) return;
  const enabled = oneSignalInstance.User.PushSubscription.optedIn === true;
  const time = getNotificationTime();
  $('notificationTime').value = time;
  if(enabled) oneSignalInstance.User.addTags({name_wod_notifications:'1',name_wod_time:time,name_wod_timezone:TIMEZONE});
  else oneSignalInstance.User.addTag('name_wod_notifications','0');
}
function refreshNotificationStatus(){
  if(!oneSignalInstance) return;
  const subscription=oneSignalInstance.User.PushSubscription,id=subscription.id,optedIn=subscription.optedIn,permission=oneSignalInstance.Notifications.permission;
  const button=$('enableNotificationsBtn');
  button.disabled=false;
  if(permission&&optedIn&&id){setNotificationStatus('On',`Daily reminder at ${getNotificationTime()} ET. Tap to turn off.`);$('testNotificationBtn').classList.remove('hidden')}
  else if(Notification.permission==='denied'){setNotificationStatus('Blocked','Enable notifications in device settings, then reopen the app.');$('testNotificationBtn').classList.add('hidden')}
  else{setNotificationStatus('Off','Tap to turn on daily workout reminders.');$('testNotificationBtn').classList.add('hidden')}
}
async function showTestNotification(){
  try{
    if(Notification.permission!=='granted'){setNotificationStatus('Not enabled','Enable notifications above before sending a test.');return}
    const name=workoutDisplayName||displayName($('customText').value);
    if(!name){setNotificationStatus('No workout selected','Build a workout before sending a test.');return}
    const message=`Today's workout is ${name}. Open the app to start.`;
    const registration=await navigator.serviceWorker.ready;
    await registration.showNotification('Your Name WOD is ready',{body:message,icon:'icon-192.png',badge:'icon-192.png',tag:'name-wod-test'});
  }catch(error){console.error('Test notification failed.',error);setNotificationStatus('Test failed',error.message||'The test notification could not be sent.')}
}
async function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  try{const registration=await navigator.serviceWorker.register('sw.js',{scope:APP_PATH});console.log('Service worker registered.',registration.scope)}catch(error){console.error('Service worker registration failed.',error)}
}
function hideNotificationControls(){
  const controls=[$('enableNotificationsBtn'),$('notificationTime'),$('testNotificationBtn')];
  controls.forEach(element=>{if(!element)return;const container=element.closest('.setting-row')||element.closest('.utility-row')||element;container.hidden=true});
}
async function initializeNotifications(){
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{
    try{
      await OneSignal.init({appId:ONE_SIGNAL_APP_ID,serviceWorkerPath:'/Name-Workout/sw.js',serviceWorkerParam:{scope:APP_PATH},notifyButton:{enable:false},allowLocalhostAsSecureOrigin:true});
      oneSignalInstance=OneSignal;
      OneSignal.User.PushSubscription.addEventListener('change',async()=>{await syncNotificationPreferences();refreshNotificationStatus()});
      await syncNotificationPreferences();
      refreshNotificationStatus();
    }catch(error){console.error('OneSignal initialization failed.',error);setNotificationStatus('Setup error',error.message||'OneSignal could not initialize.')}
  });
  await registerServiceWorker();
}
function initializeNotificationFeature(){
  if(!ENABLE_NOTIFICATIONS){hideNotificationControls();console.log('Name WOD notifications are disabled.');return}
  initializeNotifications();
  $('enableNotificationsBtn')?.addEventListener('click',async()=>{
    if(!oneSignalInstance){setNotificationStatus('Loading','OneSignal is still starting. Try again shortly.');return}
    try{
      const subscription=oneSignalInstance.User.PushSubscription;
      if(subscription.optedIn){await subscription.optOut();await oneSignalInstance.User.addTag('name_wod_notifications','0')}
      else{const granted=oneSignalInstance.Notifications.permission||await oneSignalInstance.Notifications.requestPermission();if(granted){await subscription.optIn();await syncNotificationPreferences()}}
      refreshNotificationStatus();
    }catch(error){setNotificationStatus('Could not update',error.message||'Notification preference failed.')}
  });
  $('notificationTime')?.addEventListener('change',async event=>{
    const time=normalizeNotificationTime(event.target.value);
    event.target.value=time;
    localStorage.setItem(NOTIFICATION_TIME_KEY,time);
    await syncNotificationPreferences();
    refreshNotificationStatus();
  });
  $('testNotificationBtn')?.addEventListener('click',showTestNotification);
}

$('generateBtn').addEventListener('click',buildWorkoutFromInput);
$('customText').addEventListener('input',event=>{const original=event.target.value;const cleaned=normalizeFirstName(original);if(/\s/.test(original.trim()))event.target.value=cleaned});
$('customText').addEventListener('blur',event=>{event.target.value=normalizeFirstName(event.target.value)});
$('customText').addEventListener('keydown',event=>{if(event.key==='Enter')buildWorkoutFromInput()});
$('clearNameBtn').addEventListener('click',()=>{$('customText').value='';$('customText').focus()});
document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
$('intensityRange').addEventListener('input',updateIntensitySlider);
$('upperCase').addEventListener('change',()=>{
  if(lastBuildKind === 'letters' && lastRawLetters) workoutDisplayName=displayName(lastRawLetters);
  else if(lastBuildKind === 'd20-exercise') workoutDisplayName=applyCase(`D20 × ${lastWorkout.length}`);
  else if(lastBuildKind === 'd20-workout' && lastD20WorkoutRoll) workoutDisplayName=applyCase(`#${lastD20WorkoutRoll} ${D20_WORKOUTS[lastD20WorkoutRoll-1].name}`);
  if(lastWorkout.length) renderPreview();
});
$('startBtn').addEventListener('click',startWorkout);
$('copyBtn').addEventListener('click',event=>copyWorkout({button:event.currentTarget}));
$('finishCopyBtn').addEventListener('click',event=>copyWorkout({completed:true,button:event.currentTarget}));
$('rerollBtn').addEventListener('click',async()=>{setMode('d20');await rollD20Selection({forceAuto:true})});
$('editBtn').addEventListener('click',()=>{$('previewCard').classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'});if(mode==='custom')$('customText').focus()});
$('exitRunnerBtn').addEventListener('click',exitRunner);
$('completeMoveBtn').addEventListener('click',completeCurrentMove);
$('skipMoveBtn').addEventListener('click',()=>{currentMove=(currentMove+1)%lastWorkout.length;renderRunner()});
$('prevMoveBtn').addEventListener('click',()=>{if(currentMove>0){currentMove-=1;renderRunner()}});
$('timerBtn').addEventListener('click',toggleTimer);
$('wakeBtn').addEventListener('click',()=>wakeLock?releaseWakeLock():requestWakeLock());
$('finishCloseBtn').addEventListener('click',closeFinish);
$('finishAgainBtn').addEventListener('click',()=>{closeFinish();$('previewCard').classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'});if(mode==='custom')$('customText').select()});
$('settingsBtn').addEventListener('click',()=>{$('settingsPanel').open=true;$('settingsPanel').scrollIntoView({behavior:'smooth'})});

document.querySelectorAll('input[name="d20Mode"]').forEach(input=>input.addEventListener('change',()=>{resetD20Rolls();updateD20Controls()}));
$('d20AutoRoll').addEventListener('change',()=>{resetD20Rolls();updateD20Controls()});
$('d20RollBtn').addEventListener('click',()=>rollD20Selection());
$('d20ResetBtn').addEventListener('click',resetD20Rolls);

$('dailyNameToggle').checked=dailyNameEnabled;
$('dailyNameToggle').addEventListener('change',event=>{dailyNameEnabled=event.target.checked;localStorage.setItem(DAILY_NAME_ENABLED_KEY,String(dailyNameEnabled));applyScheduledName()});
$('defaultModeSelect').addEventListener('change',event=>{
  const next=saveDefaultMode(event.target.value);
  setMode(next);
  window.scrollTo({top:0,behavior:'smooth'});
});
$('notificationTime').value=getNotificationTime();
initializeNotificationFeature();
syncRange('letterCount','letterCountNumber');
syncRange('maxWordLength','maxWordLengthNumber');
syncRange('d20RollCount','d20RollCountNumber',()=>{if(d20ManualRolls.length)resetD20Rolls();else updateD20Controls()});
renderRecentNames();
renderEditor();
$('defaultModeSelect').value=getDefaultMode();
setMode(getDefaultMode());
updateIntensitySlider();
loadTodaySchedule();

$('resetExercisesBtn').addEventListener('click',()=>{
  if(!confirm('Reset all letter exercises to the balanced default list?')) return;
  exercises=structuredClone(DEFAULT_EXERCISES);
  saveExercises();
  renderEditor();
  if(lastBuildKind==='letters'&&lastRawLetters){lastWorkout=buildWorkout(lastRawLetters);renderPreview()}
});
$('exportExercisesBtn').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(exercises,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download='name-wod-exercises.json';
  anchor.click();
  URL.revokeObjectURL(url);
});
$('importExercisesInput').addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  try{
    const imported=JSON.parse(await file.text());
    Object.keys(DEFAULT_EXERCISES).forEach(letter=>{if(imported[letter])exercises[letter]={...exercises[letter],...imported[letter]}});
    saveExercises();
    renderEditor();
  }catch{alert('That file is not valid exercise JSON.')}
  event.target.value='';
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;$('installBtn').classList.remove('hidden')});
$('installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;await deferredPrompt.prompt();deferredPrompt=null;$('installBtn').classList.add('hidden')});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!$('runner').classList.contains('hidden')&&!wakeLock)requestWakeLock()});
