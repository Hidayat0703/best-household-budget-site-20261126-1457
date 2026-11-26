// HomeLedger data: the category system, the seeded example household, six months of history
// and the Guide page's written content. Amounts are stored in rupiah (IDR); the header toggle
// only changes how they are displayed (fixed rate, shown on the Insights page).

const HL_RATE_IDR_PER_USD = 16500; // display-only conversion, Rp 16.500 = $1

const HL_GROUPS = [
  { id: 'need', name: 'Needs', guide: 50, blurb: 'The bills that keep the household running.' },
  { id: 'want', name: 'Wants', guide: 30, blurb: 'The spending that makes life nicer, and leaks easiest.' },
  { id: 'save', name: 'Savings & goals', guide: 20, blurb: 'Money sent to future you before the month spends it.' },
];

// Each category: id, name, group, colour (shared by every chart), and a one-line budgeting tip.
const HL_CATEGORIES = [
  { id: 'housing',   name: 'Housing & rent',       group: 'need', color: '#1d5c40', tip: 'Aim to keep rent or mortgage under 30% of take-home pay.' },
  { id: 'utilities', name: 'Utilities & bills',    group: 'need', color: '#3e7d5a', tip: 'Electricity, water, internet, phone. Review plans once a year.' },
  { id: 'groceries', name: 'Groceries',            group: 'need', color: '#5f9e78', tip: 'A weekly list and one big shop beat daily top-up trips.' },
  { id: 'transport', name: 'Transport',            group: 'need', color: '#84b996', tip: 'Fuel, fares, parking and ride-hailing all live here.' },
  { id: 'health',    name: 'Health & insurance',   group: 'need', color: '#a7cdb2', tip: 'Premiums first, then a small buffer for pharmacy and clinics.' },
  { id: 'kids',      name: 'Kids & school',        group: 'need', color: '#2e6f5e', tip: 'Fees are fixed; supplies and activities are where it flexes.' },
  { id: 'dining',    name: 'Dining out',           group: 'want', color: '#d98e4a', tip: 'The classic leak. A monthly cap with a mid-month check works.' },
  { id: 'fun',       name: 'Entertainment',        group: 'want', color: '#e0a458', tip: 'Streaming, cinema, games, days out.' },
  { id: 'shopping',  name: 'Shopping',             group: 'want', color: '#e7ba7d', tip: 'Clothes and household extras. Wait 48 hours on anything big.' },
  { id: 'care',      name: 'Personal care',        group: 'want', color: '#c97b3f', tip: 'Salon, toiletries, gym and self-care.' },
  { id: 'invest',    name: 'Savings & investments', group: 'save', color: '#31517d', tip: 'Auto-debit on payday, before the month can spend it.' },
  { id: 'emergency', name: 'Emergency fund',       group: 'save', color: '#5b7ca6', tip: 'Build to 3–6 months of spending, in an account you can reach fast.' },
];

const HL_MONTHS = ['June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026'];

// The example household: a family of four in Jakarta, November 2026. Every figure on the site
// derives from these rows, so the plan, the tracker and the charts always agree with each other.
function hlSeedState() {
  return {
    month: 'November 2026',
    currency: 'IDR',
    incomes: [
      { id: 'inc1', name: 'Salary — main job', amount: 12500000 },
      { id: 'inc2', name: 'Freelance design', amount: 2300000 },
    ],
    budgets: {
      housing: 3500000, utilities: 850000, groceries: 2400000, transport: 900000,
      health: 650000, kids: 1100000, dining: 800000, fun: 450000,
      shopping: 700000, care: 350000, invest: 1600000, emergency: 500000,
    },
    transactions: [
      { id: 't01', date: '2026-11-01', cat: 'housing',   note: 'Monthly rent — Tebet apartment', amount: 3500000 },
      { id: 't02', date: '2026-11-01', cat: 'health',    note: 'BPJS health premium', amount: 350000 },
      { id: 't03', date: '2026-11-02', cat: 'groceries', note: 'Supermarket weekly shop', amount: 685000 },
      { id: 't04', date: '2026-11-02', cat: 'fun',       note: 'Streaming bundle', amount: 186000 },
      { id: 't05', date: '2026-11-03', cat: 'utilities', note: 'Electricity (PLN token)', amount: 412000 },
      { id: 't06', date: '2026-11-04', cat: 'transport', note: 'Fuel — Pertamax', amount: 300000 },
      { id: 't07', date: '2026-11-05', cat: 'utilities', note: 'Water (PDAM)', amount: 118000 },
      { id: 't08', date: '2026-11-05', cat: 'kids',      note: 'School fees — November', amount: 950000 },
      { id: 't09', date: '2026-11-07', cat: 'dining',    note: 'Family dinner — ramen', amount: 386000 },
      { id: 't10', date: '2026-11-08', cat: 'shopping',  note: 'Clothes for the kids', amount: 412000 },
      { id: 't11', date: '2026-11-09', cat: 'groceries', note: 'Supermarket weekly shop', amount: 642000 },
      { id: 't12', date: '2026-11-09', cat: 'utilities', note: 'Home internet', amount: 262000 },
      { id: 't13', date: '2026-11-10', cat: 'care',      note: 'Salon & toiletries', amount: 295000 },
      { id: 't14', date: '2026-11-11', cat: 'transport', note: 'Fuel — Pertamax', amount: 300000 },
      { id: 't15', date: '2026-11-12', cat: 'health',    note: 'Pharmacy', amount: 300000 },
      { id: 't16', date: '2026-11-14', cat: 'kids',      note: 'School supplies', amount: 150000 },
      { id: 't17', date: '2026-11-15', cat: 'dining',    note: 'Coffee & brunch with friends', amount: 295000 },
      { id: 't18', date: '2026-11-16', cat: 'groceries', note: 'Market run — vegetables & protein', amount: 518000 },
      { id: 't19', date: '2026-11-18', cat: 'transport', note: 'Ride-hailing & parking', amount: 245000 },
      { id: 't20', date: '2026-11-19', cat: 'fun',       note: 'Cinema — family of four', amount: 252000 },
      { id: 't21', date: '2026-11-21', cat: 'dining',    note: 'Birthday dinner', amount: 455000 },
      { id: 't22', date: '2026-11-22', cat: 'shopping',  note: 'Shoes', amount: 200000 },
      { id: 't23', date: '2026-11-23', cat: 'groceries', note: 'Supermarket weekly shop', amount: 340000 },
      { id: 't24', date: '2026-11-25', cat: 'invest',    note: 'Index fund auto-debit', amount: 1600000 },
      { id: 't25', date: '2026-11-25', cat: 'emergency', note: 'Emergency fund transfer', amount: 500000 },
    ],
    goals: [
      { id: 'g1', name: 'Emergency fund', target: 36000000, saved: 27400000, monthly: 500000, note: 'Three months of spending, kept in a separate savings account.' },
      { id: 'g2', name: 'Bali family holiday', target: 12000000, saved: 7800000, monthly: 900000, note: 'Five days in June 2027 — flights, villa and food for four.' },
      { id: 'g3', name: 'New laptop', target: 18500000, saved: 4250000, monthly: 600000, note: 'Replaces the 2020 machine the freelance work runs on.' },
    ],
  };
}

