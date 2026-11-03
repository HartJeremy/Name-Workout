/* AMPED: a monthly featured workout, with all existing workout modes preserved. */
(function(){
  'use strict';
  const ZONE = 'America/New_York';
  const CHALLENGES = window.AMPED_MONTHLY_CHALLENGES || {};
  let featuredMonth = '';
  let iframe = null;
  function monthKey(){
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:ZONE,year:'numeric',month:'2-digit'}).formatToParts(new Date());
    const data = Object.fromEntries(parts.map(part=>[part.type,part.value]));
    return `${data.year}-${data.month}`;
  }
  function monthName(key){
    const [year,month]=key.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1)));
  }
  function init(){
    const app = document.querySelector('main.app-shell');
    const topbar = app && app.querySelector(':scope > header.topbar');
    if(!app || !topbar || document.getElementById('monthly-tablist')) return;
    const workoutPanel = document.createElement('div');
    workoutPanel.id='monthly-workouts-panel';
    workoutPanel.className='monthly-panel';
    workoutPanel.setAttribute('role','tabpanel');
    workoutPanel.setAttribute('aria-labelledby','monthly-workouts-tab');
    workoutPanel.hidden=true;
    // Move existing content, keeping IDs and event listeners intact.
    while(topbar.nextSibling) workoutPanel.appendChild(topbar.nextSibling);

    const monthPanel=document.createElement('section');
    monthPanel.id='monthly-featured-panel';
    monthPanel.className='monthly-panel monthly-featured';
    monthPanel.setAttribute('role','tabpanel');
    monthPanel.setAttribute('aria-labelledby','monthly-featured-tab');

    const nav=document.createElement('nav');
    nav.className='monthly-tabs';
    nav.id='monthly-tablist';
    nav.setAttribute('role','tablist');
    nav.setAttribute('aria-label','AMPED workout categories');
    nav.innerHTML='<button id="monthly-featured-tab" class="monthly-tab is-active" type="button" role="tab" aria-controls="monthly-featured-panel" aria-selected="true">This Month</button><button id="monthly-workouts-tab" class="monthly-tab" type="button" role="tab" aria-controls="monthly-workouts-panel" aria-selected="false" tabindex="-1">Other Workouts</button>';
    app.append(nav,monthPanel,workoutPanel);
    const monthTab=nav.querySelector('#monthly-featured-tab');
    const workoutTab=nav.querySelector('#monthly-workouts-tab');

    function choiceFromHash(){return ['#workouts','#name-workout'].includes(location.hash)?'workouts':'month';}
    function show(choice,updateHash=false){
      const isMonth=choice!=='workouts';
      monthPanel.hidden=!isMonth;
      workoutPanel.hidden=isMonth;
      monthTab.classList.toggle('is-active',isMonth);
      workoutTab.classList.toggle('is-active',!isMonth);
      monthTab.setAttribute('aria-selected',String(isMonth));
      workoutTab.setAttribute('aria-selected',String(!isMonth));
      monthTab.tabIndex=isMonth?0:-1;
      workoutTab.tabIndex=isMonth?-1:0;
      if(updateHash){const next=isMonth?'#month':'#workouts';if(location.hash!==next)history.replaceState(null,'',next);}
    }
    function renderMonth(){
      const key=monthKey();
      if(featuredMonth===key) return;
      featuredMonth=key;
      const config=CHALLENGES[key];
      if(config && typeof config.page==='string' && /^[a-z0-9_-]+\.html$/i.test(config.page)){
        const next=document.createElement('iframe');
        next.id='monthly-frame';
        next.title=config.title+' — '+config.workout;
        next.src=config.page;
        next.loading='eager';
        iframe=next;
        monthPanel.replaceChildren(next);
      }else{
        iframe=null;
        monthPanel.innerHTML='<div class="monthly-empty"><span class="monthly-kicker"></span><h2>Next challenge coming soon</h2><p>The featured workout for this month has not been announced. You can still choose any of the regular AMPED workouts.</p><button type="button" class="monthly-open-workouts">Choose a workout</button></div>';
        monthPanel.querySelector('.monthly-kicker').textContent=monthName(key).toUpperCase();
        monthPanel.querySelector('button').addEventListener('click',()=>show('workouts',true));
      }
    }
    [monthTab,workoutTab].forEach((button,i)=>{
      button.addEventListener('click',()=>{renderMonth();show(i===0?'month':'workouts',true);});
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const target=event.key==='Home'?monthTab:event.key==='End'?workoutTab:button===monthTab?workoutTab:monthTab;
        target.focus();target.click();
      });
    });
    window.addEventListener('hashchange',()=>show(choiceFromHash()));
    // Existing gear button opens settings inside the workouts area.
    // Switch there first so users never see an invisible settings panel.
    const settings=document.getElementById('settingsBtn');
    if(settings) settings.addEventListener('click',()=>show('workouts',true),true);
    window.addEventListener('message',event=>{
      if(!iframe || event.source!==iframe.contentWindow) return;
      if(event.origin!==location.origin && !(event.origin==='null' && location.origin==='null')) return;
      if(!event.data || event.data.type!=='name-wod-gratitude-height') return;
      const height=Number(event.data.height);
      if(Number.isFinite(height) && height>=400 && height<=10000) iframe.style.height=`${Math.ceil(height)}px`;
    });
    renderMonth();
    show(choiceFromHash());
    window.addEventListener('focus',renderMonth);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderMonth();});
    setInterval(renderMonth,60000); // month changes only, no progress is stored
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
