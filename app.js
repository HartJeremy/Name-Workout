import {
  APP_CONFIG,
  STORAGE_KEYS,
  EXERCISE_LIBRARY_VERSION,
  D20_EXERCISE_LIBRARY_VERSION,
  MODE_HERO_COPY,
  FINISH_MESSAGES,
  INTENSITY_LEVELS,
  buildMascotMessages
} from './config.js';
import {
  LEGACY_DEFAULT_EXERCISES,
  DEFAULT_EXERCISES,
  DEFAULT_D20_EXERCISES,
  D20_WORKOUTS,
  d20WorkoutLabel
} from './workout-data.js';
import { getExerciseGuide } from './exercise-guides.js';

let dictionaryModulePromise = null;
const MASCOT_MESSAGES = buildMascotMessages();
let mascotToastTimer = null;
let lastMascotMessageIndex = -1;
let switchFlashTimer = null;

const $ = id => document.getElementById(id);
let mode = 'd20';
let d20Mode = 'exercise';
let d20Rolling = false;
let d20ManualRolls = [];
let deferredPrompt;
let exercises = loadExercises();
let d20Exercises = loadD20Exercises();
let editorLibrary = 'letters';
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
let dailyNameEnabled = localStorage.getItem(STORAGE_KEYS.dailyNameEnabled) !== 'false';
let currentMove = 0;
const MOVE_STATE = Object.freeze({REMAINING:'remaining',COMPLETED:'completed',SKIPPED:'skipped'});
let moveStates = [];
let skipReviewMode = false;
let skipNoticeTimer = null;
let timerInterval = null;
let timerRemaining = 0;
let timerSwitchTriggered = false;
let wakeLock = null;
let wakeLockDesired = false;
let exerciseInfoReturnFocus = null;
const previewTimers = new Map();

function dateISOForOffset(days = 0) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', {timeZone:APP_CONFIG.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function todayISO(){return dateISOForOffset(0)}

function sameExercise(a,b){
  if(!a || !b) return false;
  return ['amount','unit','name','each','eachLabel'].every(key => (a[key] ?? '') === (b[key] ?? ''));
}

function loadExercises(){
  let saved = null;
  try{saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.exercises));}catch(error){console.warn('Could not load saved exercises.',error)}
  if(!saved || typeof saved !== 'object'){
    localStorage.setItem(STORAGE_KEYS.exerciseLibraryVersion,EXERCISE_LIBRARY_VERSION);
    return structuredClone(DEFAULT_EXERCISES);
  }
  const currentVersion = localStorage.getItem(STORAGE_KEYS.exerciseLibraryVersion);
  const migrated = Object.fromEntries(Object.keys(DEFAULT_EXERCISES).map(letter => {
    const savedEntry = saved[letter];
    if(currentVersion !== EXERCISE_LIBRARY_VERSION && sameExercise(savedEntry,LEGACY_DEFAULT_EXERCISES[letter])){
      return [letter,{...DEFAULT_EXERCISES[letter]}];
    }
    // v2 used Calf Raises for V. Upgrade untouched installs to the more balanced
    // upper-back/posture movement while preserving any user customization.
    if(currentVersion === '2' && letter === 'V' && sameExercise(savedEntry,{amount:20,unit:'reps',name:'Calf Raises'})){
      return [letter,{...DEFAULT_EXERCISES[letter]}];
    }
    return [letter,{...DEFAULT_EXERCISES[letter],...(savedEntry || {})}];
  }));
  localStorage.setItem(STORAGE_KEYS.exercises,JSON.stringify(migrated));
  localStorage.setItem(STORAGE_KEYS.exerciseLibraryVersion,EXERCISE_LIBRARY_VERSION);
  return migrated;
}
function saveExercises(){
  localStorage.setItem(STORAGE_KEYS.exercises,JSON.stringify(exercises));
  localStorage.setItem(STORAGE_KEYS.exerciseLibraryVersion,EXERCISE_LIBRARY_VERSION);
}
function loadD20Exercises(){
  let saved = null;
  try{saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.d20Exercises));}catch(error){console.warn('Could not load saved D20 exercises.',error)}
  if(!Array.isArray(saved)){
    localStorage.setItem(STORAGE_KEYS.d20ExerciseLibraryVersion,D20_EXERCISE_LIBRARY_VERSION);
    return structuredClone(DEFAULT_D20_EXERCISES);
  }
  const merged = DEFAULT_D20_EXERCISES.map((entry,index) => ({...entry,...(saved[index] || {})}));
  localStorage.setItem(STORAGE_KEYS.d20Exercises,JSON.stringify(merged));
  localStorage.setItem(STORAGE_KEYS.d20ExerciseLibraryVersion,D20_EXERCISE_LIBRARY_VERSION);
  return merged;
}
function saveD20Exercises(){
  localStorage.setItem(STORAGE_KEYS.d20Exercises,JSON.stringify(d20Exercises));
  localStorage.setItem(STORAGE_KEYS.d20ExerciseLibraryVersion,D20_EXERCISE_LIBRARY_VERSION);
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
    localStorage.setItem(STORAGE_KEYS.defaultMode,'d20');
    if($('defaultModeSelect')) $('defaultModeSelect').value = 'd20';
  }
  if(!hasRemainingNames && mode === 'custom') setMode('d20');
}