// Closed months, summarised: income, spending excluding savings transfers, and amount saved.
// November is not listed — the Insights page derives it live from the transactions above.
const HL_HISTORY = [
  { month: 'June 2026',      income: 14200000, spent: 11940000, saved: 1800000 },
  { month: 'July 2026',      income: 14200000, spent: 12310000, saved: 1800000 },
  { month: 'August 2026',    income: 14550000, spent: 11680000, saved: 2000000 },
  { month: 'September 2026', income: 14550000, spent: 12050000, saved: 2000000 },
  { month: 'October 2026',   income: 14800000, spent: 11720000, saved: 2100000 },
];

// Guide page content: the method, a category guide with typical shares, and the monthly routine.
const HL_GUIDE = {
  ruleSteps: [
    { title: '50 — Needs', text: 'Half of take-home pay for what the household cannot skip: housing, utilities, groceries, transport, health and school. If needs sit far above 50%, the fix is structural — a cheaper home, a refinanced bill — not willpower.' },
    { title: '30 — Wants', text: 'Three tenths for the good stuff: eating out, entertainment, shopping, treats. Wants are not banned; they are budgeted, so a splurge is a plan, not a leak.' },
    { title: '20 — Savings', text: 'Two tenths to future you, moved on payday: emergency fund first, then goals and investments. Saving what is left at month-end rarely works; saving first does.' },
  ],
  categoryGuide: [
    { name: 'Housing & rent', share: '25–30% of income', note: 'Above 35% squeezes every other line.' },
    { name: 'Utilities & bills', share: '5–8%', note: 'Track electricity separately — it is the one that creeps.' },
    { name: 'Groceries', share: '10–15%', note: 'For a family of four; eating out does not count here.' },
    { name: 'Transport', share: '5–10%', note: 'Include parking, tolls and ride-hailing, not just fuel.' },
    { name: 'Health & insurance', share: '4–7%', note: 'Premiums plus a small clinic-and-pharmacy buffer.' },
    { name: 'Kids & school', share: '5–10%', note: 'Fees are fixed; plan supplies and activities per term.' },
    { name: 'Dining out', share: '3–6%', note: 'The most common overrun — check it mid-month.' },
    { name: 'Entertainment', share: '2–5%', note: 'Subscriptions hide here; audit them twice a year.' },
    { name: 'Shopping', share: '3–6%', note: 'A 48-hour wait kills most impulse buys.' },
    { name: 'Savings & goals', share: '15–20%+', note: 'Emergency fund to 3–6 months of spending, then invest.' },
  ],
  routine: [
    { when: 'Payday', what: 'Move the savings lines first — emergency fund, goals, investments — before any spending starts.' },
    { when: 'Weekly', what: 'Ten minutes: log the week\u2019s spending in the Tracker and glance at the category bars on the Overview.' },
    { when: 'Mid-month', what: 'Check the two or three categories that usually leak (dining, shopping). A small trim now beats a big one later.' },
    { when: 'Month-end', what: 'Compare plan vs actual in Insights, roll what is left into a goal, and set next month\u2019s Planner numbers.' },
  ],
};
