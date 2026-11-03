/* AMPED PWA update check: refresh for new code, not user settings/data. */
(() => {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  const startedWithController = Boolean(sw.controller);
  let reloading = false;
  let pendingUpdate = false;
  let lastCheck = 0;

  function workoutIsActive() {
    const runner = document.getElementById('runner');
    return Boolean(runner && !runner.classList.contains('hidden'));
  }
  function refreshWhenSafe() {
    if (!pendingUpdate || reloading || workoutIsActive()) return;
    reloading = true;
    window.location.reload();
  }
  async function checkForUpdate() {
    if (!navigator.onLine) return;
    if (Date.now() - lastCheck < 5 * 60 * 1000) return;
    lastCheck = Date.now();
    try {
      const registration = await sw.ready;
      await registration.update();
    } catch (err) {
      console.warn('AMPED update check will retry on next launch.', err);
    }
  }

  sw.addEventListener('controllerchange', () => {
    // First-time installations do not need an automatic reload.
    if (!startedWithController) return;
    pendingUpdate = true;
    refreshWhenSafe();
  });
  window.addEventListener('load', checkForUpdate);
  window.addEventListener('pageshow', checkForUpdate);
  window.addEventListener('focus', () => { checkForUpdate(); refreshWhenSafe(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { checkForUpdate(); refreshWhenSafe(); }
  });
  // Avoid interrupting an active workout; refresh after the runner closes.
  document.addEventListener('click', () => {
    if (pendingUpdate) setTimeout(refreshWhenSafe, 0);
  });
})();
