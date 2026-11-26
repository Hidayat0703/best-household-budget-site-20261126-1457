// HomeLedger router: hash routes (#/overview, #/planner, #/tracker, #/goals, #/insights,
// #/guide), active nav state, and a full re-render of the current page after any change.

let hlRoute = 'overview';

function hlCurrentRoute() {
  const m = location.hash.match(/^#\/([a-z]+)/);
  return m && HL_VIEWS[m[1]] ? m[1] : 'overview';
}

function hlRender() {
  hlRoute = hlCurrentRoute();
  const app = document.getElementById('app');
  app.innerHTML = HL_VIEWS[hlRoute]();
  document.querySelectorAll('#mainnav a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === hlRoute);
  });
  document.querySelectorAll('.currency-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.cur === hlState.currency);
  });
  document.getElementById('month-label').textContent = hlState.month;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', hlRender);
