(function () {
  "use strict";

  const D = window.CALC_DATA;
  const $ = (id) => document.getElementById(id);
  const num = (id) => { const v = parseFloat($(id).value); return isNaN(v) ? 0 : v; };
  const chk = (id) => $(id).checked;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pct = (v, d = 2) => (v).toFixed(d) + "%";
  const fmt = (v, d = 0) => Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

  function stat(k, v, hl, small) {
    return `<div class="stat${hl ? " hl" : ""}"><div class="k">${k}</div><div class="v">${v}${small ? ` <small>${small}</small>` : ""}</div></div>`;
  }

  // ---------- Saved inputs (per viewer, optional) ----------
  const STORE = "lokiy-calc-v1";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { saved = {}; }
  function save() {
    const out = {};
    document.querySelectorAll("input[id], select[id]").forEach((el) => {
      out[el.id] = el.type === "checkbox" ? el.checked : el.value;
    });
    try { localStorage.setItem(STORE, JSON.stringify(out)); } catch (e) { /* ignore */ }
  }
  function restore(ids) {
    ids.forEach((id) => {
      const el = $(id);
      if (!el || !(id in saved)) return;
      if (el.type === "checkbox") el.checked = !!saved[id]; else el.value = saved[id];
    });
  }

  // ---------- SVG line chart ----------
  function lineChart({ xs, series, xMax, yMax, marker, xLabel, yFmt, xTicks, yTicks, area = true }) {
    const W = 640, H = 240, L = 48, R = 12, T = 12, B = 30;
    const x = (v) => L + (v / xMax) * (W - L - R);
    const y = (v) => T + (1 - v / yMax) * (H - T - B);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
    yTicks.forEach((t) => {
      s += `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`;
      s += `<text class="axis-t" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${yFmt(t)}</text>`;
    });
    xTicks.forEach((t) => {
      s += `<text class="axis-t" x="${x(t)}" y="${H - 10}" text-anchor="middle">${t}</text>`;
    });
    series.forEach((ys, i) => {
      const pts = xs.map((xv, j) => `${x(xv).toFixed(1)},${y(ys[j]).toFixed(1)}`);
      if (i === 0 && area) {
        s += `<path class="area" d="M${x(xs[0])},${y(0)} L${pts.join(" L")} L${x(xs[xs.length - 1])},${y(0)} Z"/>`;
      }
      s += `<polyline class="${i === 0 ? "line" : "line2"}" points="${pts.join(" ")}"/>`;
    });
    if (marker) {
      const mx = x(clamp(marker.x, 0, xMax)), my = y(clamp(marker.y, 0, yMax));
      s += `<line class="mark-l" x1="${mx}" x2="${mx}" y1="${T}" y2="${H - B}"/>`;
      s += `<circle class="mark" cx="${mx}" cy="${my}" r="5.5"/>`;
    }
    if (xLabel) s += `<text class="axis-t" x="${W - R}" y="${T + 10}" text-anchor="end">${xLabel}</text>`;
    return s + "</svg>";
  }

  function rollBar(parts) {
    return parts.filter((p) => p.v > 0.0001)
      .map((p) => `<div title="${p.name}: ${pct(p.v)}" style="flex:0 0 ${p.v}%;background:${p.c}"></div>`).join("");
  }
  function legend(parts) {
    return parts.map((p) => `<span><i style="background:${p.c}"></i>${p.name} <b>${pct(p.v)}</b></span>`).join("");
  }

  // =====================================================
  // RESISTANCES  (Royalgiraffe's resistance guide)
  // =====================================================
  // Placeholders until the real Vanilla+ boss resistances are known.
  const PLACEHOLDER_BOSSES = [
    ["Placeholder boss A", { fire: 0 }],
    ["Placeholder boss B", { frost: 100 }],
    ["Placeholder boss C", { shadow: 200 }],
    ["Placeholder boss D", { nature: 300 }],
  ];

  const BOSSES = [
    ["Molten Core — Lucifron", { fire: 93, shadow: 186 }],
    ["Molten Core — Gehennas", { fire: 186, shadow: 93 }],
    ["Molten Core — Shazzrah", { arcane: 186, fire: 93 }],
    ["Molten Core — Sulfuron Harbinger", { fire: 93 }],
    ["Molten Core — Golemagg", { fire: 186 }],
    ["Molten Core — Flamewaker Elite (Majordomo)", { fire: 90 }],
    ["Naxxramas — Kel'Thuzad", { frost: 200, shadow: 100 }],
  ];

  function resistStats(res, o) {
    const cap = Math.max(5 * o.alvl, 100);
    const levelRes = (!o.binary && !o.anpc && o.tnpc) ? 8 * Math.max(0, o.tlvl - o.alvl) : 0;
    const eff = Math.max(0, res - o.pen) + levelRes;
    const ratio = Math.min(1, eff / cap);
    const avg = o.binary ? 0.75 * ratio : 0.75 * ratio - (3 / 16) * Math.max(0, ratio - 2 / 3);
    return { cap, levelRes, eff, ratio, avg };
  }

  // Partial resist chances, piecewise linear between 0, 1/3, 2/3 and cap.
  function partials(ratio) {
    const seg = [[100, 0, 0, 0], [24, 55, 18, 3], [0, 22, 56, 22], [0, 4, 16, 80]];
    if (ratio >= 1) return seg[3].slice();
    const i = Math.floor(ratio * 3), f = ratio * 3 - i;
    const p = seg[i].map((v, k) => v * (1 - f) + seg[i + 1][k] * f);
    if (ratio < 2 / 3 - 1e-6) p[0] = Math.max(1, p[0]);
    return p;
  }

  function missChance(o) {
    const diff = o.tlvl - o.alvl;
    const pvp = !o.anpc && !o.tnpc;
    let miss = 4 + diff + Math.max(0, diff - 2) * (pvp ? 6 : 10);
    miss = clamp(miss, 1, 90);
    return miss;
  }

  function renderResist() {
    const o = {
      alvl: num("r-alvl"), tlvl: num("r-tlvl"), pen: num("r-pen"),
      anpc: chk("r-anpc"), tnpc: chk("r-tnpc"), binary: chk("r-bin"),
    };
    const res = num("r-res"), hp = num("r-hp"), spHit = num("r-hit");
    const st = resistStats(res, o);
    const baseMiss = missChance(o);

    let hitChance;
    if (o.binary) {
      // Binary: level hit chance is reduced by resistance, then spell hit is added, capped at 99%.
      hitChance = clamp((100 - baseMiss) * (1 - st.avg) + spHit, 0, 99);
    } else {
      hitChance = 100 - Math.max(1, baseMiss - spHit);
    }
    const hitCap = Math.max(0, baseMiss - 1);
    const mitAll = o.binary ? 1 - hitChance / 100 : 1 - (hitChance / 100) * (1 - st.avg);
    const ehp = hp / (1 - st.avg);
    const next = resistStats(res + 1, o).avg;
    const fullHit = o.binary ? (1 - st.avg) * 100 : partials(st.ratio)[0];
    const need23 = Math.ceil((2 / 3) * st.cap) - st.levelRes + o.pen;

    // Stat values for your spell, in spell power
    const base = num("r-base"), coef = num("r-coef"), sp = num("r-sp");
    const dmg = (spw, pen, hit) => {
      const s2 = resistStats(res, Object.assign({}, o, { pen: o.pen + pen }));
      let h;
      if (o.binary) h = clamp((100 - baseMiss) * (1 - s2.avg) + spHit + hit, 0, 99) / 100;
      else h = (100 - Math.max(1, baseMiss - spHit - hit)) / 100;
      return (base + spw * coef) * h * (o.binary ? 1 : 1 - s2.avg);
    };
    const d0 = dmg(sp, 0, 0), dSp = dmg(sp + 1, 0, 0) - d0;
    const penVal = dSp > 0 ? (dmg(sp, 1, 0) - d0) / dSp : 0;
    const hitVal = dSp > 0 ? (dmg(sp, 0, 1) - d0) / dSp : 0;

    $("r-stats").innerHTML =
      stat("Average mitigation", pct(st.avg * 100), true) +
      stat("Effective resistance", fmt(st.eff), false, "/ " + st.cap + " cap") +
      stat("Chance of a full hit", pct(fullHit, 1)) +
      stat("Effective health", fmt(ehp)) +
      stat("+1 resistance", "+" + ((next - st.avg) * 100).toFixed(3) + "%") +
      (st.levelRes ? stat("Level-based resistance", "+" + st.levelRes, false, "can't be removed") : "");

    $("r-spellstats").innerHTML =
      stat("Spell hit chance", pct(hitChance, 0), true, o.binary ? "incl. resist" : "") +
      stat("Hit cap", hitCap + "%", false, spHit > hitCap && !o.binary ? `${spHit - hitCap}% wasted` : "") +
      stat("Total mitigation", pct(mitAll * 100), false, "resist + miss") +
      stat("1 spell pen worth", penVal.toFixed(2), false, "spell power") +
      stat("1% spell hit worth", hitVal.toFixed(1), false, "spell power");
    $("r-spellnote").textContent = o.binary
      ? "Binary spell: hit and resistance are one roll, so spell hit above the cap still helps against resistance."
      : "Non-binary spell: spell hit only prevents full misses (up to the cap). Resistance is rolled separately.";

    if (o.binary) {
      const r = st.avg * 100;
      const parts = [{ name: "Resisted", v: r, c: "var(--r75)" }, { name: "Full effect", v: 100 - r, c: "var(--r0)" }];
      $("r-tabletitle").textContent = "Resist roll (binary)";
      $("r-tablenote").textContent = "all or nothing";
      $("r-bar").innerHTML = rollBar(parts);
      $("r-legend").innerHTML = legend(parts);
    } else {
      const p = partials(st.ratio);
      const parts = [
        { name: "0% resisted", v: p[0], c: "var(--r0)" }, { name: "25%", v: p[1], c: "var(--r25)" },
        { name: "50%", v: p[2], c: "var(--r50)" }, { name: "75%", v: p[3], c: "var(--r75)" },
      ];
      $("r-tabletitle").textContent = "Partial resists";
      $("r-tablenote").textContent = st.ratio >= 2 / 3 - 1e-6
        ? "No full hits: you're at 2/3 of the cap or more"
        : `Full hits stop at ${Math.max(0, need23)} resistance`;
      $("r-bar").innerHTML = rollBar(parts);
      $("r-legend").innerHTML = legend(parts);
    }

    const xs = [], ys = [], yb = [];
    const capInput = st.cap + o.pen - st.levelRes;
    const xMax = Math.max(capInput + 20, 50);
    for (let r = 0; r <= xMax; r += Math.max(1, Math.round(xMax / 120))) {
      xs.push(r);
      ys.push(resistStats(r, o).avg * 100);
      yb.push(resistStats(r, Object.assign({}, o, { binary: !o.binary })).avg * 100);
    }
    const step = xMax > 300 ? 50 : 25;
    const xTicks = []; for (let t = 0; t <= xMax; t += step) xTicks.push(t);
    $("r-chart").innerHTML = lineChart({
      xs, series: [ys, yb], xMax, yMax: 80, marker: { x: res, y: st.avg * 100 },
      xTicks, yTicks: [0, 20, 40, 60, 80], yFmt: (t) => t + "%",
      xLabel: o.binary ? "dashed: non-binary spells" : "dashed: binary spells",
    });
  }

  function initResist() {
    const sel = $("r-boss");
    [["Vanilla+ bosses (placeholders)", PLACEHOLDER_BOSSES], ["Classic raid bosses", BOSSES]].forEach(([label, list]) => {
      const group = document.createElement("optgroup");
      group.label = label;
      list.forEach(([name, r]) => {
        Object.keys(r).forEach((school) => {
          const o = document.createElement("option");
          o.value = r[school];
          o.textContent = `${name}: ${r[school]} ${school}`;
          group.appendChild(o);
        });
      });
      sel.appendChild(group);
    });
    sel.addEventListener("change", () => {
      if (!sel.value) return;
      $("r-res").value = sel.value;
      setScenario("pvb");
      sel.value = "";
      renderResist(); save();
    });
    document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
      setScenario(b.dataset.preset); renderResist(); save();
    }));
  }
  function setScenario(p) {
    const set = { bvp: [63, 60, true, false], pvb: [60, 63, false, true], pvp: [60, 60, false, false] }[p];
    $("r-alvl").value = set[0]; $("r-tlvl").value = set[1];
    $("r-anpc").checked = set[2]; $("r-tnpc").checked = set[3];
  }

  // =====================================================
  // ARMOR
  // =====================================================
  const armorDR = (armor, lvl) => clamp(armor / (armor + 400 + 85 * lvl), 0, 0.75);

  function renderArmor() {
    const armor = num("a-armor"), lvl = num("a-lvl"), hp = num("a-hp");
    const dr = armorDR(armor, lvl);
    const k = 400 + 85 * lvl;
    const capArmor = 3 * k;
    const dr100 = armorDR(armor + 100, lvl) - dr;
    const ehp = hp / (1 - dr);
    const ehp100 = hp / (1 - armorDR(armor + 100, lvl)) - ehp;

    $("a-stats").innerHTML =
      stat("Damage reduction", pct(dr * 100), true) +
      stat("Effective health", fmt(ehp)) +
      stat("+100 armor", "+" + (dr100 * 100).toFixed(2) + "%", false, "reduction") +
      stat("+100 armor", "+" + fmt(ehp100), false, "effective health") +
      stat("Armor for 75% cap", fmt(capArmor), false, armor >= capArmor ? "reached" : fmt(capArmor - armor) + " to go");

    const xMax = Math.max(20000, Math.ceil(armor / 5000) * 5000);
    const xs = [], ys = [];
    for (let a = 0; a <= xMax; a += xMax / 120) { xs.push(a); ys.push(armorDR(a, lvl) * 100); }
    const xTicks = []; for (let t = 0; t <= xMax; t += 5000) xTicks.push(t);
    $("a-chart").innerHTML = lineChart({
      xs, series: [ys], xMax, yMax: 80, marker: { x: armor, y: dr * 100 },
      xTicks, yTicks: [0, 20, 40, 60, 80], yFmt: (t) => t + "%",
    });
  }

  // =====================================================
  // ATTACK TABLE (melee, 1.12 community testing)
  // =====================================================
  function attackChances(o, type) {
    const def = o.tlvl * 5;
    const diff = def - o.skill;
    const baseSkill = Math.min(o.skill, o.alvl * 5);

    let miss = diff > 10 ? 5 + diff * 0.2 : 5 + diff * 0.1;
    miss *= Math.min(10, o.tlvl) / 10;
    if (type === "dual") miss = miss * 0.8 + 20;
    miss -= (diff > 10 && o.hit >= 1) ? o.hit - 1 : o.hit;

    const dodge = Math.max(0, 5 + diff * 0.1);
    const bossParry = o.tlvl - o.alvl >= 3 ? 12.5 : 5;
    const parry = o.front ? Math.max(0, diff * 0.1 + bossParry) : 0;
    const block = (o.front && o.block) ? Math.min(5, 5 + diff * 0.1) : 0;

    const critDiff = baseSkill - def;
    let crit = o.crit + critDiff * (critDiff < 0 ? 0.2 : 0.04);
    if (o.tlvl - o.alvl >= 3) crit -= 1.8;

    const glance = type === "special" ? 0 : Math.max(0, 10 + (def - Math.min(o.alvl * 5, o.skill)) * 2);
    const low = Math.min(1.3 - 0.05 * diff, 0.91);
    const high = clamp(1.2 - 0.03 * diff, 0.2, 0.99);
    const glancePenalty = type === "special" ? 0 : (1 - (low + high) / 2) * 100;
    return { miss, dodge, parry, block, glance, crit, glancePenalty };
  }

  function fillTable(order, ch) {
    let left = 100;
    const out = {};
    order.forEach((k) => {
      const v = Math.min(clamp(ch[k], 0, 100), left);
      out[k] = v; left -= v;
    });
    out.hit = left;
    return out;
  }

  function renderAttack() {
    const o = {
      skill: num("t-skill"), hit: num("t-hit"), crit: num("t-crit"),
      alvl: num("t-alvl"), tlvl: num("t-tlvl"), front: chk("t-front"), block: chk("t-block"),
    };
    const types = [
      ["auto", "White hits", "one weapon, auto attacks"],
      ["dual", "White hits, dual wield", "auto attacks with two weapons"],
      ["special", "Yellow hits", "abilities like Mortal Strike"],
    ];
    let html = "", yellowMiss = 0, whiteCritCap = 0, whiteRaw = null;
    types.forEach(([t, title, note]) => {
      const ch = attackChances(o, t);
      const tb = fillTable(["miss", "dodge", "parry", "block", "glance", "crit"], ch);
      if (t === "special") yellowMiss = ch.miss;
      if (t === "auto") { whiteRaw = ch; whiteCritCap = tb.crit; }
      const parts = [
        { name: "Miss", v: tb.miss, c: "var(--c-miss)" }, { name: "Dodge", v: tb.dodge, c: "var(--c-dodge)" },
        { name: "Parry", v: tb.parry, c: "var(--c-parry)" }, { name: "Block", v: tb.block, c: "var(--c-block)" },
        { name: "Glancing", v: tb.glance, c: "var(--c-glance)" }, { name: "Crit", v: tb.crit, c: "var(--c-crit)" },
        { name: "Hit", v: tb.hit, c: "var(--c-hit)" },
      ];
      const lost = ch.crit - tb.crit;
      html += `<div class="rolltitle"><h3>${title}</h3><span class="note">${note}${lost > 0.005 ? ` · <span class="warn">${pct(lost)} crit pushed off</span>` : ""}</span></div>`;
      html += `<div class="rollbar">${rollBar(parts)}</div><div class="legend">${legend(parts.filter((p) => p.v > 0.0001))}</div>`;
    });
    $("t-tables").innerHTML = html;

    const def = o.tlvl * 5, diff = def - o.skill;
    const baseMissYellow = (diff > 10 ? 5 + diff * 0.2 : 5 + diff * 0.1) * Math.min(10, o.tlvl) / 10;
    const hitCap = diff > 10 ? baseMissYellow + 1 : baseMissYellow;
    const overHit = Math.max(0, -yellowMiss);
    $("t-stats").innerHTML =
      stat("Hit cap (yellow)", pct(hitCap, 1), true, overHit > 0 ? `${pct(overHit, 1)} wasted` : "") +
      stat("Crit on the table", pct(whiteCritCap), false, "white hits") +
      stat("Glancing blows", pct(whiteRaw.glance), false, `-${whiteRaw.glancePenalty.toFixed(0)}% damage`) +
      stat("Crit suppression", pct(o.crit - whiteRaw.crit), false, "vs this target");
  }

  // =====================================================
  // DEFENSE TABLE
  // =====================================================
  function renderDefense() {
    const def = num("d-def"), mlvl = num("d-mlvl");
    const canParry = chk("d-canparry"), canBlock = chk("d-canblock");
    const mobSkill = mlvl * 5;
    const skillDiff = def - mobSkill;
    const baseDefDiff = mobSkill - Math.min(300, def);

    const ch = {
      miss: 5 + skillDiff * 0.04,
      dodge: 5 + num("d-dodge") + skillDiff * 0.04,
      parry: canParry ? 5 + num("d-parry") + skillDiff * 0.04 : 0,
      block: canBlock ? 5 + num("d-block") + skillDiff * 0.04 : 0,
      crit: Math.max(0, 5 - skillDiff * 0.04),
      crush: baseDefDiff >= 15 ? baseDefDiff * 2 - 15 : 0,
    };
    const auto = fillTable(["miss", "dodge", "parry", "block", "crit", "crush"], ch);
    const avoidBlock = ch.miss + ch.dodge + ch.parry + ch.block;
    const needed = 100 - ch.crit;
    const critFree = ch.crit <= 0;

    const parts = (tb) => [
      { name: "Miss", v: tb.miss, c: "var(--c-miss)" }, { name: "Dodge", v: tb.dodge, c: "var(--c-dodge)" },
      { name: "Parry", v: tb.parry, c: "var(--c-parry)" }, { name: "Block", v: tb.block, c: "var(--c-block)" },
      { name: "Crit", v: tb.crit, c: "var(--c-crit)" }, { name: "Crushing", v: tb.crush || 0, c: "var(--c-crush)" },
      { name: "Hit", v: tb.hit, c: "var(--c-hit)" },
    ];
    const critDefNeeded = mobSkill + 125;
    let html = `<div class="rolltitle"><h3>Melee swings against you</h3><span class="note">auto attacks</span></div>`;
    html += `<div class="rollbar">${rollBar(parts(auto))}</div><div class="legend">${legend(parts(auto).filter((p) => p.v > 0.0001))}</div>`;
    $("d-tables").innerHTML = html;

    const crushLeft = Math.max(0, needed - avoidBlock);
    $("d-stats").innerHTML =
      stat("Crushing blows", pct(auto.crush), true, auto.crush <= 0.005 ? "pushed off" : `${pct(crushLeft)} more avoid/block needed`) +
      stat("Crit chance", pct(auto.crit), false, critFree ? "uncrittable" : `${critDefNeeded - def} more defense`) +
      stat("Miss + dodge + parry + block", pct(avoidBlock)) +
      stat("Avoidance", pct(ch.miss + ch.dodge + ch.parry), false, "no damage taken");
  }

  // =====================================================
  // MANA REGEN
  // =====================================================
  function renderRegen() {
    const cls = $("g-cls").value, spi = num("g-spi"), mp5 = num("g-mp5");
    const castPct = clamp(num("g-cast"), 0, 100) / 100, floor = chk("g-floor");
    const r = D.regen[cls];
    const spiTick = r.base + spi * r.perSpirit;
    const mp5Tick = mp5 * 2 / 5;
    const tick = (casting) => {
      const v = spiTick * (casting ? castPct : 1) + mp5Tick;
      return floor ? Math.floor(v) : v;
    };
    const outTick = tick(false), inTick = tick(true);
    $("g-stats").innerHTML =
      stat("Not casting", fmt(outTick * 2.5, 1), true, "mp5") +
      stat("While casting", fmt(inTick * 2.5, 1), false, "mp5") +
      stat("Per tick (2 sec)", fmt(outTick, floor ? 0 : 1), false, `${fmt(inTick, floor ? 0 : 1)} casting`) +
      stat("Per minute", fmt(outTick * 30), false, `${fmt(inTick * 30)} casting`) +
      stat("From Spirit", fmt(spiTick * 2.5, 1), false, "mp5 when not casting");

    // Casting non-stop vs. pausing 5 sec every 15 sec
    const xs = [], a = [], b = [];
    let ma = 0, mb = 0;
    for (let t = 0; t <= 120; t += 2) {
      xs.push(t); a.push(ma); b.push(mb);
      ma += inTick;
      const cycle = t % 20;
      mb += cycle >= 15 ? outTick : inTick;
    }
    const yMax = Math.max(100, Math.ceil(Math.max(ma, mb) / 500) * 500);
    $("g-chart").innerHTML = lineChart({
      xs, series: [a, b], xMax: 120, yMax, xTicks: [0, 20, 40, 60, 80, 100, 120],
      yTicks: [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax], yFmt: (t) => fmt(t), xLabel: "seconds", area: true,
    });
    $("g-note").textContent = "Solid line: casting non-stop. Dashed: stopping for 5 seconds out of every 20.";
  }

  // =====================================================
  // SPELL RANKS
  // =====================================================
  const CLASS_NAMES = { druid: "Druid", priest: "Priest", paladin: "Paladin", shaman: "Shaman", warlock: "Warlock" };

  function initSpells() {
    const sel = $("s-spell");
    const groups = {};
    D.spells.forEach((s) => { (groups[s.cls] = groups[s.cls] || []).push(s); });
    Object.keys(groups).forEach((cls) => {
      const og = document.createElement("optgroup");
      og.label = CLASS_NAMES[cls];
      groups[cls].forEach((s) => {
        const o = document.createElement("option"); o.value = s.id; o.textContent = s.name; og.appendChild(o);
      });
      sel.appendChild(og);
    });
    sel.addEventListener("change", () => { buildMods(); renderSpells(); save(); });
  }

  function currentSpell() { return D.spells.find((s) => s.id === $("s-spell").value) || D.spells[0]; }

  function buildMods() {
    const sp = currentSpell();
    const box = $("s-mods");
    box.innerHTML = sp.mods.map((m) => {
      const id = `s-mod-${sp.id}-${m}`;
      const on = id in saved ? !!saved[id] : sp.defaults.includes(m);
      return `<label class="c"><input type="checkbox" id="${id}" data-mod="${m}"${on ? " checked" : ""}>${D.modifiers[m].name}</label>`;
    }).join("");
    box.querySelectorAll("input").forEach((el) => el.addEventListener("change", () => { renderSpells(); save(); }));
    const dmg = sp.kind === "damage";
    $("s-powerlabel").firstChild.textContent = dmg ? "Spell damage" : "Healing power";
    $("s-targetswrap").style.display = sp.targets ? "" : "none";
  }

  function spellRow(sp, r, power, crit, mods, targets) {
    const [rank, mana0, level, cast0, min, max, hotTotal = 0, duration = 0] = r;
    const penalty = level < 20 ? 1 - (20 - level) * 0.0375 : 1;
    const hasDirect = max > 0, hasHot = hotTotal > 0;

    let dur = duration, castTime = cast0, mana = mana0, critC = crit, pctAll = 0, pctHot = 0, flat = 0;
    let critMult = 0.5, refund = 0, grace = 0, addHot = null;
    mods.forEach((m) => {
      const x = D.modifiers[m];
      switch (x.type) {
        case "heal": pctAll += x.value; break;
        case "hot": pctHot += x.value; break;
        case "mana": mana -= mana0 * x.value; break;
        case "manaFlat": mana -= x.value; break;
        case "cast": castTime += x.value; break;
        case "crit": critC += x.value; break;
        case "flat": flat += x.value; break;
        case "refund": refund += x.value; break;
        case "critMult": critMult += x.value * 0.5; break;
        case "graceCast": grace = x.value; break;
        case "duration": dur = x.value; break;
        case "addHot": addHot = x; break;
      }
    });
    critC = clamp(critC, 0, 100) / 100;
    castTime -= grace * critC;
    castTime = Math.max(castTime, 1.5);
    mana -= mana0 * refund * critC;

    // Spell power coefficients. Hybrid spells have them in the data.
    const directCoef = (sp.coefficient != null ? sp.coefficient : Math.min(cast0, 3.5) / 3.5) * penalty;
    const hotCoef = (sp.hotCoefficient != null ? sp.hotCoefficient : Math.min(duration / 15, 1)) * penalty;

    const baseAvg = hasDirect ? (min + max) / 2 : 0;
    const bonus = hasDirect ? directCoef * power : 0;
    let direct = (baseAvg + bonus + (hasDirect ? flat : 0)) * (1 + pctAll);
    direct += direct * critMult * critC;

    let hot = 0;
    if (hasHot) {
      const scaleDur = duration ? dur / duration : 1;
      hot = (hotTotal * scaleDur + hotCoef * power * scaleDur + (hasDirect ? 0 : flat)) * (1 + pctAll + pctHot);
    }
    if (addHot) hot += (addHot.tick * addHot.duration / 3) * (1 + pctAll);

    let total = direct + hot;
    if (sp.chain) total *= 1.75;
    if (sp.targets) total *= targets;

    return {
      rank, level, mana, cast: castTime, base: baseAvg + hotTotal, bonus: bonus + (hasHot ? hotCoef * power : 0),
      total, ps: total / castTime, pm: total / mana,
    };
  }

  function renderSpells() {
    const sp = currentSpell();
    const power = num("s-power"), crit = num("s-crit"), targets = clamp(num("s-targets") || 1, 1, 5);
    const mods = Array.from($("s-mods").querySelectorAll("input:checked")).map((el) => el.dataset.mod);
    const rows = sp.ranks.map((r) => spellRow(sp, r, power, crit, mods, targets));
    const bestPs = Math.max(...rows.map((r) => r.ps)), bestPm = Math.max(...rows.map((r) => r.pm));
    const dmg = sp.kind === "damage";
    const unit = dmg ? "Damage" : "Heal";

    $("s-title").textContent = sp.name + (sp.targets ? ` · ${targets} targets` : sp.chain ? " · 3 targets" : "");
    let h = `<thead><tr><th>Rank</th><th>Lvl</th><th>Mana</th><th>Cast</th><th>Base</th><th>+Power</th><th>Avg ${unit.toLowerCase()}</th><th></th><th>${dmg ? "DPS" : "HPS"}</th><th>${dmg ? "Dmg" : "Heal"}/mana</th></tr></thead><tbody>`;
    rows.forEach((r) => {
      const cls = (r.ps === bestPs ? "best-hps " : "") + (r.pm === bestPm ? "best-hpm" : "");
      const w = Math.round((r.pm / bestPm) * 40);
      h += `<tr class="${cls}"><td>Rank ${r.rank}</td><td>${r.level}</td><td>${fmt(r.mana)}</td><td>${r.cast.toFixed(2)}s</td>` +
        `<td>${fmt(r.base)}</td><td>+${fmt(r.bonus)}</td><td>${fmt(r.total)}</td><td></td>` +
        `<td>${fmt(r.ps, 1)}</td><td>${r.pm.toFixed(2)}<span class="bar" style="width:${w}px"></span></td></tr>`;
    });
    $("s-table").innerHTML = h + "</tbody>";
    $("s-hint").textContent = "Average includes crits" + (dmg ? " and assumes the spell hits." : ", and ignores overhealing.") +
      " Ranks below level 20 get a reduced power coefficient.";
  }

  // =====================================================
  // Tabs and wiring
  // =====================================================
  const renderers = { resist: renderResist, armor: renderArmor, attack: renderAttack, defense: renderDefense, regen: renderRegen, spells: renderSpells };

  function show(view) {
    if (!renderers[view]) view = "resist";
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.view === view ? "true" : "false"));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
    renderers[view]();
  }

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    history.replaceState(null, "", "#" + t.dataset.view);
    show(t.dataset.view);
  }));
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));

  initResist();
  initSpells();
  restore(Array.from(document.querySelectorAll("input[id], select[id]")).map((e) => e.id));
  buildMods();

  Object.keys(renderers).forEach((v) => {
    document.querySelectorAll(`#view-${v} input, #view-${v} select`).forEach((el) => {
      el.addEventListener("input", () => { renderers[v](); save(); });
      el.addEventListener("change", () => { renderers[v](); save(); });
    });
  });

  show(location.hash.slice(1));
})();