async function loadTodaySchedule(){
  try{
    const response = await fetch(APP_CONFIG.scheduleUrl,{cache:'no-store'});
    if(!response.ok) throw new Error(`Schedule returned ${response.status}`);
    scheduleData = await response.json();
    scheduleLoaded = true;
    todayScheduleEntry = scheduleData.find(entry => entry.date === todayISO()) || null;
    if(!todayScheduleEntry) console.warn('No Name workout schedule entry for',todayISO());
  }catch(error){
    scheduleData = [];
    scheduleLoaded = false;
    todayScheduleEntry = null;
    console.warn('Could not load today’s Name workout schedule.',error);
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
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.recentNames)) || [];
    const cleaned = [...new Set(saved.map(normalizeFirstName).filter(Boolean))].slice(0,6);
    if(JSON.stringify(saved) !== JSON.stringify(cleaned)) localStorage.setItem(STORAGE_KEYS.recentNames,JSON.stringify(cleaned));
    return cleaned;
  }catch{return []}
}
function rememberName(name){
  if(mode !== 'custom') return;
  const firstName = normalizeFirstName(name);
  if(!firstName) return;
  const names = [firstName,...loadRecentNames().filter(item => item.toLowerCase() !== firstName.toLowerCase())].slice(0,6);
  localStorage.setItem(STORAGE_KEYS.recentNames,JSON.stringify(names));
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

function initializeBranding(){
  const trigger = $('mascotTrigger');
  if(!trigger) return;
  const label = `${APP_CONFIG.mascot.name}, the ${APP_CONFIG.name} ${APP_CONFIG.mascot.type}`;
  trigger.setAttribute('aria-label',label);
  trigger.title = APP_CONFIG.mascot.name;
}

function getDefaultMode(){
  const saved = localStorage.getItem(STORAGE_KEYS.defaultMode);
  return ['custom','letters','word','d20'].includes(saved) ? saved : 'd20';
}
function saveDefaultMode(value){
  const next = ['custom','letters','word','d20'].includes(value) ? value : 'd20';
  localStorage.setItem(STORAGE_KEYS.defaultMode,next);
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
  updateHeroCopy();
  updateBuilderCopy();
}

function updateHeroCopy(){
  const hero = MODE_HERO_COPY[mode] || MODE_HERO_COPY.d20;
  $('heroVerb').textContent = hero.verb;
  $('heroBuild').textContent = 'Build it.';
  $('heroDescription').textContent = hero.description;
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
  if(!dictionaryModulePromise) dictionaryModulePromise = import(APP_CONFIG.dictionaryModuleUrl).catch(error => {
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
  if(entry.each === 'split'){
    detail = entry.unit === 'sec' ? `${amount/2} sec each ${entry.eachLabel}` : `${amount/2} each ${entry.eachLabel}`;
  }else if(entry.each === 'perSide'){
    displayAmount = amount*2;
    detail = entry.unit === 'sec' ? `${amount} sec each ${entry.eachLabel}` : `${amount} each ${entry.eachLabel}`;
  }
  return {
    amount:displayAmount,
    headline:entry.unit === 'sec' ? `${displayAmount}-second ${entry.name}` : `${displayAmount} ${entry.name}`,
    detail
  };
}

function timedSideSwitchAt(item){
  if(!item || item.unit !== 'sec' || !item.each || Number(item.amount) < 2) return null;
  return Math.floor(Number(item.amount)/2);
}
function switchCueText(item){
  const label = String(item?.eachLabel || 'side').trim().toLowerCase();
  const labels = {side:'SWITCH SIDES',leg:'SWITCH LEGS',arm:'SWITCH ARMS',shoulder:'SWITCH SHOULDERS'};
  return labels[label] || `SWITCH ${label.toUpperCase()}`;
}
function showSwitchCue(item){
  const cue = $('switchFlash');
  if(!cue) return;
  const strong = document.createElement('strong');
  const small = document.createElement('small');
  strong.textContent = switchCueText(item);
  small.textContent = 'HALFWAY';
  cue.replaceChildren(strong,small);
  cue.classList.remove('show');
  void cue.offsetWidth;
  cue.classList.add('show');
  if(switchFlashTimer) clearTimeout(switchFlashTimer);
  switchFlashTimer = setTimeout(()=>{cue.classList.remove('show');cue.replaceChildren()},1250);
  vibrate([100,60,100,60,180]);
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
  return rolls.map(roll => entryToMove(d20Exercises[roll-1],roll,roll));
}
function buildD20TemplateWorkout(roll){
  const template = D20_WORKOUTS[roll-1];
  if(!template) return [];
  return template.rolls.map((exerciseRoll,index) => entryToMove(d20Exercises[exerciseRoll-1],index+1,exerciseRoll));
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

function showMascotMessage(){
  const toast = $('mascotToast');
  if(!toast) return;
  let messageIndex = secureRandomInt(MASCOT_MESSAGES.length);
  if(MASCOT_MESSAGES.length > 1 && messageIndex === lastMascotMessageIndex){
    messageIndex = (messageIndex + 1 + secureRandomInt(MASCOT_MESSAGES.length - 1)) % MASCOT_MESSAGES.length;
  }
  lastMascotMessageIndex = messageIndex;
  const message = MASCOT_MESSAGES[messageIndex];
  toast.textContent = message;
  toast.classList.add('show');
  if(mascotToastTimer) clearTimeout(mascotToastTimer);
  mascotToastTimer = setTimeout(()=>toast.classList.remove('show'),APP_CONFIG.mascot.toastDurationMs);
  vibrate(20);
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

// Self-contained canvas D20. It keeps the PWA offline-capable while providing a
// real 20-face die, face numbers, drag rotation, flick direction and a settled result.
const D20_GEOMETRY = (() => {
  const p=(1+Math.sqrt(5))/2;
  const vertices=[[-1,p,0],[1,p,0],[-1,-p,0],[1,-p,0],[0,-1,p],[0,1,p],[0,-1,-p],[0,1,-p],[p,0,-1],[p,0,1],[-p,0,-1],[-p,0,1]]
    .map(v=>{const n=Math.hypot(...v);return v.map(x=>x/n)});
  const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const info=faces.map(indices=>{
    const c=indices.reduce((a,i)=>a.map((x,k)=>x+vertices[i][k]),[0,0,0]).map(x=>x/3);
    const n=Math.hypot(...c);return {indices,normal:c.map(x=>x/n),num:0};
  });
  let next=1;
  info.forEach((face,i)=>{
    if(face.num) return;
    let best=-1,bestDot=1;
    info.forEach((other,k)=>{if(k===i||other.num)return;const d=face.normal.reduce((sum,x,q)=>sum+x*other.normal[q],0);if(d<bestDot){bestDot=d;best=k}});
    face.num=next; if(best>=0) info[best].num=21-next; next+=1;
  });
  return {vertices,faces:info};
})();

function qNorm(q){const n=Math.hypot(q[0],q[1],q[2],q[3])||1;return q.map(x=>x/n)}
function qMul(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]}
function qAxis(axis,angle){const n=Math.hypot(...axis)||1,s=Math.sin(angle/2)/n;return [axis[0]*s,axis[1]*s,axis[2]*s,Math.cos(angle/2)]}
function qRotate(v,q){const u=[q[0],q[1],q[2]],uv=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],uuv=[u[1]*uv[2]-u[2]*uv[1],u[2]*uv[0]-u[0]*uv[2],u[0]*uv[1]-u[1]*uv[0]];return v.map((x,i)=>x+2*(q[3]*uv[i]+uuv[i]))}
function qFromVectors(a,b){
  const dot=a.reduce((sum,x,i)=>sum+x*b[i],0);let xyz,w=1+dot;
  if(w<1e-6){xyz=Math.abs(a[0])>Math.abs(a[2])?[-a[1],a[0],0]:[0,-a[2],a[1]];w=0}
  else xyz=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  return qNorm([xyz[0],xyz[1],xyz[2],w]);
}
function qSlerp(a,b,t){
  let bb=[...b],cos=a.reduce((s,x,i)=>s+x*bb[i],0);if(cos<0){bb=bb.map(x=>-x);cos=-cos}
  if(cos>.9995)return qNorm(a.map((x,i)=>x+t*(bb[i]-x)));
  const th=Math.acos(Math.min(1,cos)),sin=Math.sin(th),w1=Math.sin((1-t)*th)/sin,w2=Math.sin(t*th)/sin;
  return a.map((x,i)=>x*w1+bb[i]*w2);
}

class D20CanvasRenderer{
  constructor(canvas,shadow){
    this.canvas=canvas;this.ctx=canvas?.getContext?.('2d');this.shadow=shadow;this.q=qNorm([.16,.28,.04,.94]);this.state='idle';this.hasRolled=false;this.last=performance.now();this.offsetX=0;this.offsetY=0;this.resolve=null;this.reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resizeObserver=null;
    if(!this.ctx)return;
    this.resize=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));this.dpr=d};
    this.resizeObserver=new ResizeObserver(this.resize);this.resizeObserver.observe(canvas);this.resize();requestAnimationFrame(t=>this.frame(t));
  }
  isIdle(){return this.state==='idle'}
  drag(dx,dy){if(!this.ctx||!this.isIdle())return;const qx=qAxis([1,0,0],dy*.012),qy=qAxis([0,1,0],dx*.012);this.q=qNorm(qMul(qy,qMul(qx,this.q)));this.draw()}
  targetFor(num){const face=D20_GEOMETRY.faces.find(f=>f.num===num)||D20_GEOMETRY.faces[0];const align=qFromVectors(face.normal,[0,0,1]),spin=qAxis([0,0,1],(secureRandomInt(628)/100));return qNorm(qMul(spin,align))}
  roll(num,duration=700,gesture=null){
    if(!this.ctx)return wait(duration);
    if(this.resolve)this.resolve();
    const now=performance.now();this.state='roll';this.started=now;this.duration=Math.max(this.reduce?80:duration,80);this.final=num;this.target=this.targetFor(num);this.startQ=[...this.q];this.power=gesture?.power??.62;this.flickX=gesture?.vx?Math.max(-1,Math.min(1,gesture.vx/1800)):0;const vx=gesture?.vx||420,vy=gesture?.vy||-680;this.axis=[vy,vx,260];const an=Math.hypot(...this.axis)||1;this.axis=this.axis.map(x=>x/an);this.hasRolled=true;
    return new Promise(resolve=>{this.resolve=resolve});
  }
  frame(now){
    const dt=Math.min((now-this.last)/1000,.05);this.last=now;
    if(this.state==='roll'){
      const p=Math.min((now-this.started)/this.duration,1),speed=this.reduce?0:((18+19*this.power)*Math.pow(1-p,1.6)+3.5);this.q=qNorm(qMul(qAxis(this.axis,speed*dt),this.q));this.offsetY=this.reduce?0:Math.abs(Math.sin(p*Math.PI*2.35))*(.3+.25*this.power)*(1-p*.45);this.offsetX=this.reduce?0:this.flickX*.5*this.power*Math.sin(p*Math.PI);
      if(p>=1){this.state='settle';this.started=now;this.settleFrom=[...this.q];this.settleDuration=this.reduce?80:560}
    }else if(this.state==='settle'){
      const p=Math.min((now-this.started)/this.settleDuration,1),e=1-Math.pow(1-p,3);this.q=qSlerp(this.settleFrom,this.target,e);this.offsetX*=1-e;this.offsetY=Math.sin(p*Math.PI)*.08*(1-p);
      if(p>=1){this.q=[...this.target];this.state='idle';this.offsetX=0;this.offsetY=0;const done=this.resolve;this.resolve=null;done?.()}
    }else if(!this.hasRolled){this.q=qNorm(qMul(qAxis([.25,1,.12],dt*.28),this.q))}
    this.draw();requestAnimationFrame(t=>this.frame(t));
  }
  draw(){
    if(!this.ctx)return;const c=this.canvas,ctx=this.ctx,d=this.dpr||1,w=c.width/d,h=c.height/d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);const cx=w/2+this.offsetX*w*.2,cy=h*.47-this.offsetY*h*.24,cam=4.2,scale=Math.min(w,h)*1.55;
    const verts=D20_GEOMETRY.vertices.map(v=>{const r=qRotate(v,this.q),k=scale/(cam-r[2]);return {x:cx+r[0]*k,y:cy-r[1]*k,z:r[2]}});
    const light=[-.35,.5,.79],faces=[];
    D20_GEOMETRY.faces.forEach(face=>{const n=qRotate(face.normal,this.q);if(n[2]<=.02)return;const pts=face.indices.map(i=>verts[i]),z=pts.reduce((s,p)=>s+p.z,0)/3;faces.push({face,n,pts,z})});faces.sort((a,b)=>a.z-b.z);
    faces.forEach(({face,n,pts,z})=>{const lit=Math.max(.08,n[0]*light[0]+n[1]*light[1]+n[2]*light[2]),b=.58+.42*lit;const base=[255,190,25].map(x=>Math.round(x*b));ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);ctx.lineTo(pts[1].x,pts[1].y);ctx.lineTo(pts[2].x,pts[2].y);ctx.closePath();ctx.fillStyle=`rgb(${base.join(',')})`;ctx.fill();ctx.lineWidth=Math.max(1.2,w/150);ctx.strokeStyle='rgba(255,230,135,.72)';ctx.stroke();const mx=(pts[0].x+pts[1].x+pts[2].x)/3,my=(pts[0].y+pts[1].y+pts[2].y)/3;const edge=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);ctx.fillStyle='#171000';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(10,edge*.34)}px system-ui,-apple-system,sans-serif`;ctx.fillText(String(face.num),mx,my+1)});
    if(this.shadow){const lift=Math.min(.5,this.offsetY);this.shadow.style.transform=`translateX(${this.offsetX*38}px) scale(${1-lift*.35})`;this.shadow.style.opacity=String(.62-lift*.35)}
  }
}

const d20Visual = new D20CanvasRenderer($('d20Canvas'),$('d20Shadow'));
let pendingD20Gesture = null;
let suppressD20ClickUntil = 0;

async function animateD20(finalValue,duration = 850){
  const value=$('d20Value');value.textContent='…';value.classList.remove('landed');
  const gesture=pendingD20Gesture;pendingD20Gesture=null;
  await d20Visual.roll(finalValue,duration,gesture);
  value.textContent=String(finalValue);value.classList.add('landed');
  vibrate(35);
}

function setupD20GestureControls(){
  const stage=$('d20RollBtn'),visual=stage?.querySelector('.d20-visual');if(!stage||!visual)return;
  let active=false,lastX=0,lastY=0,startX=0,startY=0,moved=0,samples=[];
  visual.addEventListener('pointerdown',event=>{
    if(d20Rolling)return;active=true;startX=lastX=event.clientX;startY=lastY=event.clientY;moved=0;samples=[{t:performance.now(),x:event.clientX,y:event.clientY}];
    visual.classList.add('dragging');try{visual.setPointerCapture(event.pointerId)}catch{}event.preventDefault();
  });
  visual.addEventListener('pointermove',event=>{
    if(!active||d20Rolling)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;moved=Math.max(moved,Math.hypot(event.clientX-startX,event.clientY-startY));samples.push({t:performance.now(),x:event.clientX,y:event.clientY});if(samples.length>8)samples.shift();d20Visual.drag(dx,dy);event.preventDefault();
  });
  const end=event=>{
    if(!active)return;active=false;visual.classList.remove('dragging');if(d20Rolling)return;
    const now=performance.now(),recent=samples.filter(s=>now-s.t<150),a=recent[0]||samples[0],b=recent.at(-1)||a,dt=Math.max(((b?.t||now)-(a?.t||now))/1000,.016),vx=((b?.x||lastX)-(a?.x||startX))/dt,vy=((b?.y||lastY)-(a?.y||startY))/dt,speed=Math.hypot(vx,vy);
    suppressD20ClickUntil=performance.now()+500;
    if(moved>10) pendingD20Gesture={vx,vy,power:Math.max(.35,Math.min(1,speed/2200))};
    rollD20Selection();event?.preventDefault?.();
  };
  visual.addEventListener('pointerup',end);visual.addEventListener('pointercancel',()=>{active=false;visual.classList.remove('dragging')});
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
    const exercise = d20Exercises[roll-1];
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
  $('d20RollBtn').setAttribute('aria-busy',String(isRolling));
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
    const duration = count <= 6 ? 760 : count <= 12 ? 620 : 500;
    for(let index=0; index<count; index+=1){
      const roll = rollD20();
      await animateD20(roll,duration);
      d20ManualRolls.push(roll);
      renderD20History(d20ManualRolls);
      $('d20Status').textContent = `Roll ${index+1} of ${count}: ${roll} — ${d20Exercises[roll-1].name}`;
      if(index < count-1) await wait(APP_CONFIG.d20.autoRollPauseMs);
    }
    finalizeD20ExerciseWorkout(d20ManualRolls);
    return;
  }

  if(d20ManualRolls.length >= count) resetD20Rolls();
  const roll = rollD20();
  await animateD20(roll,APP_CONFIG.d20.manualRollDurationMs);
  d20ManualRolls.push(roll);
  renderD20History(d20ManualRolls);
  $('d20Status').textContent = `Roll ${d20ManualRolls.length} of ${count}: ${roll} — ${d20Exercises[roll-1].name}`;
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
  await animateD20(roll,APP_CONFIG.d20.workoutRollDurationMs);
  lastD20WorkoutRoll = roll;
  lastD20Rolls = [roll];
  lastWorkout = buildD20TemplateWorkout(roll);
  lastRawLetters = '';
  lastBuildKind = 'd20-workout';
  const template = D20_WORKOUTS[roll-1];
  workoutDisplayName = applyCase(`#${roll} ${d20WorkoutLabel(template)}`);
  $('d20RollHistory').innerHTML = `<span class="workout-roll-result"><b>D20 ${roll}</b><strong>${escapeHtml(template.name)}</strong><small>${escapeHtml(template.group)} • ${template.rolls.length} moves</small></span>`;
  $('d20Status').textContent = `D20 ${roll}: ${d20WorkoutLabel(template)}.`;
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
  const item = lastWorkout[Number(index)];
  const switchAt = timedSideSwitchAt(item);
  const label = button.querySelector('.timer-btn-time');
  const state = previewTimers.get(index) || {remaining:seconds,interval:null,switchTriggered:false};
  if(state.interval){
    clearInterval(state.interval);
    state.interval = null;
    button.classList.remove('running');
    label.textContent = `${state.remaining}s`;
    previewTimers.set(index,state);
    return;
  }
  if(state.remaining <= 0){state.remaining = seconds;state.switchTriggered = false}
  button.classList.remove('done');
  button.classList.add('running');
  label.textContent = `${state.remaining}s`;
  state.interval = setInterval(() => {
    state.remaining -= 1;
    if(switchAt !== null && !state.switchTriggered && state.remaining === switchAt){
      state.switchTriggered = true;
      showSwitchCue(item);
    }
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
    $('workoutTagline').textContent = `D20 ${lastD20WorkoutRoll} selected ${d20WorkoutLabel(template)}.`;
  }else if(mode === 'custom'){
    $('workoutTagline').textContent = `${workoutDisplayName} is today’s workout. Spell every letter in sweat.`;
  }else{
    $('workoutTagline').textContent = 'Every letter earns a move.';
  }
  $('exercisePreview').innerHTML = lastWorkout.map((item,index) => {
    const subtext = item.detail ? item.detail : (item.sourceRoll ? '' : 'Complete the full amount');
    return `<div class="preview-move"><span class="preview-letter">${escapeHtml(item.letter)}</span><span><b>${escapeHtml(item.headline)}</b>${subtext?`<small>${escapeHtml(subtext)}</small>`:''}</span><span class="preview-row-actions"><button class="preview-info-btn" type="button" data-info-index="${index}" aria-label="How to do ${escapeHtml(item.name)}">i</button>${item.unit==='sec'?`<button class="preview-timer-btn" type="button" data-index="${index}" data-seconds="${item.amount}"><span class="timer-btn-time">${item.amount}s</span></button>`:`<em class="preview-index">${index+1}</em>`}</span></div>`;
  }).join('');
  document.querySelectorAll('.preview-timer-btn').forEach(button => button.addEventListener('click',() => togglePreviewTimer(button)));
  document.querySelectorAll('.preview-info-btn').forEach(button => button.addEventListener('click',() => openExerciseInfo(Number(button.dataset.infoIndex),button)));
  $('rerollBtn').classList.toggle('hidden',!lastBuildKind.startsWith('d20'));
  renderTomorrowName();
}

