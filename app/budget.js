// HomeLedger budget engine: state, persistence and every calculation the views show.
// The state lives in localStorage; the seed in data.js is used on first run and on reset.
// All money is stored as whole rupiah. Display conversion to USD happens only in fmt().

const HL_STORE_KEY = 'homeledger-v1';
let hlState = null;

function hlLoad() {
  try {
    const raw = localStorage.getItem(HL_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.incomes && parsed.budgets && parsed.transactions && parsed.goals) {
        hlState = parsed;
        return hlState;
      }
    }
  } catch (e) { /* corrupted storage falls through to the seed */ }
  hlState = hlSeedState();
  hlSave();
  return hlState;
}

function hlSave() {
  try { localStorage.setItem(HL_STORE_KEY, JSON.stringify(hlState)); } catch (e) { /* private mode */ }
}

function hlReset() {
  hlState = hlSeedState();
  hlSave();
}

function hlCat(id) { return HL_CATEGORIES.find(c => c.id === id); }
function hlGroup(id) { return HL_GROUPS.find(g => g.id === id); }

function hlIncomeTotal() {
  return hlState.incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
}

function hlActualByCat() {
  const out = {};
  for (const c of HL_CATEGORIES) out[c.id] = 0;
  for (const t of hlState.transactions) {
    if (out[t.cat] !== undefined) out[t.cat] += Number(t.amount) || 0;
  }
  return out;
}

function hlBudgetTotal() {
  return HL_CATEGORIES.reduce((sum, c) => sum + (Number(hlState.budgets[c.id]) || 0), 0);
}

// One summary object for a group: planned, actual, and share of income for each.
function hlGroupSummary(groupId, actuals) {
  let budget = 0, actual = 0;
  for (const c of HL_CATEGORIES) {
    if (c.group !== groupId) continue;
    budget += Number(hlState.budgets[c.id]) || 0;
    actual += actuals[c.id] || 0;
  }
  const income = hlIncomeTotal() || 1;
  return { budget, actual, shareActual: actual / income * 100, shareBudget: budget / income * 100 };
}

function hlTotals() {
  const actuals = hlActualByCat();
  const income = hlIncomeTotal();
  const planned = hlBudgetTotal();
  const spentAll = HL_CATEGORIES.reduce((s, c) => s + (actuals[c.id] || 0), 0);
  const savedActual = (actuals.invest || 0) + (actuals.emergency || 0);
  const spentLiving = spentAll - savedActual;
  const need = hlGroupSummary('need', actuals);
  const want = hlGroupSummary('want', actuals);
  const save = hlGroupSummary('save', actuals);
  return {
    actuals, income, planned, spentAll, spentLiving, savedActual,
    leftToSpend: planned - spentAll,
    unspent: income - spentAll,
    unallocated: income - planned,
    savingsRate: income ? savedActual / income * 100 : 0,
    need, want, save,
  };
}

function hlMonthRows() {
  const t = hlTotals();
  const rows = HL_HISTORY.map(h => ({
    month: h.month, income: h.income, spent: h.spent, saved: h.saved,
    rate: h.income ? h.saved / h.income * 100 : 0,
  }));
  rows.push({
    month: hlState.month, income: t.income, spent: t.spentLiving, saved: t.savedActual,
    rate: t.savingsRate,
  });
  return rows;
}

// Insights computed from the live numbers, so advice follows the household's own figures.
function hlInsights() {
  const t = hlTotals();
  const out = [];
  for (const c of HL_CATEGORIES) {
    const budget = Number(hlState.budgets[c.id]) || 0;
    const actual = t.actuals[c.id] || 0;
    if (budget > 0 && actual > budget) {
      const over = actual - budget;
      const pct = Math.round(actual / budget * 100);
      out.push({
        kind: 'over', cat: c,
        text: `${c.name} is at ${pct}% of plan — ${fmt(over)} over. Trimming it back to plan would lift this month's savings rate to ${((t.savedActual + over) / (t.income || 1) * 100).toFixed(1)}%.`,
      });
    }
  }
  if (t.need.shareActual > 55) {
    out.push({
      kind: 'structure', cat: null,
      text: `Needs take ${t.need.shareActual.toFixed(0)}% of income against the 50% guide — mostly housing and school, which move slowly. The realistic lever this month is the wants side, not the fixed bills.`,
    });
  }
  if (t.unallocated > 0) {
    out.push({
      kind: 'idle', cat: null,
      text: `${fmt(t.unallocated)} of income has no job yet in the plan. Give it one — an extra goal contribution beats letting it drift into spending.`,
    });
  }
  const under = HL_CATEGORIES
    .map(c => ({ c, left: (Number(hlState.budgets[c.id]) || 0) - (t.actuals[c.id] || 0) }))
    .filter(x => x.left > 0)
    .sort((a, b) => b.left - a.left)[0];
  if (under) {
    out.push({
      kind: 'good', cat: under.c,
      text: `${under.c.name} is the calmest line this month: ${fmt(under.left)} of its plan is still unspent with the month nearly over.`,
    });
  }
  if (t.savingsRate >= 20) {
    out.push({ kind: 'good', cat: null, text: `Savings rate is ${t.savingsRate.toFixed(1)}% — at or above the 20% guide. Keep the payday auto-debit exactly as it is.` });
  } else {
    out.push({
      kind: 'rate', cat: null,
      text: `Savings rate is ${t.savingsRate.toFixed(1)}% against the 20% guide — a gap of ${fmt(Math.max(0, Math.round(t.income * 0.20) - t.savedActual))} a month. The Planner shows which lines could carry it.`,
    });
  }
  return out;
}

function hlGoalProjection(goal) {
  const remaining = Math.max(0, goal.target - goal.saved);
  const monthly = Number(goal.monthly) || 0;
  const months = remaining === 0 ? 0 : (monthly > 0 ? Math.ceil(remaining / monthly) : Infinity);
  let eta = '—';
  if (months === 0) eta = 'Reached';
  else if (isFinite(months)) {
    const d = new Date(2026, 10 + months, 1); // seed month: November 2026
    eta = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  return { remaining, months, eta, pct: goal.target ? Math.min(100, goal.saved / goal.target * 100) : 0 };
}

// --- formatting -------------------------------------------------------------
function hlConvert(idr) {
  return hlState && hlState.currency === 'USD' ? idr / HL_RATE_IDR_PER_USD : idr;
}

function fmt(idr) {
  const v = hlConvert(Number(idr) || 0);
  if (hlState && hlState.currency === 'USD') {
    return '$' + v.toLocaleString('en-US', { maximumFractionDigits: v < 100 && v % 1 !== 0 ? 2 : 0 });
  }
  return 'Rp ' + Math.round(v).toLocaleString('id-ID');
}

// Short labels for chart axes: Rp 3,5 jt / Rp 850 rb / $212.
function fmtShort(idr) {
  const raw = Number(idr) || 0;
  if (hlState && hlState.currency === 'USD') {
    const v = raw / HL_RATE_IDR_PER_USD;
    return '$' + (v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : Math.round(v).toString());
  }
  if (Math.abs(raw) >= 1000000) return 'Rp ' + (raw / 1000000).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' jt';
  if (Math.abs(raw) >= 1000) return 'Rp ' + Math.round(raw / 1000) + ' rb';
  return 'Rp ' + raw;
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function hlUid(prefix) {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 999).toString();
}
