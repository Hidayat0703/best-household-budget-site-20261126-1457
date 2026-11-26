// HomeLedger boot and event wiring. All interaction flows through here: forms and buttons
// carry data-form / data-action / data-change attributes, this file applies the change to
// the state in budget.js, saves it, and asks the router to re-render the current page.

function hlToIdr(displayAmount) {
  const v = Number(displayAmount) || 0;
  return hlState.currency === 'USD' ? Math.round(v * HL_RATE_IDR_PER_USD) : Math.round(v);
}

function hlHandleForm(form) {
  const kind = form.dataset.form;
  const data = new FormData(form);
  if (kind === 'quick-add' || kind === 'add-tx') {
    const amount = hlToIdr(data.get('amount'));
    if (amount <= 0) return;
    hlState.transactions.push({
      id: hlUid('t'),
      date: kind === 'add-tx' ? String(data.get('date') || '2026-11-26') : '2026-11-26',
      cat: String(data.get('cat')),
      note: String(data.get('note') || '').trim() || 'Expense',
      amount,
    });
  } else if (kind === 'add-income') {
    const amount = Math.round(Number(data.get('amount')) || 0);
    if (amount <= 0) return;
    hlState.incomes.push({ id: hlUid('inc'), name: String(data.get('name') || '').trim() || 'Income', amount });
  } else if (kind === 'add-goal') {
    const target = hlToIdr(data.get('target'));
    if (target <= 0) return;
    hlState.goals.push({
      id: hlUid('g'), name: String(data.get('name') || '').trim() || 'Goal',
      target, saved: 0, monthly: hlToIdr(data.get('monthly')), note: '',
    });
  } else if (kind === 'goal-add') {
    const goal = hlState.goals.find(g => g.id === form.dataset.id);
    const amount = hlToIdr(data.get('amount'));
    if (!goal || amount <= 0) return;
    goal.saved = Math.min(goal.target, goal.saved + amount);
  } else if (kind === 'ef-calc') {
    const spend = Number(data.get('spend')) || 0;
    const months = Number(data.get('months')) || 0;
    const monthly = Number(data.get('monthly')) || 0;
    if (spend > 0 && months > 0 && monthly > 0) {
      const targetDisplay = spend * months;
      const monthsNeeded = Math.ceil(targetDisplay / monthly);
      const targetIdr = hlState.currency === 'USD' ? targetDisplay * HL_RATE_IDR_PER_USD : targetDisplay;
      hlEfResult = `A ${months}-month cushion for this household is ${fmt(targetIdr)}. ` +
        `At ${fmt(hlToIdr(monthly))} a month it takes about ${monthsNeeded} months to build from zero — ` +
        `the example household already holds ${fmt((hlState.goals.find(g => g.id === 'g1') || { saved: 0 }).saved)} of it.`;
    }
  }
  hlSave();
  hlRender();
}

function hlHandleAction(btn) {
  const action = btn.dataset.action;
  if (action === 'set-currency') {
    hlState.currency = btn.dataset.cur === 'USD' ? 'USD' : 'IDR';
  } else if (action === 'remove-income') {
    hlState.incomes = hlState.incomes.filter(i => i.id !== btn.dataset.id);
  } else if (action === 'del-tx') {
    hlState.transactions = hlState.transactions.filter(t => t.id !== btn.dataset.id);
  } else if (action === 'filter') {
    hlFilter = btn.dataset.f || 'all';
  } else if (action === 'reset-data') {
    if (!window.confirm('Reset HomeLedger to the example household? Your edits in this browser will be cleared.')) return;
    hlReset();
  }
  hlSave();
  hlRender();
}

function hlHandleChange(input) {
  const kind = input.dataset.change;
  const value = input.value;
  if (kind === 'income-name') {
    const inc = hlState.incomes.find(i => i.id === input.dataset.id);
    if (inc) inc.name = value;
  } else if (kind === 'income-amount') {
    const inc = hlState.incomes.find(i => i.id === input.dataset.id);
    if (inc) inc.amount = Math.max(0, Math.round(Number(value) || 0));
  } else if (kind === 'budget') {
    hlState.budgets[input.dataset.cat] = Math.max(0, Math.round(Number(value) || 0));
  }
  hlSave();
  if (kind !== 'income-name') hlRender();
}

document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  hlHandleForm(form);
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (btn) hlHandleAction(btn);
});

document.addEventListener('change', e => {
  const input = e.target.closest('[data-change]');
  if (input) hlHandleChange(input);
});

hlLoad();
hlRender();
