// HomeLedger charts: every chart is inline SVG drawn in code — deterministic, offline,
// no image files and no chart library. Colours come from the category definitions in data.js.

function hlEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Donut of value shares. segments: [{value, color, label}]. Returns SVG markup.
function svgDonut(segments, size, centreTop, centreBottom) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const r = size / 2 - 6, cx = size / 2, cy = size / 2, inner = r * 0.62;
  let angle = -Math.PI / 2;
  let paths = '';
  for (const seg of segments) {
    const frac = Math.max(0, seg.value) / total;
    if (frac <= 0) continue;
    const a2 = angle + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const x3 = cx + inner * Math.cos(a2), y3 = cy + inner * Math.sin(a2);
    const x4 = cx + inner * Math.cos(angle), y4 = cy + inner * Math.sin(angle);
    if (frac > 0.999) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${(r + inner) / 2}" fill="none" stroke="${seg.color}" stroke-width="${r - inner}"/>`;
    } else {
      paths += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} A ${inner} ${inner} 0 ${large} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z" fill="${seg.color}"/>`;
    }
    angle = a2;
  }
  return `<svg viewBox="0 0 ${size} ${size}" class="chart donut" role="img" aria-label="Donut chart">
    ${paths}
    <text x="${cx}" y="${cy - 4}" class="donut-top" text-anchor="middle">${hlEsc(centreTop)}</text>
    <text x="${cx}" y="${cy + 16}" class="donut-bottom" text-anchor="middle">${hlEsc(centreBottom)}</text>
  </svg>`;
}

// 50/30/20 guide vs the household's actual split: one row per group, a bar for the actual
// share of income and a tick at the guide share.
function svgGuideBars(rows, width) {
  const rowH = 44, h = rows.length * rowH + 8;
  const max = Math.max(60, ...rows.map(r => Math.max(r.actual, r.guide))) * 1.08;
  let body = '';
  rows.forEach((r, i) => {
    const y = i * rowH + 6;
    const bw = Math.max(2, r.actual / max * (width - 130));
    const gx = 110 + r.guide / max * (width - 130);
    body += `
      <text x="0" y="${y + 15}" class="axis-label">${hlEsc(r.name)}</text>
      <rect x="110" y="${y}" width="${(width - 130).toFixed(0)}" height="18" rx="4" class="bar-track"/>
      <rect x="110" y="${y}" width="${bw.toFixed(1)}" height="18" rx="4" fill="${r.color}"/>
      <line x1="${gx.toFixed(1)}" y1="${y - 3}" x2="${gx.toFixed(1)}" y2="${y + 21}" class="guide-tick"/>
      <text x="${(116 + bw).toFixed(1)}" y="${y + 14}" class="bar-value">${r.actual.toFixed(0)}%</text>
      <text x="110" y="${y + 34}" class="axis-sub">guide ${r.guide}% · plan ${r.plan.toFixed(0)}%</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${h}" class="chart guidebars" role="img" aria-label="50 30 20 guide versus actual">${body}</svg>`;
}

// Budget vs actual per category: a pale full-width bar for the plan, a solid bar for the
// actual, turning terracotta when the actual passes the plan.
function svgCategoryBars(items, width) {
  const rowH = 30;
  const h = items.length * rowH + 6;
  const max = Math.max(...items.map(x => Math.max(x.budget, x.actual))) * 1.05 || 1;
  const labelW = 128, valW = 152, plotW = width - labelW - valW;
  let body = '';
  items.forEach((x, i) => {
    const y = i * rowH + 4;
    const bw = Math.max(2, x.budget / max * plotW);
    const aw = Math.max(2, x.actual / max * plotW);
    const over = x.actual > x.budget;
    body += `
      <text x="0" y="${y + 14}" class="axis-label">${hlEsc(x.name)}</text>
      <rect x="${labelW}" y="${y}" width="${bw.toFixed(1)}" height="17" rx="4" class="bar-plan"/>
      <rect x="${labelW}" y="${y}" width="${aw.toFixed(1)}" height="17" rx="4" fill="${over ? '#c2512f' : x.color}"/>
      <text x="${labelW + plotW + 8}" y="${y + 14}" class="bar-value">${fmtShort(x.actual)} / ${fmtShort(x.budget)}</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${h}" class="chart catbars" role="img" aria-label="Budget versus actual by category">${body}</svg>`;
}

// Six-month trend: grouped bars for income, spending and savings, with a savings-rate label.
function svgTrend(rows, width) {
  const h = 218, padTop = 26, padBottom = 34, plotH = h - padTop - padBottom;
  const max = Math.max(...rows.map(r => Math.max(r.income, r.spent))) * 1.08 || 1;
  const groupW = width / rows.length;
  const barW = Math.min(17, groupW / 4.4);
  let body = '';
  const gridVals = [0.5, 1];
  for (const g of gridVals) {
    const y = padTop + plotH * (1 - g);
    body += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" class="grid-line"/><text x="2" y="${y - 4}" class="axis-sub">${fmtShort(max / 1.08 * g)}</text>`;
  }
  rows.forEach((r, i) => {
    const gx = i * groupW + groupW / 2;
    const bars = [
      { v: r.income, color: '#1d5c40', dx: -barW * 1.6 },
      { v: r.spent, color: '#d98e4a', dx: -barW / 2 },
      { v: r.saved, color: '#31517d', dx: barW * 0.6 },
    ];
    for (const b of bars) {
      const bh = Math.max(2, b.v / max * plotH);
      body += `<rect x="${(gx + b.dx).toFixed(1)}" y="${(padTop + plotH - bh).toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" rx="2.5" fill="${b.color}"/>`;
    }
    body += `<text x="${gx}" y="${h - 18}" class="axis-label" text-anchor="middle">${hlEsc(r.month.split(' ')[0].slice(0, 3))}</text>`;
    body += `<text x="${gx}" y="${h - 4}" class="axis-sub" text-anchor="middle">saved ${r.rate.toFixed(0)}%</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${h}" class="chart trend" role="img" aria-label="Six month income, spending and savings trend">${body}</svg>`;
}

// Small progress ring used on goal cards.
function svgRing(pct, color, size) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, pct)) / 100 * c;
  return `<svg viewBox="0 0 ${size} ${size}" class="chart ring" role="img" aria-label="${pct.toFixed(0)} percent saved">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-track"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fill" stroke="${color}"
      stroke-dasharray="${filled.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="${size / 2}" y="${size / 2 + 5}" class="ring-text" text-anchor="middle">${pct.toFixed(0)}%</text>
  </svg>`;
}
