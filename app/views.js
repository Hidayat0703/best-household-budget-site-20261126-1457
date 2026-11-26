// HomeLedger views: one renderer per page. Every number comes from budget.js, so the plan,
// the tracker, the goals and the charts can never disagree with each other.

let hlFilter = 'all';       // Tracker category filter
let hlEfResult = '';        // Emergency-fund calculator output, kept across re-renders

function pctOf(part, whole) { return whole ? Math.round(part / whole * 100) : 0; }

function statCard(label, value, sub, tone) {
  return `<section class="stat-card ${tone || ''}">
    <p class="stat-label">${label}</p>
    <p class="stat-value">${value}</p>
    <p class="stat-sub">${sub}</p>
  </section>`;
}

function groupColor(groupId) {
  return { need: '#1d5c40', want: '#d98e4a', save: '#31517d' }[groupId] || '#666';
}

function viewOverview() {
  const t = hlTotals();
  const insights = hlInsights();
  const top = insights.find(i => i.kind === 'over') || insights[0];
  const recent = [...hlState.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const donutSegs = HL_CATEGORIES
    .map(c => ({ value: t.actuals[c.id] || 0, color: c.color, label: c.name }))
    .filter(s => s.value > 0);
  const guideRows = HL_GROUPS.map(g => {
    const s = g.id === 'need' ? t.need : g.id === 'want' ? t.want : t.save;
    return { name: g.name, guide: g.guide, actual: s.shareActual, plan: s.shareBudget, color: groupColor(g.id) };
  });
  const catItems = HL_CATEGORIES.map(c => ({
    name: c.name, color: c.color,
    budget: Number(hlState.budgets[c.id]) || 0, actual: t.actuals[c.id] || 0,
  }));
  const goalMini = hlState.goals.map(g => {
    const p = hlGoalProjection(g);
    return `<li>
      <div class="mini-goal-head"><span>${hlEsc(g.name)}</span><span>${fmt(g.saved)} of ${fmt(g.target)}</span></div>
      <div class="progress"><div class="progress-fill" style="width:${p.pct.toFixed(0)}%"></div></div>
    </li>`;
  }).join('');

  return `
  <div class="page-head">
    <div>
      <h1>${hlEsc(hlState.month)} at a glance</h1>
      <p class="lede">One household, one month: what came in, where it went, and what is left.
      Every figure below is live — edit the plan or add a purchase and this page moves.</p>
    </div>
    <span class="chip chip-example">Example household · Jakarta · family of four</span>
  </div>
  ${top ? `<div class="insight-banner"><strong>Heads up:</strong> ${hlEsc(top.text)}</div>` : ''}
  <div class="stat-grid">
    ${statCard('Income', fmt(t.income), `${hlState.incomes.length} sources · ${hlState.incomes.map(i => hlEsc(i.name.split(' — ')[0])).join(' + ')}`)}
    ${statCard('Spent so far', fmt(t.spentAll), `${pctOf(t.spentAll, t.planned)}% of the ${fmt(t.planned)} plan`)}
    ${statCard('Left in the plan', fmt(t.leftToSpend), t.unallocated > 0 ? `plus ${fmt(t.unallocated)} of income not yet assigned` : 'every rupiah has a job', t.leftToSpend < 0 ? 'tone-bad' : 'tone-good')}
    ${statCard('Saved this month', fmt(t.savedActual), `savings rate ${t.savingsRate.toFixed(1)}% · guide 20%`, 'tone-save')}
  </div>
  <section class="card">
    <h2>Budget vs actual, by category</h2>
    ${svgCategoryBars(catItems, 860)}
    <p class="card-note">Pale bar = the month's plan, solid bar = spent so far. A bar turns terracotta when a
    category passes its plan — this month that is Dining out, at ${pctOf(t.actuals.dining, hlState.budgets.dining)}%.</p>
  </section>
  <div class="grid-2">
    <section class="card">
      <h2>Needs · Wants · Savings vs the 50/30/20 guide</h2>
      ${svgGuideBars(guideRows, 560)}
      <p class="card-note">The tick is the guide share of income; the bar is this household's actual share.
      Needs run hot because rent and school fees are fixed — the Guide page explains what to move first.</p>
      <p><a class="textlink" href="#/guide">How the 50/30/20 rule works →</a></p>
    </section>
    <section class="card">
      <h2>Where the money went</h2>
      <div class="donut-wrap">
        ${svgDonut(donutSegs, 190, fmtShort(t.spentAll), 'spent')}
        <ul class="legend">
          ${donutSegs.map(s => `<li><span class="swatch" style="background:${s.color}"></span>${hlEsc(s.label)}<span class="legend-val">${fmtShort(s.value)}</span></li>`).join('')}
        </ul>
      </div>
    </section>
  </div>
  <div class="grid-2">
    <section class="card">
      <h2>Quick add an expense</h2>
      <form data-form="quick-add" class="stack-form">
        <label>Category
          <select name="cat">${HL_CATEGORIES.map(c => `<option value="${c.id}">${hlEsc(c.name)}</option>`).join('')}</select>
        </label>
        <label>What for <input name="note" required maxlength="60" placeholder="e.g. Supermarket weekly shop"></label>
        <label>Amount (${hlState.currency === 'USD' ? 'USD' : 'Rp'})
          <input name="amount" type="number" min="1" step="any" required placeholder="150000">
        </label>
        <button class="btn" type="submit">Add expense</button>
      </form>
      <p class="card-note">Adds to ${hlEsc(hlState.month)} and updates every chart on this page. Amounts are entered in the currency shown above and stored in rupiah.</p>
    </section>
    <section class="card">
      <h2>Recent spending</h2>
      <ul class="tx-list">
        ${recent.map(x => `<li>
          <span class="swatch" style="background:${hlCat(x.cat).color}"></span>
          <span class="tx-note">${hlEsc(x.note)}<small>${hlEsc(hlCat(x.cat).name)} · ${fmtDate(x.date)}</small></span>
          <span class="tx-amt">${fmt(x.amount)}</span>
        </li>`).join('')}
      </ul>
      <p><a class="textlink" href="#/tracker">See all ${hlState.transactions.length} entries in the Tracker →</a></p>
      <h3 class="subhead">Savings goals</h3>
      <ul class="mini-goals">${goalMini}</ul>
      <p><a class="textlink" href="#/goals">Open the Goals page →</a></p>
    </section>
  </div>`;
}

function viewPlanner() {
  const t = hlTotals();
  const incomeRows = hlState.incomes.map(i => `
    <div class="edit-row">
      <input class="grow" data-change="income-name" data-id="${i.id}" value="${hlEsc(i.name)}" aria-label="Income source name">
      <input class="money" data-change="income-amount" data-id="${i.id}" type="number" min="0" step="any" value="${i.amount}" aria-label="Monthly amount in rupiah">
      <button class="btn btn-ghost" data-action="remove-income" data-id="${i.id}" aria-label="Remove ${hlEsc(i.name)}">Remove</button>
    </div>`).join('');
  const groupBlocks = HL_GROUPS.map(g => {
    const cats = HL_CATEGORIES.filter(c => c.group === g.id);
    const s = g.id === 'need' ? t.need : g.id === 'want' ? t.want : t.save;
    const rows = cats.map(c => `
      <div class="edit-row wrap">
        <span class="swatch" style="background:${c.color}"></span>
        <span class="cat-name">${hlEsc(c.name)}<small>${hlEsc(c.tip)}</small></span>
        <input class="money" data-change="budget" data-cat="${c.id}" type="number" min="0" step="any" value="${Number(hlState.budgets[c.id]) || 0}" aria-label="Monthly plan for ${hlEsc(c.name)} in rupiah">
        <span class="cat-actual">spent ${fmt(t.actuals[c.id] || 0)} · ${pctOf(t.actuals[c.id] || 0, Number(hlState.budgets[c.id]) || 0)}%</span>
      </div>`).join('');
    return `<section class="card">
      <h2>${hlEsc(g.name)} — plan ${fmt(s.budget)} <span class="h2-sub">guide ${g.guide}% of income · planned ${s.shareBudget.toFixed(0)}%</span></h2>
      ${rows}
    </section>`;
  }).join('');
  const allocSegs = HL_GROUPS.map(g => {
    const s = g.id === 'need' ? t.need : g.id === 'want' ? t.want : t.save;
    return { value: s.budget, color: groupColor(g.id), label: g.name };
  });
  if (t.unallocated > 0) allocSegs.push({ value: t.unallocated, color: '#cfc7b4', label: 'Not assigned' });

  return `
  <div class="page-head">
    <div>
      <h1>Planner — set the month before it starts</h1>
      <p class="lede">Income first, then a plan for every category. Amounts are in rupiah and save as you type;
      the Overview and Insights pages re-read them instantly.</p>
    </div>
  </div>
  <div class="grid-2">
    <section class="card">
      <h2>Income — ${fmt(t.income)} a month</h2>
      ${incomeRows}
      <form data-form="add-income" class="inline-form">
        <input class="grow" name="name" required maxlength="40" placeholder="New source, e.g. Rental income">
        <input class="money" name="amount" type="number" min="1" step="any" required placeholder="Amount (Rp)">
        <button class="btn" type="submit">Add</button>
      </form>
    </section>
    <section class="card">
      <h2>How the plan divides income</h2>
      <div class="donut-wrap">
        ${svgDonut(allocSegs, 190, fmtShort(t.planned), 'planned')}
        <ul class="legend">
          ${allocSegs.map(s => `<li><span class="swatch" style="background:${s.color}"></span>${hlEsc(s.label)}<span class="legend-val">${fmtShort(s.value)}</span></li>`).join('')}
        </ul>
      </div>
      ${t.unallocated > 0
        ? `<p class="callout">${fmt(t.unallocated)} of income has no job yet. Until it is assigned it tends to become spending — give it a goal on the Goals page.</p>`
        : `<p class="callout">Every rupiah of income is assigned. If the month changes, move a plan number rather than borrowing silently from savings.</p>`}
    </section>
  </div>
  ${groupBlocks}
  <section class="card danger-zone">
    <h2>Start over</h2>
    <p class="card-note">Restore the original example household (Jakarta, November 2026) and clear your edits from this browser.</p>
    <button class="btn btn-ghost" data-action="reset-data">Reset to the example household</button>
  </section>`;
}

function viewTracker() {
  const t = hlTotals();
  const chips = [
    { id: 'all', name: 'All' },
    ...HL_GROUPS.map(g => ({ id: g.id, name: g.name })),
  ];
  const rows = [...hlState.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(x => hlFilter === 'all' || hlCat(x.cat).group === hlFilter);
  const filteredTotal = rows.reduce((s, x) => s + x.amount, 0);
  return `
  <div class="page-head">
    <div>
      <h1>Tracker — every expense, logged</h1>
      <p class="lede">${hlState.transactions.length} entries in ${hlEsc(hlState.month)}, totalling ${fmt(t.spentAll)}.
      Savings transfers count as entries too — paying yourself is a transaction, not an afterthought.</p>
    </div>
  </div>
  <section class="card">
    <h2>Add an entry</h2>
    <form data-form="add-tx" class="tx-form">
      <label>Date <input name="date" type="date" value="2026-11-26" required></label>
      <label>Category
        <select name="cat">${HL_CATEGORIES.map(c => `<option value="${c.id}">${hlEsc(c.name)}</option>`).join('')}</select>
      </label>
      <label class="grow">What for <input name="note" required maxlength="60" placeholder="e.g. Electricity (PLN token)"></label>
      <label>Amount (${hlState.currency === 'USD' ? 'USD' : 'Rp'}) <input name="amount" type="number" min="1" step="any" required placeholder="150000"></label>
      <button class="btn" type="submit">Add entry</button>
    </form>
  </section>
  <section class="card">
    <div class="filter-row" role="group" aria-label="Filter by group">
      ${chips.map(ch => `<button class="chipbtn ${hlFilter === ch.id ? 'active' : ''}" data-action="filter" data-f="${ch.id}">${hlEsc(ch.name)}</button>`).join('')}
      <span class="filter-total">Showing ${rows.length} entries · ${fmt(filteredTotal)}</span>
    </div>
    <table class="tx-table">
      <thead><tr><th>Date</th><th>Entry</th><th>Category</th><th class="num">Amount</th><th></th></tr></thead>
      <tbody>
      ${rows.map(x => `<tr>
        <td>${fmtDate(x.date)}</td>
        <td>${hlEsc(x.note)}</td>
        <td><span class="cat-chip"><span class="swatch" style="background:${hlCat(x.cat).color}"></span>${hlEsc(hlCat(x.cat).name)}</span></td>
        <td class="num">${fmt(x.amount)}</td>
        <td><button class="btn btn-ghost btn-small" data-action="del-tx" data-id="${x.id}" aria-label="Delete ${hlEsc(x.note)}">Delete</button></td>
      </tr>`).join('') || '<tr><td colspan="5">No entries in this group yet.</td></tr>'}
      </tbody>
    </table>
  </section>`;
}

function viewGoals() {
  const cards = hlState.goals.map(g => {
    const p = hlGoalProjection(g);
    return `<section class="card goal-card">
      <div class="goal-top">
        ${svgRing(p.pct, '#31517d', 84)}
        <div>
          <h2>${hlEsc(g.name)}</h2>
          <p class="goal-figures"><strong>${fmt(g.saved)}</strong> saved of ${fmt(g.target)}</p>
          <p class="card-note">${hlEsc(g.note || '')}</p>
        </div>
      </div>
      <dl class="goal-stats">
        <div><dt>Still to go</dt><dd>${fmt(p.remaining)}</dd></div>
        <div><dt>Monthly</dt><dd>${fmt(g.monthly)}</dd></div>
        <div><dt>On track for</dt><dd>${p.eta}</dd></div>
      </dl>
      <form data-form="goal-add" data-id="${g.id}" class="inline-form">
        <input class="money grow" name="amount" type="number" min="1" step="any" required placeholder="Add an amount (${hlState.currency === 'USD' ? 'USD' : 'Rp'})">
        <button class="btn" type="submit">Add to goal</button>
      </form>
    </section>`;
  }).join('');
  const t = hlTotals();
  return `
  <div class="page-head">
    <div>
      <h1>Goals — savings with a name on it</h1>
      <p class="lede">Money saved "for later" drifts; money saved for a named goal sticks.
      This household is saving ${fmt(t.savedActual)} this month (${t.savingsRate.toFixed(1)}% of income) across ${hlState.goals.length} goals.</p>
    </div>
  </div>
  <div class="goal-grid">${cards}</div>
  <div class="grid-2">
    <section class="card">
      <h2>Start a new goal</h2>
      <form data-form="add-goal" class="stack-form">
        <label>Goal name <input name="name" required maxlength="48" placeholder="e.g. Deposit for a house"></label>
        <label>Target (${hlState.currency === 'USD' ? 'USD' : 'Rp'}) <input name="target" type="number" min="1" step="any" required placeholder="20000000"></label>
        <label>Monthly contribution (${hlState.currency === 'USD' ? 'USD' : 'Rp'}) <input name="monthly" type="number" min="0" step="any" required placeholder="750000"></label>
        <button class="btn" type="submit">Create goal</button>
      </form>
    </section>
    <section class="card">
      <h2>Emergency fund calculator</h2>
      <p class="card-note">The first goal every household needs: a cushion of 3–6 months of spending,
      in an account you can reach in a day. This household spends about ${fmt(t.spentLiving)} a month on living costs.</p>
      <form data-form="ef-calc" class="stack-form">
        <label>Monthly spending (${hlState.currency === 'USD' ? 'USD' : 'Rp'}) <input name="spend" type="number" min="1" step="any" required value="${Math.round(hlConvert(t.spentLiving))}"></label>
        <label>Months of cover <input name="months" type="number" min="1" max="12" step="1" required value="3"></label>
        <label>Monthly contribution (${hlState.currency === 'USD' ? 'USD' : 'Rp'}) <input name="monthly" type="number" min="1" step="any" required value="${hlState.currency === 'USD' ? 30 : 500000}"></label>
        <button class="btn" type="submit">Calculate</button>
      </form>
      ${hlEfResult ? `<p class="callout">${hlEfResult}</p>` : ''}
    </section>
  </div>`;
}

function viewInsights() {
  const t = hlTotals();
  const rows = hlMonthRows();
  const verdict = (actual, guide) => {
    const d = actual - guide;
    if (Math.abs(d) <= 3) return 'on guide';
    return d > 0 ? `${d.toFixed(0)} pts over guide` : `${Math.abs(d).toFixed(0)} pts under guide`;
  };
  const shareSegs = HL_CATEGORIES
    .map(c => ({ value: t.actuals[c.id] || 0, color: c.color, label: c.name }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const topSegs = shareSegs.slice(0, 6);
  const rest = shareSegs.slice(6).reduce((s, x) => s + x.value, 0);
  if (rest > 0) topSegs.push({ value: rest, color: '#b9b09a', label: 'Everything else' });
  const groupRows = HL_GROUPS.map(g => {
    const s = g.id === 'need' ? t.need : g.id === 'want' ? t.want : t.save;
    return `<tr>
      <td><span class="cat-chip"><span class="swatch" style="background:${groupColor(g.id)}"></span>${hlEsc(g.name)}</span></td>
      <td class="num">${g.guide}%</td><td class="num">${s.shareBudget.toFixed(0)}%</td><td class="num">${s.shareActual.toFixed(0)}%</td>
      <td>${verdict(s.shareActual, g.guide)}</td>
    </tr>`;
  }).join('');
  return `
  <div class="page-head">
    <div>
      <h1>Insights — what the numbers say</h1>
      <p class="lede">Six months of this household's money, and the advice that follows from its own figures —
      not generic tips. Everything here recomputes when the plan or the tracker changes.</p>
    </div>
  </div>
  <section class="card">
    <h2>Income, spending and savings — last six months</h2>
    ${svgTrend(rows, 860)}
    <ul class="legend legend-inline">
      <li><span class="swatch" style="background:#1d5c40"></span>Income</li>
      <li><span class="swatch" style="background:#d98e4a"></span>Spending (excl. savings)</li>
      <li><span class="swatch" style="background:#31517d"></span>Saved</li>
    </ul>
    <p class="card-note">The savings rate has climbed from ${rows[0].rate.toFixed(0)}% in ${hlEsc(rows[0].month.split(' ')[0])} to
    ${t.savingsRate.toFixed(1)}% this month, as income rose and the grocery and shopping lines were trimmed.
    Display conversion where used: Rp ${HL_RATE_IDR_PER_USD.toLocaleString('id-ID')} = $1.</p>
  </section>
  <div class="grid-2">
    <section class="card">
      <h2>The 50/30/20 check</h2>
      <table class="tx-table">
        <thead><tr><th>Group</th><th class="num">Guide</th><th class="num">Planned</th><th class="num">Actual</th><th>Verdict</th></tr></thead>
        <tbody>${groupRows}</tbody>
      </table>
      <p class="card-note">The guide is a compass, not a law — a household with school fees in a big city
      will run needs-heavy. What matters is that the savings line is defended anyway.</p>
      <p><a class="textlink" href="#/planner">Adjust the plan →</a></p>
    </section>
    <section class="card">
      <h2>Share of spending by category</h2>
      <div class="donut-wrap">
        ${svgDonut(topSegs, 190, fmtShort(t.spentAll), 'spent')}
        <ul class="legend">
          ${topSegs.map(s => `<li><span class="swatch" style="background:${s.color}"></span>${hlEsc(s.label)}<span class="legend-val">${pctOf(s.value, t.spentAll)}%</span></li>`).join('')}
        </ul>
      </div>
    </section>
  </div>
  <section class="card">
    <h2>Advice from this month's own figures</h2>
    <ul class="insight-list">
      ${hlInsights().map(i => `<li class="insight-${i.kind}">${hlEsc(i.text)}</li>`).join('')}
    </ul>
  </section>`;
}

function viewGuide() {
  return `
  <div class="page-head">
    <div>
      <h1>Guide — the HomeLedger method</h1>
      <p class="lede">No jargon and no guilt: one page of method that the rest of this site puts into practice.
      Start here, then set your own numbers in the Planner.</p>
    </div>
  </div>
  <section class="card">
    <h2>The 50/30/20 rule, in plain words</h2>
    <div class="rule-grid">
      ${HL_GUIDE.ruleSteps.map(s => `<article class="rule-card"><h3>${hlEsc(s.title)}</h3><p>${hlEsc(s.text)}</p></article>`).join('')}
    </div>
    <p class="card-note">Senator Elizabeth Warren popularised the split in <em>All Your Worth</em> (2005).
    Treat the percentages as a diagnostic: the group furthest from its guide is where the conversation starts —
    for this site's example household, that is Needs, and the honest fix there is slow and structural.</p>
  </section>
  <section class="card">
    <h2>Category guide — what typical households aim for</h2>
    <table class="tx-table">
      <thead><tr><th>Category</th><th>Typical share</th><th>What to watch</th></tr></thead>
      <tbody>
      ${HL_GUIDE.categoryGuide.map(r => `<tr><td>${hlEsc(r.name)}</td><td>${hlEsc(r.share)}</td><td>${hlEsc(r.note)}</td></tr>`).join('')}
      </tbody>
    </table>
    <p class="card-note">Shares are of take-home income and overlap the 50/30/20 groups; use them to sanity-check
    a plan, not to copy one. Your city's housing costs move the whole table.</p>
  </section>
  <section class="card">
    <h2>The monthly routine that makes it stick</h2>
    <ol class="routine">
      ${HL_GUIDE.routine.map(r => `<li><strong>${hlEsc(r.when)}.</strong> ${hlEsc(r.what)}</li>`).join('')}
    </ol>
    <p><a class="textlink" href="#/planner">Open the Planner and set this month →</a> ·
    <a class="textlink" href="#/goals">Name your first goal →</a></p>
  </section>`;
}

const HL_VIEWS = {
  overview: viewOverview,
  planner: viewPlanner,
  tracker: viewTracker,
  goals: viewGoals,
  insights: viewInsights,
  guide: viewGuide,
};
