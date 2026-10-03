// Used only to migrate untouched installs away from the original leg-heavy map.
export const LEGACY_DEFAULT_EXERCISES = {
  A:{amount:5,unit:'reps',name:'Burpees'},B:{amount:10,unit:'reps',name:'Crunches'},C:{amount:10,unit:'reps',name:'Squats'},D:{amount:30,unit:'sec',name:'Bridge'},E:{amount:10,unit:'reps',name:'Squats'},F:{amount:30,unit:'sec',name:'Plank'},G:{amount:10,unit:'reps',name:'Lunges',each:'split',eachLabel:'leg'},H:{amount:10,unit:'reps',name:'Leg Raises'},I:{amount:10,unit:'reps',name:'Side Lunges',each:'split',eachLabel:'side'},J:{amount:15,unit:'reps',name:'Bicycle Crunches'},K:{amount:10,unit:'reps',name:'Reverse Lunges',each:'split',eachLabel:'leg'},L:{amount:10,unit:'reps',name:'Toe Touches'},M:{amount:10,unit:'reps',name:'Single-Leg Squats',each:'split',eachLabel:'leg'},N:{amount:10,unit:'reps',name:'Bent-Leg Jackknives'},O:{amount:20,unit:'reps',name:'Jumping Jacks'},P:{amount:20,unit:'reps',name:'Cross-Country Skiers'},Q:{amount:20,unit:'reps',name:'Scissor Kicks'},R:{amount:20,unit:'reps',name:'Mountain Climbers'},S:{amount:20,unit:'reps',name:'High Knees'},T:{amount:20,unit:'reps',name:'Mountain Climbers'},U:{amount:15,unit:'reps',name:'Clamshells',each:'perSide',eachLabel:'side'},V:{amount:15,unit:'reps',name:'Side Leg Lifts',each:'perSide',eachLabel:'side'},W:{amount:15,unit:'reps',name:'Glute Leg Lifts'},X:{amount:15,unit:'reps',name:'Superman Lifts'},Y:{amount:15,unit:'reps',name:'Supermans'},Z:{amount:15,unit:'reps',name:'Donkey Kicks',each:'perSide',eachLabel:'leg'}
};

// Balanced A-Z bodyweight library: upper body, lower body, core, cardio and posterior chain.
export const DEFAULT_EXERCISES = {
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
  V:{amount:12,unit:'reps',name:'Reverse Snow Angels'},
  W:{amount:25,unit:'sec',name:'Hollow Hold'},
  X:{amount:12,unit:'reps',name:'Bird Dogs',each:'split',eachLabel:'side'},
  Y:{amount:30,unit:'sec',name:'Bear Crawl'},
  Z:{amount:30,unit:'sec',name:'Fast Feet'}
};

export const DEFAULT_D20_EXERCISES = [
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
  {amount:12,unit:'reps',name:'Reverse Snow Angels'},
  {amount:30,unit:'sec',name:'Bear Crawl'},
  {amount:30,unit:'sec',name:'Forearm Plank'},
  {amount:20,unit:'reps',name:'Skater Hops',each:'split',eachLabel:'side'},
  {amount:10,unit:'reps',name:'Plank Up-Downs'},
  {amount:8,unit:'reps',name:'Burpees'},
  {amount:15,unit:'reps',name:'Good Mornings'}
];

// Fun title + plain-language grouping. Workout-by-Roll templates are intentionally
// biased toward their grouping without stacking the same movement pattern all day.
export const D20_WORKOUTS = [
  {name:'Full Charge',group:'Balanced Six',rolls:[1,2,3,6,8,16]},
  {name:'Push the Pace',group:'Push + Pace',rolls:[1,4,7,11,12,16]},
  {name:'Core Current',group:'Core Engine',rolls:[3,9,13,14,8,2]},
  {name:'Leg Day Lightning',group:'Legs + Lungs',rolls:[2,4,17,11,1,3]},
  {name:'Upper Voltage',group:'Upper Body Burn',rolls:[1,10,14,12,3,2]},
  {name:'Backline Power',group:'Posterior Power',rolls:[6,12,20,2,5,16]},
  {name:'Redline',group:'Cardio Circuit',rolls:[8,11,19,1,9,14]},
  {name:'Steady Signal',group:'Stability Day',rolls:[9,13,6,20,14,2]},
  {name:'Power Surge',group:'Full-Body Charge',rolls:[19,2,1,3,12,11]},
  {name:'Grounded',group:'Steady Strength',rolls:[1,2,6,9,14,20]},
  {name:'Shoulder Spark',group:'Shoulders + Core',rolls:[10,7,9,13,2,14]},
  {name:'Side Quest',group:'Athletic Mix',rolls:[17,4,1,15,3,20]},
  {name:'Quick Charge',group:'Quick Sweat',rolls:[8,19,3,1,6,16]},
  {name:'Foundation',group:'Strength Base',rolls:[1,2,4,6,10,12]},
  {name:'Core Voltage',group:'Core Control',rolls:[3,9,13,20,1,14]},
  {name:'Brace for It',group:'Move + Brace',rolls:[15,4,9,6,1,14]},
  {name:'Upper Circuit',group:'Upper + Posterior',rolls:[1,10,12,20,7,2]},
  {name:'Lower Circuit',group:'Lower + Core',rolls:[2,4,17,6,9,13]},
  {name:'Overdrive',group:'Conditioning Mix',rolls:[19,11,8,2,12,9]},
  {name:'Everything On',group:'Everything Day',rolls:[1,4,7,9,12,19]}
];
export function d20WorkoutLabel(template){return `${template.name} (${template.group})`}