function workoutText({completed=false} = {}){
  const completedCount = moveStates.filter(state => state === MOVE_STATE.COMPLETED).length;
  const skippedCount = moveStates.filter(state => state === MOVE_STATE.SKIPPED).length;
  const lead = completed
    ? skippedCount > 0
      ? `✅ ${workoutDisplayName} complete — ${completedCount} of ${lastWorkout.length}`
      : `✅ ${workoutDisplayName} complete`
    : `Today's workout: ${workoutDisplayName}`;
  const lines = [lead];
  if(lastBuildKind === 'd20-exercise' && lastD20Rolls.length) lines.push(`🎲 D20 rolls: ${lastD20Rolls.join(', ')}`);
  if(lastBuildKind === 'd20-workout' && lastD20WorkoutRoll) lines.push(`🎲 D20 roll: ${lastD20WorkoutRoll}`);
  const workoutItems = completed
    ? lastWorkout.filter((_,index) => moveStates[index] === MOVE_STATE.COMPLETED)
    : lastWorkout;
  lines.push('',...workoutItems.map((item,index) => `${index+1}. ${item.headline}${item.detail?` (${item.detail})`:''}`));
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

function openExerciseInfo(index,trigger=null){
  const item = lastWorkout[index];
  if(!item) return;
  exerciseInfoReturnFocus = trigger || document.activeElement;
  const guide = getExerciseGuide(item.name);
  $('exerciseInfoGuideLabel').textContent = `${APP_CONFIG.mascot.name.toUpperCase()}'S QUICK GUIDE`;
  $('exerciseInfoTitle').textContent = item.name;
  $('exerciseInfoAmount').textContent = item.headline + (item.detail ? ` - ${item.detail}` : '');
  $('exerciseInfoHow').textContent = guide?.how || 'No built-in guide is saved for this custom exercise yet.';
  $('exerciseInfoCue').textContent = guide?.cue || 'Use a controlled range of motion and stop if the movement does not feel right.';
  $('exerciseInfoEasier').textContent = guide?.easier || 'Reduce the range, pace, or repetitions as needed.';
  $('exerciseInfoSheet').classList.remove('hidden');
  document.body.classList.add('info-open');
  $('exerciseInfoCloseBtn').focus();
}
function closeExerciseInfo(){
  $('exerciseInfoSheet').classList.add('hidden');
  document.body.classList.remove('info-open');
  const target = exerciseInfoReturnFocus;
  exerciseInfoReturnFocus = null;
  try{target?.focus({preventScroll:true})}catch(_){target?.focus?.()}
}

function updateWakeButton(){
  const button = $('wakeBtn');
  if(!button) return;
  const supported = 'wakeLock' in navigator;
  const active = Boolean(wakeLock);
  button.setAttribute('aria-pressed',String(active));
  button.classList.toggle('unsupported',!supported);
  button.title = !supported ? 'Keep awake is unavailable on this device' : active ? 'Screen will stay awake' : 'Use normal screen timeout';
  button.setAttribute('aria-label',button.title);
}
async function requestWakeLock({notify=false}={}){
  if(!('wakeLock' in navigator)){
    updateWakeButton();
    if(notify) showRunnerNotice('KEEP AWAKE IS NOT AVAILABLE ON THIS DEVICE',{tone:'wake',duration:1800});
    return false;
  }
  try{
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release',()=>{wakeLock=null;updateWakeButton()},{once:true});
    updateWakeButton();
    if(notify) showRunnerNotice('SCREEN WILL STAY AWAKE',{tone:'wake'});
    return true;
  }catch(error){
    console.warn('Wake lock unavailable.',error);
    wakeLock=null;
    updateWakeButton();
    if(notify) showRunnerNotice('KEEP AWAKE COULD NOT BE TURNED ON',{tone:'wake',duration:1800});
    return false;
  }
}
async function releaseWakeLock({notify=false}={}){
  try{await wakeLock?.release()}catch{}
  wakeLock=null;
  updateWakeButton();
  if(notify) showRunnerNotice('NORMAL SCREEN TIMEOUT RESTORED',{tone:'wake'});
}
function workoutStateCounts(){
  const completed = moveStates.filter(state => state === MOVE_STATE.COMPLETED).length;
  const skipped = moveStates.filter(state => state === MOVE_STATE.SKIPPED).length;
  const remaining = moveStates.filter(state => state === MOVE_STATE.REMAINING).length;
  return {completed,skipped,remaining,total:lastWorkout.length};
}
function startWorkout(){
  if(!lastWorkout.length) return;
  currentMove = 0;
  moveStates = Array(lastWorkout.length).fill(MOVE_STATE.REMAINING);
  skipReviewMode = false;
  $('skipReviewScreen')?.classList.add('hidden');
  $('runner').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  wakeLockDesired = true;
  requestWakeLock();
  renderRunner();
}
function renderRunner(){
  clearTimer();
  const item = lastWorkout[currentMove];
  const counts = workoutStateCounts();
  const currentState = moveStates[currentMove] || MOVE_STATE.REMAINING;
  $('runnerName').textContent = workoutDisplayName || 'TODAY’S WOD';
  $('runnerProgressText').textContent = `${currentMove+1} OF ${lastWorkout.length}`;
  $('runnerStateSummary').textContent = `${counts.completed} done • ${counts.skipped} skipped • ${counts.remaining} left`;
  $('progressBar').style.width = `${lastWorkout.length ? (counts.completed/lastWorkout.length)*100 : 0}%`;
  $('runnerStateDots').innerHTML = moveStates.map((state,index) => {
    const current = index === currentMove ? ' current' : '';
    const symbol = state === MOVE_STATE.COMPLETED ? '✓' : state === MOVE_STATE.SKIPPED ? '–' : '';
    const label = `Move ${index+1}: ${state}${index===currentMove?', current':''}`;
    return `<span class="runner-state-dot ${state}${current}" aria-label="${escapeHtml(label)}">${symbol}</span>`;
  }).join('');
  $('runnerLetter').textContent = item.letter;
  $('runnerExercise').textContent = item.headline;
  $('runnerSplit').textContent = item.detail;
  $('runnerInfoBtn').setAttribute('aria-label',`How to do ${item.name}`);
  updateWakeButton();
  $('runnerMoveState').textContent = currentState === MOVE_STATE.SKIPPED ? 'SKIPPED — finish it now or leave it skipped' : currentState === MOVE_STATE.COMPLETED ? 'COMPLETED' : '';
  $('runnerMoveState').className = `runner-move-state ${currentState}`;
  $('prevMoveBtn').disabled = currentMove === 0;
  const completeButton = $('completeMoveBtn');
  completeButton.querySelector('span').textContent = currentState === MOVE_STATE.COMPLETED ? 'COMPLETED' : currentState === MOVE_STATE.SKIPPED ? 'DONE NOW' : 'DONE';
  completeButton.querySelector('small').textContent = currentState === MOVE_STATE.SKIPPED ? 'Clear this skip' : 'Tap and keep moving';
  $('skipMoveBtn').textContent = currentState === MOVE_STATE.SKIPPED ? 'Skipped' : 'Skip';
  $('skipMoveBtn').disabled = currentState === MOVE_STATE.COMPLETED;
  if(item.unit === 'sec'){
    $('timerBox').classList.remove('hidden');
    timerRemaining = item.amount;
    timerSwitchTriggered = false;
    updateTimerDisplay();
  }else $('timerBox').classList.add('hidden');
}
function showRunnerNotice(message,{tone='skip',duration=1100}={}){
  const notice = $('runnerSkipNotice');
  if(!notice) return;
  clearTimeout(skipNoticeTimer);
  notice.textContent = message;
  notice.classList.toggle('wake',tone === 'wake');
  notice.classList.add('show');
  skipNoticeTimer = setTimeout(()=>notice.classList.remove('show'),duration);
}
function showSkipNotice(){showRunnerNotice('SKIPPED - you can come back')}
function markMoveSkipped(index,{notify=true}={}){
  if(moveStates[index] === MOVE_STATE.REMAINING){
    moveStates[index] = MOVE_STATE.SKIPPED;
    if(notify){showSkipNotice();vibrate(18)}
  }
}
let runnerSwipeAnimating=false;
function runnerTarget(delta){const next=currentMove+delta;return next>=0&&next<lastWorkout.length?next:null}
async function navigateRunner(delta,{animate=true,fromDrag=0,markSkip=false}={}){
  if(runnerSwipeAnimating)return;
  if(markSkip && delta>0) markMoveSkipped(currentMove);
  const main=$('runnerMain');
  let next;
  if(skipReviewMode){
    const skippedIndexes=moveStates.map((state,index)=>state===MOVE_STATE.SKIPPED?index:-1).filter(index=>index>=0);
    next=delta>0
      ? skippedIndexes.find(index=>index>currentMove) ?? null
      : [...skippedIndexes].reverse().find(index=>index<currentMove) ?? null;
  }else next=runnerTarget(delta);
  if(next===null){
    if(main){main.style.transform='';main.style.opacity=''}
    if(delta>0) resolveWorkoutEnd();
    else vibrate(14);
    return;
  }
  clearTimer();runnerSwipeAnimating=true;
  if(animate&&main?.animate){
    const width=Math.max(main.clientWidth,320),out=delta>0?-width*.48:width*.48;
    try{await main.animate([{transform:`translateX(${fromDrag}px)`,opacity:Math.max(.45,1-Math.abs(fromDrag)/width)},{transform:`translateX(${out}px)`,opacity:.05}],{duration:130,easing:'ease-out',fill:'forwards'}).finished}catch{}
    currentMove=next;renderRunner();main.getAnimations().forEach(a=>a.cancel());const incoming=delta>0?width*.2:-width*.2;
    try{await main.animate([{transform:`translateX(${incoming}px)`,opacity:.15},{transform:'translateX(0)',opacity:1}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'}).finished}catch{}
  }else{currentMove=next;renderRunner()}
  if(main){main.style.transform='';main.style.opacity=''}runnerSwipeAnimating=false;
}
function setupRunnerSwipe(){
  const main=$('runnerMain');if(!main)return;let active=false,sx=0,sy=0,dx=0,dy=0;
  main.addEventListener('pointerdown',event=>{if(event.target.closest('button')||runnerSwipeAnimating)return;active=true;sx=event.clientX;sy=event.clientY;dx=dy=0;try{main.setPointerCapture(event.pointerId)}catch{}});
  main.addEventListener('pointermove',event=>{if(!active)return;dx=event.clientX-sx;dy=event.clientY-sy;if(Math.abs(dx)>Math.abs(dy)*1.05){const atEdge=(dx>0&&currentMove===0);const resistance=atEdge ? .38 : 1;main.style.transform=`translateX(${dx*resistance}px)`;main.style.opacity=String(Math.max(.55,1-Math.abs(dx)/(main.clientWidth*1.5)));event.preventDefault()}});
  const end=()=>{if(!active)return;active=false;const threshold=Math.min(90,Math.max(55,main.clientWidth*.18));if(Math.abs(dx)>=threshold&&Math.abs(dx)>Math.abs(dy)*1.15){navigateRunner(dx<0?1:-1,{animate:true,fromDrag:dx,markSkip:dx<0})}else if(main.animate){main.animate([{transform:`translateX(${dx}px)`,opacity:main.style.opacity||1},{transform:'translateX(0)',opacity:1}],{duration:150,easing:'ease-out'}).finished.finally(()=>{main.style.transform='';main.style.opacity=''})}else{main.style.transform='';main.style.opacity=''}};
  main.addEventListener('pointerup',end);main.addEventListener('pointercancel',()=>{active=false;main.style.transform='';main.style.opacity=''});
}

function updateTimerDisplay(){
  $('timerValue').textContent = timerRemaining;
  $('timerBtn').textContent = timerInterval ? 'PAUSE TIMER' : timerRemaining === 0 ? 'RESET TIMER' : 'START TIMER';
}
function clearTimer(){if(timerInterval) clearInterval(timerInterval);timerInterval=null}
function toggleTimer(){
  const item = lastWorkout[currentMove];
  const switchAt = timedSideSwitchAt(item);
  if(timerRemaining === 0){timerRemaining = item.amount;timerSwitchTriggered = false}
  if(timerInterval){clearTimer();updateTimerDisplay();return}
  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    updateTimerDisplay();
    if(switchAt !== null && !timerSwitchTriggered && timerRemaining === switchAt){
      timerSwitchTriggered = true;
      showSwitchCue(item);
    }
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
function nextMoveWithState(state,{after=currentMove}={}){
  for(let index=after+1;index<moveStates.length;index++) if(moveStates[index]===state) return index;
  return moveStates.findIndex(value=>value===state);
}
function completeCurrentMove(){
  moveStates[currentMove] = MOVE_STATE.COMPLETED;
  vibrate(40);
  const counts = workoutStateCounts();
  if(skipReviewMode){
    const nextSkipped = nextMoveWithState(MOVE_STATE.SKIPPED);
    if(nextSkipped !== -1){currentMove=nextSkipped;renderRunner();return}
    skipReviewMode=false;
    finishWorkout();
    return;
  }
  if(counts.remaining === 0){resolveWorkoutEnd();return}
  const nextRemaining = nextMoveWithState(MOVE_STATE.REMAINING);
  if(nextRemaining !== -1){currentMove=nextRemaining;renderRunner();return}
  resolveWorkoutEnd();
}
function skipCurrentMove(){
  if(moveStates[currentMove] === MOVE_STATE.COMPLETED) return;
  markMoveSkipped(currentMove);
  if(skipReviewMode){
    const nextSkipped = nextMoveWithState(MOVE_STATE.SKIPPED);
    if(nextSkipped !== -1 && nextSkipped !== currentMove){currentMove=nextSkipped;renderRunner();return}
    showSkipReview();
    return;
  }
  const next=runnerTarget(1);
  if(next===null){resolveWorkoutEnd();return}
  currentMove=next;renderRunner();
}
function resolveWorkoutEnd(){
  const counts=workoutStateCounts();
  if(counts.remaining>0){
    const nextRemaining=moveStates.findIndex(state=>state===MOVE_STATE.REMAINING);
    if(nextRemaining!==-1){currentMove=nextRemaining;renderRunner();return}
  }
  if(counts.skipped>0){showSkipReview();return}
  finishWorkout();
}
function showSkipReview(){
  clearTimer();
  skipReviewMode=false;
  $('runner').classList.add('hidden');
  const skippedIndexes=moveStates.map((state,index)=>state===MOVE_STATE.SKIPPED?index:-1).filter(index=>index>=0);
  const count=skippedIndexes.length;
  $('skipReviewTitle').textContent=`${count} ${count===1?'MOVE':'MOVES'} SKIPPED`;
  $('skipReviewText').textContent=count===1?'Finish it now, or complete the workout without it.':'Finish them now, or complete the workout without them.';
  $('skipReviewList').innerHTML=skippedIndexes.map(index=>`<div class="skip-review-item"><span>${index+1}</span><b>${escapeHtml(lastWorkout[index].headline)}</b></div>`).join('');
  $('doSkippedBtn').querySelector('span').textContent=count===1?'DO SKIPPED EXERCISE':'DO SKIPPED EXERCISES';
  $('finishWithSkipsBtn').textContent=count===1?'FINISH WITHOUT IT':'FINISH WITHOUT THEM';
  $('skipReviewScreen').classList.remove('hidden');
  vibrate([60,70,60]);
}
function resumeSkippedExercises(){
  const firstSkipped=moveStates.findIndex(state=>state===MOVE_STATE.SKIPPED);
  if(firstSkipped===-1){finishWorkout();return}
  $('skipReviewScreen').classList.add('hidden');
  $('runner').classList.remove('hidden');
  skipReviewMode=true;
  currentMove=firstSkipped;
  renderRunner();
}
function finishWorkout(){
  clearTimer();
  releaseWakeLock();
  $('runner').classList.add('hidden');
  $('skipReviewScreen')?.classList.add('hidden');
  skipReviewMode=false;
  const counts=workoutStateCounts();
  const message = FINISH_MESSAGES[secureRandomInt(FINISH_MESSAGES.length)];
  $('finishTitle').innerHTML = `${escapeHtml(workoutDisplayName)}<br>${escapeHtml(message)}`;
  $('finishStats').textContent = counts.skipped>0
    ? `${counts.completed} of ${counts.total} completed • ${counts.skipped} skipped.`
    : `${counts.completed} moves finished. Keep the momentum going.`;
  $('finishScreen').classList.remove('hidden');
  vibrate([100,70,100,70,180]);
}
function exitRunner(){clearTimer();wakeLockDesired=false;releaseWakeLock();skipReviewMode=false;$('runner').classList.add('hidden');$('skipReviewScreen')?.classList.add('hidden');document.body.style.overflow=''}
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
  const isD20 = editorLibrary === 'd20';
  const entries = isD20 ? d20Exercises.map((entry,index)=>[String(index+1),entry]) : Object.entries(exercises);
  $('editorKeyHead').textContent = isD20 ? 'Roll' : 'Letter';
  $('editorHelp').textContent = isD20
    ? 'Customize what each D20 number means. These moves are used by both Exercise by Roll and the 20 Workout by Roll templates.'
    : 'Customize the A–Z exercise map used by Name, Letters, and Word modes.';
  $('resetExercisesBtn').textContent = isD20 ? 'Reset D20' : 'Reset A–Z';
  document.querySelectorAll('.library-tab').forEach(button=>button.classList.toggle('active',button.dataset.library===editorLibrary));
  $('editorGrid').innerHTML = entries.map(([key,entry]) => `<div class="editor-row" data-editor-key="${key}"><span class="editor-letter">${key}</span><input class="editor-amount" type="number" min="1" value="${entry.amount}"><select class="editor-unit">${units.map(unit=>`<option value="${unit}" ${entry.unit===unit?'selected':''}>${unit}</option>`).join('')}</select><input class="editor-name" value="${escapeHtml(entry.name)}"><select class="editor-each">${options.map(option=>`<option value="${option.value}" ${entry.each===option.value||(!entry.each&&!option.value)?'selected':''}>${option.label}</option>`).join('')}</select><input class="editor-label" value="${escapeHtml(entry.eachLabel||'')}" placeholder="side/leg" ${entry.each?'':'disabled'}></div>`).join('');
  document.querySelectorAll('.editor-row').forEach(row => {
    const key=row.dataset.editorKey, amount=row.querySelector('.editor-amount'), unit=row.querySelector('.editor-unit'), name=row.querySelector('.editor-name'), each=row.querySelector('.editor-each'), label=row.querySelector('.editor-label');
    const commit = () => {
      const base = isD20 ? DEFAULT_D20_EXERCISES[Number(key)-1] : DEFAULT_EXERCISES[key];
      const updated = {amount:Math.max(1,Number(amount.value)||1),unit:unit.value,name:name.value.trim()||base.name,each:each.value||undefined,eachLabel:label.value.trim()||undefined};
      label.disabled = !each.value;
      if(isD20){
        d20Exercises[Number(key)-1] = updated;
        saveD20Exercises();
        if(d20ManualRolls.length) renderD20History(d20ManualRolls);
        if(lastBuildKind==='d20-exercise'&&lastD20Rolls.length){lastWorkout=buildD20ExerciseWorkout(lastD20Rolls);renderPreview()}
        if(lastBuildKind==='d20-workout'&&lastD20WorkoutRoll){lastWorkout=buildD20TemplateWorkout(lastD20WorkoutRoll);renderPreview()}
      }else{
        exercises[key] = updated;
        saveExercises();
        if(lastBuildKind === 'letters' && lastRawLetters){lastWorkout=buildWorkout(lastRawLetters);renderPreview()}
      }
    };
    [amount,unit,name,each,label].forEach(control => control.addEventListener('change',commit));
  });
}

function setNotificationStatus(text,detail){$('notifStatus').textContent=text;$('subscriptionDetail').textContent=detail}
function normalizeNotificationTime(value){return /^([01]\d|2[0-3]):[0-5]\d$/.test(value||'')?value:'07:00'}
function getNotificationTime(){return normalizeNotificationTime(localStorage.getItem(STORAGE_KEYS.notificationTime)||'07:00')}
async function syncNotificationPreferences(){
  if(!oneSignalInstance) return;
  const enabled = oneSignalInstance.User.PushSubscription.optedIn === true;
  const time = getNotificationTime();
  $('notificationTime').value = time;
  if(enabled) oneSignalInstance.User.addTags({name_wod_notifications:'1',name_wod_time:time,name_wod_timezone:APP_CONFIG.timezone});
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
    await registration.showNotification('Your AMPED workout is ready',{body:message,icon:'icon-192.png',badge:'icon-192.png',tag:'name-wod-test'});
  }catch(error){console.error('Test notification failed.',error);setNotificationStatus('Test failed',error.message||'The test notification could not be sent.')}
}
async function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  try{const registration=await navigator.serviceWorker.register('sw.js',{scope:APP_CONFIG.path});console.log('Service worker registered.',registration.scope)}catch(error){console.error('Service worker registration failed.',error)}
}
function hideNotificationControls(){
  const controls=[$('enableNotificationsBtn'),$('notificationTime'),$('testNotificationBtn')];
  controls.forEach(element=>{if(!element)return;const container=element.closest('.setting-row')||element.closest('.utility-row')||element;container.hidden=true});
}
async function initializeNotifications(){
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{
    try{
      await OneSignal.init({appId:APP_CONFIG.notifications.oneSignalAppId,serviceWorkerPath:`${APP_CONFIG.path}sw.js`,serviceWorkerParam:{scope:APP_CONFIG.path},notifyButton:{enable:false},allowLocalhostAsSecureOrigin:true});
      oneSignalInstance=OneSignal;
      OneSignal.User.PushSubscription.addEventListener('change',async()=>{await syncNotificationPreferences();refreshNotificationStatus()});
      await syncNotificationPreferences();
      refreshNotificationStatus();
    }catch(error){console.error('OneSignal initialization failed.',error);setNotificationStatus('Setup error',error.message||'OneSignal could not initialize.')}
  });
  await registerServiceWorker();
}
function initializeNotificationFeature(){
  if(!APP_CONFIG.notifications.enabled){hideNotificationControls();console.log('AMPED notifications are disabled.');return}
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
    localStorage.setItem(STORAGE_KEYS.notificationTime,time);
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
  else if(lastBuildKind === 'd20-workout' && lastD20WorkoutRoll) workoutDisplayName=applyCase(`#${lastD20WorkoutRoll} ${d20WorkoutLabel(D20_WORKOUTS[lastD20WorkoutRoll-1])}`);
  if(lastWorkout.length) renderPreview();
});
$('startBtn').addEventListener('click',startWorkout);
$('copyBtn').addEventListener('click',event=>copyWorkout({button:event.currentTarget}));
$('finishCopyBtn').addEventListener('click',event=>copyWorkout({completed:true,button:event.currentTarget}));
async function focusD20ForReroll(){
  setMode('d20');
  $('previewCard').classList.add('hidden');
  const die = $('d20RollBtn');
  die.scrollIntoView({behavior:'smooth',block:'center'});
  try{die.focus({preventScroll:true})}catch(_){die.focus()}
  await wait(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 500);
}
$('rerollBtn').addEventListener('click',async()=>{await focusD20ForReroll();await rollD20Selection({forceAuto:true})});
$('editBtn').addEventListener('click',()=>{$('previewCard').classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'});if(mode==='custom')$('customText').focus()});
$('exitRunnerBtn').addEventListener('click',exitRunner);
$('completeMoveBtn').addEventListener('click',completeCurrentMove);
$('skipMoveBtn').addEventListener('click',skipCurrentMove);
$('prevMoveBtn').addEventListener('click',()=>navigateRunner(-1));
$('timerBtn').addEventListener('click',toggleTimer);
$('wakeBtn').addEventListener('click',()=>{if(wakeLock){wakeLockDesired=false;releaseWakeLock({notify:true})}else{wakeLockDesired=true;requestWakeLock({notify:true})}});
$('runnerInfoBtn').addEventListener('click',event=>openExerciseInfo(currentMove,event.currentTarget));
$('exerciseInfoCloseBtn').addEventListener('click',closeExerciseInfo);
$('exerciseInfoSheet').addEventListener('click',event=>{if(event.target === $('exerciseInfoSheet')) closeExerciseInfo()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('exerciseInfoSheet').classList.contains('hidden')) closeExerciseInfo()});
$('doSkippedBtn').addEventListener('click',resumeSkippedExercises);
$('finishWithSkipsBtn').addEventListener('click',finishWorkout);
$('finishCloseBtn').addEventListener('click',closeFinish);
$('finishAgainBtn').addEventListener('click',()=>{closeFinish();$('previewCard').classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'});if(mode==='custom')$('customText').select()});
$('settingsBtn').addEventListener('click',()=>{$('settingsPanel').open=true;$('settingsPanel').scrollIntoView({behavior:'smooth'})});
initializeBranding();
$('mascotTrigger')?.addEventListener('click',showMascotMessage);
setupRunnerSwipe();

document.querySelectorAll('input[name="d20Mode"]').forEach(input=>input.addEventListener('change',()=>{resetD20Rolls();updateD20Controls()}));
$('d20AutoRoll').addEventListener('change',()=>{resetD20Rolls();updateD20Controls()});
$('d20RollBtn').addEventListener('click',event=>{if(performance.now()<suppressD20ClickUntil){event.preventDefault();return}rollD20Selection()});
setupD20GestureControls();
$('d20ResetBtn').addEventListener('click',resetD20Rolls);

$('dailyNameToggle').checked=dailyNameEnabled;
$('dailyNameToggle').addEventListener('change',event=>{dailyNameEnabled=event.target.checked;localStorage.setItem(STORAGE_KEYS.dailyNameEnabled,String(dailyNameEnabled));applyScheduledName()});
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

document.querySelectorAll('.library-tab').forEach(button=>button.addEventListener('click',()=>{editorLibrary=button.dataset.library;renderEditor()}));
$('resetExercisesBtn').addEventListener('click',()=>{
  if(editorLibrary==='d20'){
    if(!confirm('Reset all D20 exercises to the balanced default list?')) return;
    d20Exercises=structuredClone(DEFAULT_D20_EXERCISES);
    saveD20Exercises();
    if(d20ManualRolls.length) renderD20History(d20ManualRolls);
    if(lastBuildKind==='d20-exercise'&&lastD20Rolls.length) lastWorkout=buildD20ExerciseWorkout(lastD20Rolls);
    if(lastBuildKind==='d20-workout'&&lastD20WorkoutRoll) lastWorkout=buildD20TemplateWorkout(lastD20WorkoutRoll);
  }else{
    if(!confirm('Reset all A–Z exercises to the balanced default list?')) return;
    exercises=structuredClone(DEFAULT_EXERCISES);
    saveExercises();
    if(lastBuildKind==='letters'&&lastRawLetters) lastWorkout=buildWorkout(lastRawLetters);
  }
  renderEditor();
  if(lastWorkout.length) renderPreview();
});
$('exportExercisesBtn').addEventListener('click',()=>{
  const payload={schemaVersion:2,letters:exercises,d20:d20Exercises};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download='amped-exercise-libraries.json';
  anchor.click();
  URL.revokeObjectURL(url);
});
$('importExercisesInput').addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  try{
    const imported=JSON.parse(await file.text());
    const importedLetters=imported.letters && typeof imported.letters==='object' ? imported.letters : (!imported.d20 ? imported : null);
    const importedD20=Array.isArray(imported.d20) ? imported.d20 : null;
    if(importedLetters) Object.keys(DEFAULT_EXERCISES).forEach(letter=>{if(importedLetters[letter])exercises[letter]={...exercises[letter],...importedLetters[letter]}});
    if(importedD20) DEFAULT_D20_EXERCISES.forEach((entry,index)=>{if(importedD20[index])d20Exercises[index]={...d20Exercises[index],...importedD20[index]}});
    if(!importedLetters && !importedD20) throw new Error('No exercise libraries found');
    saveExercises();
    saveD20Exercises();
    renderEditor();
    if(lastBuildKind==='letters'&&lastRawLetters) lastWorkout=buildWorkout(lastRawLetters);
    if(lastBuildKind==='d20-exercise'&&lastD20Rolls.length) lastWorkout=buildD20ExerciseWorkout(lastD20Rolls);
    if(lastBuildKind==='d20-workout'&&lastD20WorkoutRoll) lastWorkout=buildD20TemplateWorkout(lastD20WorkoutRoll);
    if(lastWorkout.length) renderPreview();
  }catch{alert('That file is not valid AMPED exercise-library JSON.')}
  event.target.value='';
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;$('installBtn').classList.remove('hidden')});
$('installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;await deferredPrompt.prompt();deferredPrompt=null;$('installBtn').classList.add('hidden')});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!$('runner').classList.contains('hidden')&&wakeLockDesired&&!wakeLock)requestWakeLock()});
