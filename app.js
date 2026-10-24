/* CIMS & ODSF prototype — demo by 92 Logics. Fictional data; runs fully client-side. */
(function () {
"use strict";
const D = window.CIMS_DATA, I = window.I18N, KEY = "cims-demo-v1";
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const daysTo = d => Math.round((new Date(d) - new Date(today())) / 864e5);
const uid = p => p + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
const fmtEUR = n => "€" + Number(n || 0).toLocaleString("en-GB");

function initialState() {
  const ans = {};
  [["GP1.1.1", 3, "Statutes registered 2019; certificate on file.", "low"], ["GP1.1.2", 2, "Reviewed in 2025, not 2026 yet.", "med"], ["GP1.2.2", 1, "Policy drafted, not yet signed by all members.", "high"], ["GP3.1.1", 1, "Last external audit 2023.", "high"], ["GP5.1.1", 2, "Approved; dissemination to field offices pending.", "med"]]
    .forEach(([g, s, c, r]) => ans[g] = { self: s, comment: c, risk: r, priority: r === "high", expected: r === "high" ? "Fully compliant within 12 months" : "", ev: [], chat: [] });
  ans["GP1.1.1"].ev = ["EV-STAT"]; ans["GP1.2.1"] = { self: null, comment: "", risk: "", priority: false, expected: "", ev: ["EV-STAT", "EV-MIN"], chat: [] };
  return {
    lang: (navigator.language || "en").slice(0, 2).match(/fr|es/) ? navigator.language.slice(0, 2) : "en",
    role: "mo", view: "home", ortTab: "S1", regionFilter: "", kcQuery: "", kcType: "",
    ort: JSON.parse(JSON.stringify(D.ORT)),
    my: { id: "MO-ALPHA", name: "Sample MO Alpha", region: "Africa", cycle: 2, status: "self_in_progress", assessor: "Assessor B (sample)", answers: ans,
      log: [{ ts: addDays(-40), who: "CI GS", what: "Cycle 2 opened; workspace created (previous cycle-1 report attached)" }] },
    evidence: [
      { id: "EV-STAT", name: "statutes-registered-2019.pdf (sample)", size: 182000, type: "application/pdf", uploaded: addDays(-30), by: "MO", versions: 1, data: null, confidential: false },
      { id: "EV-MIN", name: "board-minutes-2026.pdf (sample)", size: 96000, type: "application/pdf", uploaded: addDays(-20), by: "MO", versions: 2, data: null, confidential: true }],
    ip: [
      { id: "IP-1", title: "Board members sign conflict-of-interest declarations", gp: "GP1.2.2", od: "Governance", owner: "Board secretary", deadline: addDays(-8), status: "delayed", progress: 40, notes: "3 of 7 signed", odsf: "" },
      { id: "IP-2", title: "Commission external audit of 2026 accounts", gp: "GP3.1.1", od: "Finance", owner: "Finance manager", deadline: addDays(21), status: "in_progress", progress: 25, notes: "ToR for auditor drafted", odsf: "" },
      { id: "IP-3", title: "Safeguarding policy roll-out to all field offices", gp: "GP5.1.1", od: "Safeguarding", owner: "Safeguarding focal point", deadline: addDays(120), status: "planned", progress: 0, notes: "", odsf: "" }],
    reports: { r2: null, r4: null, reviews: [] },
    odsf: D.genODSF(),
    docs: JSON.parse(JSON.stringify(D.DOCS)), seenDocs: addDays(-7),
    baobab: [{ id: "BQ-1", ref: "MO-07 cycle-1 validated report (sample)", status: "synced", ts: addDays(-15), remote: "BAO-58213" }],
    letters: []
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || initialState(); } catch (e) { S = initialState(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Storage full — large files kept as metadata only"); } };
const t = k => (I[S.lang] && I[S.lang][k]) || I.en[k] || k;
const L = o => (o && typeof o === "object") ? (o[S.lang] || o.en) : o;
const NETWORK = D.genNetwork();
const gpsOf = () => S.ort.flatMap(s => s.articles.flatMap(a => a.gps.map(g => ({ ...g, std: s.id, art: a.id, artName: a.name, mandatory: a.mandatory }))));
const NAV = {
  mo: ["home", "ort", "evidence", "ip", "odsf", "knowledge", "alerts"],
  assessor: ["home", "ort", "evidence", "knowledge", "alerts"],
  regional: ["home", "ip", "odsf", "knowledge", "alerts"],
  revcom: ["revcom", "home", "ip", "odsf", "knowledge", "alerts"],
  gs: ["home", "revcom", "ort", "odsf", "baobab", "config", "knowledge", "users", "alerts"]
};
const STATUS_ORDER = ["self_in_progress", "self_submitted", "external_in_progress", "external_completed", "ip_final", "validated", "published"];
const stIdx = s => STATUS_ORDER.indexOf(s);
function logStep(who, what) { S.my.log.push({ ts: today(), who, what }); }
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 2600); }
const pill = (txt, cls) => `<span class="pill ${cls || ""}">${esc(txt)}</span>`;
const scoreCls = s => s == null ? "" : s >= 3 ? "ok" : s === 2 ? "warn" : "bad";

/* ---------- metrics ---------- */
function compliancePct(scores) { const v = Object.values(scores).filter(x => x != null); return v.length ? Math.round(100 * v.filter(x => x >= 3).length / v.length) : 0; }
function latest(mo) { return mo.c2 || mo.c1; }
function netFiltered() { const r = S.role === "regional" ? S.my.region : S.regionFilter; return r ? NETWORK.filter(m => m.region === r) : NETWORK; }
function stdPct(mos, std, cyc) { const gps = gpsOf().filter(g => g.std === std); let n = 0, c = 0;
  mos.forEach(m => { const sc = cyc === 2 ? m.c2 : m.c1; if (!sc) return; gps.forEach(g => { if (sc[g.id] != null) { n++; if (sc[g.id] >= 3) c++; } }); }); return n ? Math.round(100 * c / n) : 0; }

function bars(rows, opts = {}) {
  return `<div class="bars">${rows.map(r => `<div class="bar-row"><span class="bar-label">${esc(r.label)}</span><span class="bar-track">${(r.values || [r.value]).map((v, i) =>
    `<span class="bar c${i}" style="width:${Math.max(1, Math.min(100, (v / (opts.max || 100)) * 100))}%" title="${esc(v)}"></span>`).join("")}</span><span class="bar-val">${(r.values || [r.value]).map(v => esc(v) + (opts.unit || "")).join(" → ")}</span></div>`).join("")}</div>`
   + (opts.legend ? `<div class="legend">${opts.legend.map((l, i) => `<span><i class="c${i}"></i>${esc(l)}</span>`).join("")}</div>` : "");
}
function lineChart(points) {
  const w = 520, h = 160, p = 28, xs = points.length - 1, max = 100;
  const X = i => p + i * (w - 2 * p) / xs, Y = v => h - p - (v / max) * (h - 2 * p);
  const path = points.map((pt, i) => (i ? "L" : "M") + X(i) + " " + Y(pt.v)).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" class="line" role="img" aria-label="${esc(t("ch_trend"))}">
    ${[0, 50, 100].map(v => `<line x1="${p}" x2="${w - p}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="2" y="${Y(v) + 4}">${v}%</text>`).join("")}
    <path d="${path}" class="stroke"/>${points.map((pt, i) => `<circle cx="${X(i)}" cy="${Y(pt.v)}" r="4"/><text x="${X(i) - 12}" y="${h - 6}">${pt.x}</text><text x="${X(i) - 8}" y="${Y(pt.v) - 8}" class="pv">${pt.v}</text>`).join("")}</svg>`;
}
function trendSeries(mos) {
  return [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => { let n = 0, s = 0;
    mos.forEach((m, i) => { const y1 = 2019 + (i % 4); if (y < y1) return; const sc = (m.c2 && y >= y1 + 4) ? m.c2 : m.c1; n++; s += compliancePct(sc); });
    return { x: String(y).slice(2), v: n ? Math.round(s / n) : 0 }; });
}

/* ---------- views ---------- */
const V = {};
V.home = () => {
  if (S.role === "mo") return moHome();
  if (S.role === "assessor") return assessorHome();
  return networkDashboard();
};
function myStats() {
  const gps = gpsOf(), a = S.my.answers; const scored = gps.filter(g => a[g.id] && a[g.id].self != null);
  const dist = [0, 1, 2, 3].map(s => scored.filter(g => a[g.id].self === s).length);
  return { total: gps.length, scored: scored.length, dist, risks: gps.filter(g => a[g.id] && a[g.id].risk === "high").length, pri: gps.filter(g => a[g.id] && a[g.id].priority).length };
}
function nextStepText() {
  const s = S.my.status;
  return { self_in_progress: t("submitSelf"), self_submitted: t("startExternal") + " (CI GS)", external_in_progress: t("completeExternal") + " (" + t("r_assessor") + ")",
    external_completed: t("submitIPFinal"), ip_final: t("validate") + " (" + t("r_revcom") + ")", validated: t("publish"), published: "✓" }[s];
}
function moHome() {
  const st = myStats(), ipDone = S.ip.length ? Math.round(S.ip.reduce((a, b) => a + Number(b.progress || 0), 0) / S.ip.length) : 0;
  return `<section class="card pad"><div class="row between"><h2>${t("myAssessment")} · ${esc(S.my.name)} · ${t("cycle")} ${S.my.cycle}</h2>${pill(t("s_" + S.my.status), "blue")}</div>
   ${stepper()}
   <div class="kpis">${kpi(t("completeness"), Math.round(100 * st.scored / st.total) + "%", st.scored + "/" + st.total)}${kpi(t("compliant"), st.dist[3])}${kpi(t("partially"), st.dist[2])}${kpi(t("nonCompliant"), st.dist[0] + st.dist[1])}${kpi(t("risk") + " · " + t("rk_high"), st.risks)}${kpi(t("n_ip"), ipDone + "%", S.ip.length + " " + t("actions").toLowerCase())}</div>
   <p><b>${t("nextStep")}:</b> ${esc(nextStepText())}</p>${workflowButtons()}</section>
   <div class="grid2"><section class="card pad"><h3>${t("compliance")} · ${t("standard")}</h3>${bars(S.ort.map(s => { const g = gpsOf().filter(x => x.std === s.id); const sc = g.filter(x => S.my.answers[x.id] && S.my.answers[x.id].self != null);
      return { label: L(s.name).split("·")[0].trim(), value: sc.length ? Math.round(100 * sc.filter(x => S.my.answers[x.id].self >= 3).length / g.length) : 0 }; }), { unit: "%" })}</section>
   <section class="card pad"><h3>${t("workflowLog")}</h3>${logList()}${lettersList()}</section></div>`;
}
function kpi(label, val, sub) { return `<div class="kpi"><div class="kv">${esc(val)}</div><div class="kl">${esc(label)}</div>${sub ? `<div class="ks">${esc(sub)}</div>` : ""}</div>`; }
function stepper() { const i = stIdx(S.my.status); return `<ol class="stepper">${STATUS_ORDER.map((s, k) => `<li class="${k < i ? "done" : k === i ? "cur" : ""}">${esc(t("s_" + s))}</li>`).join("")}</ol>`; }
function logList() { return `<ul class="log">${S.my.log.slice().reverse().map(l => `<li><time>${esc(l.ts)}</time> <b>${esc(l.who)}</b> — ${esc(l.what)}</li>`).join("")}</ul>`; }
function lettersList() { return S.letters.length ? `<h3>${t("letter")} / ${t("certificate")}</h3><ul class="log">${S.letters.map((l, i) => `<li>${esc(l.ts)} — <a href="#" data-act="openLetter" data-i="${i}">${esc(l.title)}</a></li>`).join("")}</ul>` : ""; }
function workflowButtons() {
  const s = S.my.status, r = S.role, b = [];
  if (r === "mo" && s === "self_in_progress") b.push(["submitSelf", t("submitSelf")]);
  if ((r === "gs" || r === "regional") && s === "self_submitted") b.push(["startExternal", t("startExternal")]);
  if (r === "assessor" && s === "external_in_progress") b.push(["completeExternal", t("completeExternal")]);
  if (r === "mo" && s === "external_completed") b.push(["submitIPFinal", t("submitIPFinal")]);
  if (r === "revcom" && s === "ip_final") b.push(["validate", t("validate")]);
  if ((r === "revcom" || r === "gs") && s === "validated") b.push(["publish", t("publish")]);
  return b.length ? `<div class="row">${b.map(([a, l]) => `<button class="btn" data-act="${a}">${esc(l)}</button>`).join("")}</div>` : "";
}
function assessorHome() {
  const mine = NETWORK.filter(m => m.assessor === S.my.assessor && m.phase === "external");
  const gps = gpsOf(), a = S.my.answers, outstanding = gps.filter(g => !(a[g.id] && a[g.id].ev && a[g.id].ev.length)).length;
  const aScored = gps.filter(g => a[g.id] && a[g.id].aScore != null).length;
  return `<section class="card pad"><h2>${t("n_assign")} · ${esc(S.my.assessor)}</h2>
   <table><thead><tr><th>MO</th><th>${t("region")}</th><th>${t("status")}</th><th>${t("evidence")}</th><th>${t("assessorScore")}</th><th></th></tr></thead><tbody>
   <tr><td><b>${esc(S.my.name)}</b></td><td>${esc(S.my.region)}</td><td>${pill(t("s_" + S.my.status), "blue")}</td><td>${outstanding} outstanding</td><td>${aScored}/${gps.length}</td><td><a href="#ort" class="btn sm">${t("n_ort")}</a></td></tr>
   ${mine.map(m => `<tr class="muted"><td>${esc(m.name)}</td><td>${esc(m.region)}</td><td>${t("ph_external")}</td><td>—</td><td>—</td><td>${pill("sample")}</td></tr>`).join("")}</tbody></table>
   ${stIdx(S.my.status) < 2 ? `<p class="note">${esc(S.my.name)}: ${t("s_" + S.my.status)} — ${t("nextStep")}: ${esc(nextStepText())}</p>` : ""}${workflowButtons()}</section>`;
}
function networkDashboard() {
  const mos = netFiltered(), reg = S.role === "regional" ? S.my.region : S.regionFilter;
  const ph = p => mos.filter(m => m.phase === p).length;
  const odsf = S.odsf.filter(o => !reg || (NETWORK.find(m => m.id === o.mo) || S.my).region === reg);
  const approved = odsf.filter(o => ["approved", "implementation", "completed"].includes(o.status)).reduce((a, o) => a + o.amount, 0);
  const avg = Math.round(mos.reduce((a, m) => a + compliancePct(latest(m)), 0) / (mos.length || 1));
  const gps = gpsOf();
  const mand = gps.filter(g => g.mandatory).map(g => ({ label: g.id + " " + L(g.text).slice(0, 48) + "…", value: Math.round(100 * mos.filter(m => latest(m)[g.id] <= 1).length / (mos.length || 1)) })).sort((a, b) => b.value - a.value).slice(0, 5);
  const persist = gps.map(g => ({ label: g.id + " " + L(g.text).slice(0, 48) + "…", value: mos.filter(m => m.c2 && m.c1[g.id] <= 1 && m.c2[g.id] <= 1).length })).sort((a, b) => b.value - a.value).slice(0, 5);
  const riskCount = {}; mos.forEach(m => m.risks.forEach(r => riskCount[r] = (riskCount[r] || 0) + 1));
  const risks = Object.entries(riskCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ label: k, value: v }));
  const regions = D.REGIONS.map(r => { const rm = NETWORK.filter(m => m.region === r); return { r, n: rm.length, post: rm.filter(m => m.phase === "post").length, c1: Math.round(rm.reduce((a, m) => a + compliancePct(m.c1), 0) / rm.length), c2: rm.filter(m => m.c2).length ? Math.round(rm.filter(m => m.c2).reduce((a, m) => a + compliancePct(m.c2), 0) / rm.filter(m => m.c2).length) : null }; });
  const assessors = D.ASSESSORS.map(a => { const am = mos.filter(m => m.assessor === a && m.phase !== "none"); const reasons = {}; am.forEach(m => reasons[m.delayReason] = (reasons[m.delayReason] || 0) + 1);
    return { a, n: am.length, d: am.length ? Math.round(am.reduce((x, m) => x + m.delay, 0) / am.length) : 0, why: (Object.entries(reasons).sort((x, y) => y[1] - x[1])[0] || ["—"])[0] }; });
  const ostat = ["submitted", "review", "approved", "implementation", "completed", "rejected"].map(s => ({ label: t("o_" + s), value: odsf.filter(o => o.status === s).length }));
  return `<section class="card pad"><div class="row between"><h2>${S.role === "regional" ? t("r_regional") + " · " + esc(S.my.region) : S.role === "revcom" ? t("r_revcom") : t("r_gs")} — ${t("n_home")}</h2>
    <div class="row">${S.role !== "regional" ? `<label class="inline">${t("filterRegion")} <select data-bind="regionFilter"><option value="">${t("all")}</option>${D.REGIONS.map(r => `<option ${r === S.regionFilter ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></label>` : ""}<button class="btn secondary sm" data-act="exportCsv">${t("exportCsv")}</button></div></div>
    <p class="note">${t("sampleNote")} 42 fictional MOs.</p>
    <div class="kpis">${kpi(t("kpi_mos"), mos.length)}${kpi(t("kpi_inSelf"), ph("self"))}${kpi(t("kpi_inExt"), ph("external"))}${kpi(t("kpi_inPost"), ph("post"))}${kpi(t("kpi_avg"), avg + "%")}${kpi(t("kpi_odsf"), odsf.length)}${kpi(t("kpi_funds"), fmtEUR(approved))}</div></section>
   <div class="grid2">
    <section class="card pad"><h3>${t("ch_byStandard")}</h3>${bars(S.ort.map(s => ({ label: L(s.name).split("·")[0].trim(), values: [stdPct(mos, s.id, 1), stdPct(mos, s.id, 2)] })), { unit: "%", legend: [t("cycle") + " 1", t("cycle") + " 2"] })}</section>
    <section class="card pad"><h3>${t("ch_trend")}</h3>${lineChart(trendSeries(mos))}</section>
    <section class="card pad"><h3>${t("ch_mandatory")}</h3>${bars(mand, { unit: "%" })}</section>
    <section class="card pad"><h3>${t("ch_persist")}</h3>${bars(persist, { max: Math.max(1, ...persist.map(p => p.value)) })}</section>
    <section class="card pad"><h3>${t("ch_risks")}</h3>${bars(risks, { max: Math.max(1, ...risks.map(p => p.value)) })}</section>
    <section class="card pad"><h3>${t("ch_odsf")}</h3>${bars(ostat, { max: Math.max(1, ...ostat.map(p => p.value)) })}<p class="fine">${odsf.filter(o => o.ipActions && o.ipActions.length).length} linked to CIMS Improvement Plans · Initiating ${odsf.filter(o => o.fund === "initiating").length} · Improvement ${odsf.filter(o => o.fund === "improvement").length}</p></section>
   </div>
   <section class="card pad"><h3>${t("ch_region")}</h3><table><thead><tr><th>${t("region")}</th><th>MOs</th><th>${t("kpi_inPost")}</th><th>${t("cycle")} 1</th><th>${t("cycle")} 2</th><th>Δ</th></tr></thead><tbody>${regions.map(x => `<tr class="${x.r === reg ? "hl" : ""}"><td>${esc(x.r)}</td><td>${x.n}</td><td>${x.post}</td><td>${x.c1}%</td><td>${x.c2 == null ? "—" : x.c2 + "%"}</td><td>${x.c2 == null ? "—" : (x.c2 - x.c1 > 0 ? "▲ +" : "▼ ") + (x.c2 - x.c1)}</td></tr>`).join("")}</tbody></table></section>
   <section class="card pad"><h3>${t("ch_assessors")}</h3><table><thead><tr><th>Assessor</th><th>${t("assessments")}</th><th>${t("avgDelay")}</th><th>${t("delayReason")}</th></tr></thead><tbody>${assessors.map(x => `<tr><td>${esc(x.a)}</td><td>${x.n}</td><td>${x.d > 30 ? pill(x.d, "bad") : x.d}</td><td>${esc(x.why)}</td></tr>`).join("")}</tbody></table></section>
   ${S.role === "regional" ? `<section class="card pad"><h3>${esc(S.my.name)} — ${t("s_" + S.my.status)}</h3>${stepper()}${workflowButtons()}</section>` : ""}`;
}

V.ort = () => {
  const r = S.role, s = S.my.status, a = S.my.answers;
  const moEdit = r === "mo" && (s === "self_in_progress" || s === "external_completed");
  const asEdit = r === "assessor" && s === "external_in_progress";
  const evClosed = r === "assessor" && stIdx(s) >= 3;
  const std = S.ort.find(x => x.id === S.ortTab) || S.ort[0];
  return `<section class="card pad"><div class="row between"><h2>${t("n_ort")} · ${esc(S.my.name)}</h2>${pill(t("s_" + s), "blue")}</div>
   <p class="note">${t("sampleNote")}</p>${r === "assessor" ? `<p class="note warn">${t("hiddenScore")}</p>` : ""}${evClosed ? `<p class="note bad">${t("evidenceClosed")}</p>` : ""}
   <div class="tabs" role="tablist">${S.ort.map(x => `<button role="tab" aria-selected="${x.id === std.id}" class="tab ${x.id === std.id ? "on" : ""}" data-act="ortTab" data-id="${x.id}">${esc(L(x.name).split("·")[0].trim())}${x.crossCutting ? " ✦" : ""}</button>`).join("")}</div>
   ${std.crossCutting ? `<p class="fine">✦ ${t("standalone")} — ${t("crossCutting")}</p>` : ""}
   <h3>${esc(L(std.name))}</h3>
   ${std.articles.map(art => `<div class="article"><h4>${esc(art.id)} · ${esc(L(art.name))} ${art.mandatory ? pill(t("mandatory"), "bad") : ""}</h4>
     ${art.gps.map(g => gpCard(g, a[g.id] || {}, moEdit, asEdit, evClosed)).join("")}</div>`).join("")}
   ${workflowButtons()}</section>`;
};
function scoreSel(field, gp, val, dis) { return `<select data-gp="${gp}" data-field="${field}" ${dis ? "disabled" : ""}><option value="">${t("sc_na")}</option>${[0, 1, 2, 3].map(n => `<option value="${n}" ${val === n ? "selected" : ""}>${t("sc_" + n)}</option>`).join("")}</select>`; }
function gpCard(g, ans, moEdit, asEdit, evClosed) {
  const r = S.role, showSelf = r !== "assessor", evs = (ans.ev || []).map(id => S.evidence.find(e => e.id === id)).filter(Boolean);
  const gl = g.g || {};
  return `<div class="gp" id="${g.id}"><div class="row between"><div><b>${esc(g.id)}</b> ${esc(L(g.text))}</div>
    <div class="row">${showSelf && ans.self != null ? pill(t("selfScore") + ": " + ans.self, scoreCls(ans.self)) : ""}${ans.aScore != null ? pill(t("assessorScore") + ": " + ans.aScore, scoreCls(ans.aScore)) : ""}</div></div>
    <details class="guide"><summary>${t("guidelines")}</summary><dl><dt>${t("g_purpose")}</dt><dd>${esc(gl.purpose)}</dd><dt>${t("g_required")}</dt><dd>${esc(gl.required)}</dd><dt>${t("g_context")}</dt><dd>${esc(gl.context)}</dd></dl></details>
    <div class="gp-grid">
     ${showSelf ? `<label>${t("selfScore")}${scoreSel("self", g.id, ans.self, !moEdit)}</label>` : ""}
     <label>${t("moComment")}<textarea rows="2" data-gp="${g.id}" data-field="comment" ${moEdit ? "" : "readonly"}>${esc(ans.comment)}</textarea></label>
     ${showSelf ? `<label>${t("risk")}<select data-gp="${g.id}" data-field="risk" ${moEdit ? "" : "disabled"}><option value="">—</option>${["high", "med", "low"].map(k => `<option value="${k}" ${ans.risk === k ? "selected" : ""}>${t("rk_" + k)}</option>`).join("")}</select></label>
     <label>${t("expected")}<input data-gp="${g.id}" data-field="expected" value="${esc(ans.expected)}" ${moEdit ? "" : "readonly"}></label>
     <label class="chk"><input type="checkbox" data-gp="${g.id}" data-field="priority" ${ans.priority ? "checked" : ""} ${moEdit ? "" : "disabled"}> ${t("priority")}</label>` : ""}
     ${(r === "assessor" || stIdx(S.my.status) >= 3) ? `<label>${t("assessorScore")}${scoreSel("aScore", g.id, ans.aScore, !asEdit)}</label><label>${t("assessorComment")}<textarea rows="2" data-gp="${g.id}" data-field="aComment" ${asEdit ? "" : "readonly"}>${esc(ans.aComment)}</textarea></label>` : ""}
    </div>
    <div class="ev"><b>${t("evidence")}:</b> ${evClosed ? `<span class="muted">${t("evidenceClosed")}</span>` : evs.length ? evs.map(e => `<span class="chip">📎 ${esc(e.name)} ${e.data ? `<a href="#" data-act="dl" data-id="${e.id}">${t("download")}</a>` : ""}${moEdit ? ` <a href="#" data-act="unlink" data-gp="${g.id}" data-id="${e.id}" aria-label="remove">✕</a>` : ""}</span>`).join(" ") : `<span class="muted">${t("none")}</span>`}
     ${moEdit ? `<select data-act-change="attach" data-gp="${g.id}"><option value="">${t("attach")}…</option>${S.evidence.filter(e => !(ans.ev || []).includes(e.id)).map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join("")}</select>
       <label class="filebtn">${t("upload")}<input type="file" data-upload="${g.id}" hidden></label>` : ""}
     ${moEdit && ans.self != null && ans.self < 3 && !S.ip.some(x => x.gp === g.id) ? `<button class="btn secondary sm" data-act="fromGP" data-gp="${g.id}">＋ ${t("fromGP")}</button>` : ""}
    </div>
    ${(r === "assessor" || r === "mo") && stIdx(S.my.status) >= 2 ? `<details class="chat" ${(ans.chat && ans.chat.length) || asEdit ? "open" : ""}><summary>💬 ${t("clarify")} (${(ans.chat || []).length})</summary>
      ${(ans.chat || []).map(c => `<div class="msg ${c.who === "Assessor" ? "them" : "me"}"><b>${esc(c.who)}</b> <time>${esc(c.ts)}</time><br>${esc(c.text)}</div>`).join("")}
      ${(asEdit || (r === "mo" && S.my.status === "external_in_progress")) ? `<div class="row"><input id="chat-${g.id}" placeholder="${esc(t("clarifyPh"))}"><button class="btn sm" data-act="chat" data-gp="${g.id}">${t("send")}</button></div>` : ""}</details>` : ""}
  </div>`;
}

V.evidence = () => {
  const closed = S.role === "assessor" && stIdx(S.my.status) >= 3, a = S.my.answers;
  return `<section class="card pad"><h2>${t("n_evidence")}</h2><p class="note">${t("uploadedOnce")} · ${t("dataProtection")}</p>
   ${closed ? `<p class="note bad">${t("evidenceClosed")}</p>` : `<table><thead><tr><th>${t("file")}</th><th>${t("size")}</th><th>${t("updated")}</th><th>${t("version")}</th><th>${t("linkedTo")}</th><th></th></tr></thead><tbody>
   ${S.evidence.map(e => { const linked = Object.keys(a).filter(g => (a[g].ev || []).includes(e.id));
     return `<tr><td>${e.confidential ? "🔒 " : ""}${esc(e.name)}</td><td>${Math.round(e.size / 1024)} KB</td><td>${esc(e.uploaded)} · ${esc(e.by)}</td><td>v${e.versions}</td><td>${linked.map(g => `<a href="#ort" data-act="gotoGP" data-gp="${g}">${g}</a>`).join(", ") || "—"}</td>
     <td>${e.data ? `<a href="#" data-act="dl" data-id="${e.id}">${t("download")}</a>` : `<span class="fine">metadata only</span>`}${S.role === "mo" ? ` · <label class="filebtn sm">↻ v${e.versions + 1}<input type="file" data-replace="${e.id}" hidden></label>` : ""}</td></tr>`; }).join("")}</tbody></table>
   ${S.role === "mo" ? `<label class="filebtn">${t("upload")}<input type="file" data-upload="" hidden></label>` : ""}`}
   <p class="fine">Files ≤ 400 KB are stored in this browser for the demo; larger files keep metadata only. Production: encrypted object storage with access logging and retention rules.</p></section>`;
};

V.ip = () => {
  const edit = S.role === "mo";
  const gpOpts = sel => `<option value="">—</option>` + gpsOf().map(g => `<option value="${g.id}" ${sel === g.id ? "selected" : ""}>${g.id}</option>`).join("");
  const regional = S.role === "regional" || S.role === "revcom" ? regionalIPFollowUp() : "";
  return `<section class="card pad"><div class="row between"><h2>${t("n_ip")} · ${esc(S.my.name)}</h2>${pill(t("s_" + S.my.status), "blue")}</div>
   ${S.ip.length ? `<div class="tablewrap"><table class="ip"><thead><tr><th>${t("actions")}</th><th>${t("linkedGP")}</th><th>${t("odArea")}</th><th>${t("owner")}</th><th>${t("deadline")}</th><th>${t("status")}</th><th>${t("progress")}</th><th>${t("notes")}</th><th>ODSF</th></tr></thead><tbody>
   ${S.ip.map(x => { const late = x.status !== "done" && daysTo(x.deadline) < 0;
     return `<tr class="${late ? "late" : ""}"><td>${edit ? `<input data-ip="${x.id}" data-f="title" value="${esc(x.title)}">` : esc(x.title)}</td>
     <td>${edit ? `<select data-ip="${x.id}" data-f="gp">${gpOpts(x.gp)}</select>` : esc(x.gp)}</td>
     <td>${edit ? `<select data-ip="${x.id}" data-f="od">${D.OD_AREAS.map(o => `<option ${o === x.od ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>` : esc(x.od)}</td>
     <td>${edit ? `<input data-ip="${x.id}" data-f="owner" value="${esc(x.owner)}">` : esc(x.owner)}</td>
     <td>${edit ? `<input type="date" data-ip="${x.id}" data-f="deadline" value="${esc(x.deadline)}">` : esc(x.deadline)}${late ? "<br>" + pill(t("overdue"), "bad") : ""}</td>
     <td>${edit ? `<select data-ip="${x.id}" data-f="status">${["planned", "in_progress", "done", "delayed"].map(o => `<option value="${o}" ${o === x.status ? "selected" : ""}>${t("st_" + o)}</option>`).join("")}</select>` : t("st_" + x.status)}</td>
     <td>${edit ? `<input type="range" min="0" max="100" step="5" data-ip="${x.id}" data-f="progress" value="${x.progress}">` : ""}<span>${x.progress}%</span></td>
     <td>${edit ? `<textarea rows="2" data-ip="${x.id}" data-f="notes">${esc(x.notes)}</textarea>` : esc(x.notes)}</td>
     <td>${x.odsf ? pill(x.odsf, "blue") : "—"}</td></tr>`; }).join("")}</tbody></table></div>` : `<p>${t("ipEmpty")}</p>`}
   ${edit ? `<button class="btn secondary" data-act="addIP">＋ ${t("addAction")}</button>` : ""}
   </section>
   <section class="card pad"><h3>${t("rep2")} / ${t("rep4")}</h3><div class="grid2">${["r2", "r4"].map(k => { const rep = S.reports[k];
     return `<div><h4>${t(k === "r2" ? "rep2" : "rep4")}</h4>${rep ? `<p>${pill(t("o_submitted"), "ok")} ${esc(rep.ts)}</p><blockquote>${esc(rep.text)}</blockquote>` : edit ? `<textarea id="rep-${k}" rows="3" placeholder="Progress against expected results, challenges, support required…"></textarea><button class="btn sm" data-act="report" data-k="${k}">${t("submitReport")}</button>` : `<p class="muted">—</p>`}</div>`; }).join("")}</div>
   ${S.reports.reviews.map(r => `<p class="fine">🗒 ${esc(r.ts)} ${esc(r.who)}: ${esc(r.text)}</p>`).join("")}
   ${(S.role === "revcom" || S.role === "regional") && (S.reports.r2 || S.reports.r4) ? `<div class="row"><input id="rev-note" placeholder="Review of progress / recommendation…"><button class="btn sm" data-act="reviewReport">${t("save")}</button></div>` : ""}</section>${regional}`;
};
function regionalIPFollowUp() {
  const mos = netFiltered().filter(m => m.phase === "post");
  return `<section class="card pad"><h3>${t("n_ip")} — follow-up (${S.role === "regional" ? esc(S.my.region) : t("all")})</h3><table><thead><tr><th>MO</th><th>${t("region")}</th><th>${t("progress")}</th><th>${t("rep2")}</th><th>${t("status")}</th></tr></thead><tbody>
   ${mos.map((m, i) => { const p = (m.delay * 7 + i * 13) % 100, late = m.delay > 40; return `<tr class="${late ? "late" : ""}"><td>${esc(m.name)}</td><td>${esc(m.region)}</td><td><span class="mini"><i style="width:${p}%"></i></span> ${p}%</td><td>${m.delay > 20 ? pill(t("overdue"), "bad") : pill(t("o_submitted"), "ok")}</td><td>${late ? pill(t("escalated"), "warn") : "—"}</td></tr>`; }).join("")}</tbody></table></section>`;
}

V.odsf = () => {
  const r = S.role, reg = r === "regional" ? S.my.region : "";
  let list = S.odsf.filter(o => r !== "mo" || o.mo === S.my.id).filter(o => !reg || (NETWORK.find(m => m.id === o.mo) || S.my).region === reg);
  list = list.slice().sort((a, b) => (b.mo === S.my.id) - (a.mo === S.my.id));
  return `<section class="card pad"><div class="row between"><h2>${t("n_odsf")}</h2>${r === "mo" ? `<button class="btn" data-act="odsfNew">＋ ${t("odsfNew")}</button>` : ""}</div>
   <p class="note">${t("dataProtection")}</p>
   <table><thead><tr><th>ID</th><th>MO</th><th>${t("fund")}</th><th>${t("title_")}</th><th>${t("amount")}</th><th>${t("months")}</th><th>${t("linkedGP")} / IP</th><th>${t("status")}</th><th></th></tr></thead><tbody>
   ${list.map(o => `<tr class="${o.mo === S.my.id ? "hl" : ""}"><td>${esc(o.id)}</td><td>${esc(o.mo === S.my.id ? S.my.name : (NETWORK.find(m => m.id === o.mo) || {}).name)}</td><td>${o.fund === "initiating" ? "Initiating" : "Improvement"}</td><td>${esc(o.title)}</td><td>${fmtEUR(o.amount)}</td><td>${o.months}</td><td>${(o.ipActions || []).join(", ") || "—"}</td><td>${pill(t("o_" + o.status), { approved: "ok", completed: "ok", rejected: "bad", implementation: "blue" }[o.status])}</td><td><button class="btn sm secondary" data-act="odsfOpen" data-id="${o.id}">${t("actions")}</button></td></tr>`).join("") || `<tr><td colspan="9">${t("none")}</td></tr>`}</tbody></table></section>`;
};
function odsfForm() {
  return `<h2>${t("odsfNew")}</h2><p class="fine">Linked to ${esc(S.my.name)} · CIMS cycle ${S.my.cycle}</p>
  <label>${t("fund")}<select id="of-fund"><option value="improvement">${t("f_improvement")}</option><option value="initiating">${t("f_initiating")}</option></select></label>
  <label>${t("title_")}<input id="of-title" value="Support for Improvement Plan priorities"></label>
  <fieldset><legend>${t("selectIP")}</legend>${S.ip.map(x => `<label class="chk"><input type="checkbox" class="of-ip" value="${x.id}" ${x.odsf ? "disabled" : ""}> ${esc(x.id)} · ${esc(x.title)} <span class="fine">(${esc(x.gp)} · ${esc(x.od)} · ${t("risk")}: ${esc(t("rk_" + ((S.my.answers[x.gp] || {}).risk || "med")))})</span></label>`).join("") || t("ipEmpty")}</fieldset>
  <div class="grid2"><label>${t("amount")}<input id="of-amount" type="number" value="12000" min="0"></label><label>${t("months")}<input id="of-months" type="number" value="12" min="1"></label></div>
  <label>${t("justification")}<textarea id="of-just" rows="3">Activities address high-risk non-compliance identified in the CIMS assessment.</textarea></label>
  <p id="of-err" class="err"></p><div class="row"><button class="btn" data-act="odsfCreate">${t("submit")}</button><button class="btn secondary" data-act="closeModal">${t("cancel")}</button></div>`;
}
function odsfDetail(o) {
  const r = S.role, b = [];
  if (r === "mo" && o.status === "draft") b.push(["odsfSubmit", t("submit")]);
  if ((r === "regional" || r === "gs") && o.status === "submitted") b.push(["odsfRecommend", t("recommend")]);
  if (r === "revcom" && o.status === "review") { b.push(["odsfApprove", t("approve")]); b.push(["odsfReject", t("reject")]); }
  if (r === "gs" && o.status === "approved") b.push(["odsfStart", t("startImpl")]);
  if (r === "mo" && o.status === "implementation") { b.push(["odsfProgress", t("progressReport")]); b.push(["odsfFinal", t("finalReport")]); }
  const ipl = (o.ipActions || []).map(id => S.ip.find(x => x.id === id)).filter(Boolean);
  return `<h2>${esc(o.id)} · ${esc(o.title)}</h2><p>${pill(t("o_" + o.status), "blue")} ${fmtEUR(o.amount)} · ${o.months} ${t("months").toLowerCase()} · ${o.fund}</p>
   ${ipl.length ? `<h3>CIMS → IP → ODSF</h3><ul>${ipl.map(x => `<li>${esc(x.gp)} (${t("risk")}: ${esc(t("rk_" + ((S.my.answers[x.gp] || {}).risk || "med")))}) → ${esc(x.id)} ${esc(x.title)} → ${esc(o.id)} · ${x.progress}%</li>`).join("")}</ul>` : ""}
   ${o.just ? `<p><b>${t("justification")}:</b> ${esc(o.just)}</p>` : ""}
   <h3>${t("workflowLog")}</h3><ul class="log">${(o.log || []).map(l => `<li><time>${esc(l.ts)}</time> <b>${esc(l.who)}</b> — ${esc(l.what)}</li>`).join("") || "<li>—</li>"}</ul>
   ${b.length ? `<label>${t("comment")}<input id="od-note" placeholder="${esc(t("comment"))}"></label><div class="row">${b.map(([a, l]) => `<button class="btn" data-act="${a}" data-id="${o.id}">${esc(l)}</button>`).join("")}</div>` : `<p class="fine">${o.sample ? "Sample record. " : ""}No action for ${esc(t("r_" + r))} at this step.</p>`}
   <div class="row"><button class="btn secondary" data-act="closeModal">${t("close")}</button></div>`;
}

V.revcom = () => {
  const q = [];
  if (S.my.status === "ip_final") q.push(`<tr><td>${esc(S.my.name)}</td><td>${t("s_ip_final")}</td><td><button class="btn sm" data-act="validate">${t("validate")}</button></td></tr>`);
  const odq = S.odsf.filter(o => o.status === "review");
  return `<section class="card pad"><h2>${t("n_revcom")}</h2><p class="note">Validation of assessment reports & Improvement Plans, 2/4-year follow-up, ODSF decisions, cases needing attention.</p>
   <h3>Validation queue</h3><table><tbody>${q.join("") || `<tr><td class="muted">${t("none")} — ${esc(S.my.name)}: ${t("s_" + S.my.status)}</td></tr>`}</tbody></table>
   ${S.role === "gs" || S.role === "revcom" ? workflowButtons() : ""}
   <h3>ODSF — ${t("o_review")}</h3><table><tbody>${odq.map(o => `<tr><td>${esc(o.id)}</td><td>${esc(o.title)}</td><td>${fmtEUR(o.amount)}</td><td><button class="btn sm secondary" data-act="odsfOpen" data-id="${o.id}">${t("actions")}</button></td></tr>`).join("") || `<tr><td class="muted">${t("none")}</td></tr>`}</tbody></table>
   <h3>Cases flagged (persistent non-compliance or delays)</h3><table><tbody>${NETWORK.filter(m => m.phase === "post" && m.delay > 40).map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.region)}</td><td>${m.delay} d · ${esc(m.delayReason)}</td><td>${pill(t("escalated"), "warn")}</td></tr>`).join("")}</tbody></table>
   ${lettersList()}</section>`;
};

function computeAlerts() {
  const out = [], r = S.role;
  S.ip.forEach(x => { if (x.status === "done") return; const d = daysTo(x.deadline);
    if (d < 0) out.push({ lvl: "bad", tag: t("overdue"), txt: `${S.my.name} · ${x.id} ${x.title} (${-d} d)` + (d < -30 ? " · " + t("escalated") : ""), roles: ["mo", "regional", "revcom", "gs"] });
    else if (d <= 30) out.push({ lvl: "warn", tag: t("dueSoon"), txt: `${S.my.name} · ${x.id} ${x.title} → ${x.deadline}`, roles: ["mo", "regional", "gs"] }); });
  const map = { self_submitted: ["gs", "regional"], external_in_progress: ["assessor"], external_completed: ["mo"], ip_final: ["revcom"], validated: ["gs", "revcom"] };
  if (map[S.my.status]) out.push({ lvl: "warn", tag: t("nextStep"), txt: `${S.my.name}: ${nextStepText()}`, roles: map[S.my.status] });
  S.odsf.filter(o => o.mo === S.my.id || !o.sample).forEach(o => { if (o.status === "submitted") out.push({ lvl: "warn", tag: "ODSF", txt: `${o.id} ${t("o_submitted")} → ${t("recommend")}`, roles: ["regional", "gs"] });
    if (o.status === "review") out.push({ lvl: "warn", tag: "ODSF", txt: `${o.id} → ${t("approve")}/${t("reject")}`, roles: ["revcom"] });
    if (o.status === "approved") out.push({ lvl: "info", tag: "ODSF", txt: `${o.id} ${t("o_approved")} → ${t("startImpl")}`, roles: ["gs", "mo"] });
    if (o.status === "implementation") out.push({ lvl: "info", tag: "ODSF", txt: `${o.id}: ${t("progressReport")} ${addDays(60)}`, roles: ["mo", "regional"] }); });
  NETWORK.filter(m => m.phase === "external" && m.delay > 45).slice(0, 4).forEach(m => out.push({ lvl: "bad", tag: t("overdue"), txt: `${m.name} external assessment +${m.delay} d (${m.delayReason})`, roles: ["gs", "regional", "revcom"] }));
  S.docs.filter(d => d.updated > S.seenDocs).forEach(d => out.push({ lvl: "info", tag: t("n_knowledge"), txt: `${L(d.title)} v${d.version} ${t("updated").toLowerCase()} ${d.updated}`, roles: ["mo", "assessor", "regional", "revcom", "gs"] }));
  if (S.baobab.some(b => b.status === "queued")) out.push({ lvl: "info", tag: "Baobab", txt: `${S.baobab.filter(b => b.status === "queued").length} ${t("queued")}`, roles: ["gs"] });
  return out.filter(a => a.roles.includes(r));
}
V.alerts = () => { const al = computeAlerts();
  return `<section class="card pad"><h2>${t("alertsTitle")}</h2><ul class="alerts">${al.map(a => `<li class="${a.lvl}">${pill(a.tag, a.lvl)} ${esc(a.txt)}</li>`).join("") || `<li>${t("none")}</li>`}</ul>
  <p class="fine">Rules: due ≤ 30 days → reminder; overdue → alert; overdue > 30 days → escalation to Regional Secretariat. Production: e-mail + in-app, digest options, configurable per role.</p></section>`; };

V.knowledge = () => {
  const q = S.kcQuery.toLowerCase(), r = S.role;
  const docs = S.docs.filter(d => r === "gs" || d.audience.includes("all") || d.audience.includes(r)).filter(d => !S.kcType || d.type === S.kcType).filter(d => !q || L(d.title).toLowerCase().includes(q) || d.type.toLowerCase().includes(q));
  const types = [...new Set(S.docs.map(d => d.type))];
  return `<section class="card pad"><h2>${t("n_knowledge")}</h2>
   <div class="row"><input id="kc-q" type="search" placeholder="${t("search")}…" value="${esc(S.kcQuery)}" style="max-width:20rem"><select data-bind="kcType"><option value="">${t("type")}: ${t("all")}</option>${types.map(x => `<option ${x === S.kcType ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
   <table><thead><tr><th>${t("title_")}</th><th>${t("type")}</th><th>${t("audience")}</th><th>${t("language")}</th><th>${t("version")}</th><th>${t("updated")}</th><th></th></tr></thead><tbody>
   ${docs.map(d => `<tr><td>${d.updated > S.seenDocs ? pill("NEW", "warn") + " " : ""}${esc(L(d.title))}<div class="tr" id="tr-${d.id}"></div></td><td>${esc(d.type)}</td><td>${d.audience.map(a => a === "all" ? t("all") : esc(t("r_" + a).split("(")[0])).join(", ")}</td><td>${esc(d.langs)}</td><td>v${d.version}</td><td>${esc(d.updated)}</td>
     <td class="nowrap"><a href="#" data-act="docDl" data-id="${d.id}">${t("download")}</a> · <a href="#" data-act="translate" data-id="${d.id}">${t("translate")}</a></td></tr>`).join("") || `<tr><td colspan="7">${t("none")}</td></tr>`}</tbody></table>
   ${r === "gs" ? `<details class="admin"><summary>${t("kcUpload")}</summary><div class="grid2"><label>${t("title_")}<input id="kc-title" value="Updated guidance note (sample)"></label><label>${t("type")}<select id="kc-type">${types.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
     <label>${t("audience")}<select id="kc-aud"><option value="all">${t("all")}</option>${Object.keys(NAV).map(k => `<option value="${k}">${esc(t("r_" + k))}</option>`).join("")}</select></label><label>Replace existing<select id="kc-replace"><option value="">—</option>${S.docs.map(d => `<option value="${d.id}">${esc(L(d.title))}</option>`).join("")}</select></label></div>
     <button class="btn" data-act="kcAdd">${t("save")}</button></details>` : ""}
   <button class="btn secondary sm" data-act="markSeen">✓ Mark updates as read</button></section>`;
};

V.baobab = () => `<section class="card pad"><h2>${t("baobabTitle")}</h2><p class="note warn">${t("baobabNote")}</p>
  <table><thead><tr><th>ID</th><th>Item</th><th>${t("status")}</th><th>${t("updated")}</th><th>Remote ref</th></tr></thead><tbody>${S.baobab.map(b => `<tr><td>${esc(b.id)}</td><td>${esc(b.ref)}</td><td>${pill(t(b.status), b.status === "synced" ? "ok" : "warn")}</td><td>${esc(b.ts)}</td><td>${esc(b.remote || "—")}</td></tr>`).join("")}</tbody></table>
  <div class="row"><button class="btn" data-act="sync">${t("syncNow")}</button><span class="fine">${navigator.onLine ? t("online") : t("offline")}</span></div>
  <h3>Proposed mechanism</h3><ol><li>RevCom validation sets <code>validated=true</code> + timestamp on the report.</li><li>Authorised CI GS user approves publication (audit-logged).</li><li>Outbox job pushes the report PDF + metadata to Baobab (Caritas Connect) via its API or a secure file drop; retries with back-off; result stored as remote reference.</li></ol></section>`;

V.config = () => `<section class="card pad"><h2>${t("configTitle")}</h2><p class="note">${t("configNote")}</p>
  ${S.ort.map(s => `<details ${s.id === "S1" ? "open" : ""}><summary><b>${esc(L(s.name))}</b> · ${s.articles.length} ${t("article").toLowerCase()}s</summary>
   ${s.articles.map(a => `<div class="article"><div class="row between"><b>${esc(a.id)} ${esc(L(a.name))}</b><label class="chk"><input type="checkbox" data-mand="${s.id}|${a.id}" ${a.mandatory ? "checked" : ""}> ${t("mandatory")}</label></div>
     <ul>${a.gps.map(g => `<li>${esc(g.id)} — ${esc(L(g.text))}${g.custom ? ` <a href="#" data-act="delGP" data-p="${s.id}|${a.id}|${g.id}">✕</a>` : ""}</li>`).join("")}</ul>
     <div class="row"><input id="ngp-${a.id}" placeholder="${t("statement")} (EN)"><button class="btn sm secondary" data-act="addGP" data-p="${s.id}|${a.id}">＋ ${t("addGP")}</button></div></div>`).join("")}</details>`).join("")}
  <p class="fine">Production adds versioning of the framework (cycle-specific snapshots) so earlier assessments stay comparable.</p></section>`;

V.users = () => { const roles = Object.keys(NAV);
  const M = [["Self-assessment (ORT)", "VE D", "V", "V", "V", "V D"], ["MO self-scores", "VE", "—", "V", "V", "V"], ["Assessor scores & report", "V", "VE", "V", "VA", "VA D"], ["Evidence (during assessment)", "VE D", "V D", "V", "V", "V D"], ["Evidence (after completion)", "V D", "—", "V", "V", "V D"], ["Improvement Plan", "VE", "V", "V", "VA", "V"], ["2-/4-year reports", "VE", "—", "V", "VA", "V"], ["ODSF application", "VE", "—", "V", "V", "V"], ["ODSF recommendation", "—", "—", "VE", "V", "VE"], ["ODSF decision", "—", "—", "V", "VA", "V"], ["Dashboards", "own MO", "assigned", "region", "all", "all"], ["Knowledge Centre admin", "—", "—", "—", "—", "VE"], ["ORT configuration", "—", "—", "—", "—", "VE"], ["Baobab publication", "—", "—", "—", "A", "A"]];
  return `<section class="card pad"><h2>${t("usersTitle")}</h2><p class="note">V = ${t("perm_view")} · E = ${t("perm_edit")} · A = ${t("perm_approve")} · D = ${t("perm_download")}. Illustrative — exact permissions to be agreed against the approved RACI matrix.</p>
  <div class="tablewrap"><table><thead><tr><th></th>${roles.map(r => `<th>${esc(t("r_" + r))}</th>`).join("")}</tr></thead><tbody>${M.map(row => `<tr><td>${esc(row[0])}</td>${row.slice(1).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <p class="fine">Production: SSO/MFA, per-MO and per-region data scoping enforced server-side, full audit trail.</p></section>`; };

/* ---------- letters ---------- */
function makeLetter(kind) {
  const d = today(), mo = S.my.name;
  const body = { engagement: `ENGAGEMENT LETTER (sample template)\n\nDate: ${d}\nTo: ${S.my.assessor}\nRe: External CIMS assessment of ${mo}, cycle ${S.my.cycle}\n\nYou are mandated to carry out the external assessment of ${mo}. Access to the self-assessment workspace and evidence is granted for the duration of the assessment and closes on completion.\n\nSigned electronically: CI General Secretariat (demo)`,
    ip_request: `LETTER TO MEMBER ORGANISATION (sample template)\n\nDate: ${d}\nTo: ${mo}\n\nThe external assessment has been completed. Please review the findings, revise your Improvement Plan (risk analysis and prioritisation) and submit the final version through the platform.\n\nCI General Secretariat (demo)`,
    certificate: `CERTIFICATE OF CIMS ASSESSMENT (sample — auto-generated)\n\n${mo}\nhas completed CIMS assessment cycle ${S.my.cycle}.\nValidated by the Review Commission on ${d}.\nCompliance (assessor scores): ${compliancePct(Object.fromEntries(Object.entries(S.my.answers).map(([k, v]) => [k, v.aScore])))}% of scored GP statements.\n\nDemo by 92 Logics — not an official certificate.` }[kind];
  const title = { engagement: "Engagement letter", ip_request: "Letter: submit final Improvement Plan", certificate: "Certificate" }[kind];
  S.letters.push({ ts: d, title, body }); return S.letters.length - 1;
}
function openLetter(i) { const l = S.letters[i]; modal(`<div class="letter" id="printable"><pre>${esc(l.body)}</pre></div><div class="row"><button class="btn" data-act="printLetter">${t("print")}</button><button class="btn secondary" data-act="closeModal">${t("close")}</button></div>`); }

/* ---------- modal ---------- */
function modal(html) { $("#modal-body").innerHTML = html; $("#modal").hidden = false; const f = $("#modal-body").querySelector("input,select,button"); if (f) f.focus(); }
function closeModal() { $("#modal").hidden = true; }

/* ---------- render ---------- */
function render() {
  document.documentElement.lang = S.lang;
  $("#t-banner").textContent = t("banner"); $("#t-title").textContent = t("title"); $("#t-lede").textContent = t("lede"); $("#t-guide").textContent = t("demoGuide");
  $("#lbl-role").textContent = t("role"); $("#lbl-lang").textContent = t("lang"); $("#btn-reset").textContent = t("reset");
  $("#sel-role").innerHTML = Object.keys(NAV).map(r => `<option value="${r}" ${r === S.role ? "selected" : ""}>${esc(t("r_" + r))}</option>`).join("");
  $("#sel-lang").value = S.lang;
  if (!NAV[S.role].includes(S.view)) S.view = NAV[S.role][0];
  const nAlerts = computeAlerts().length;
  $("#nav").innerHTML = NAV[S.role].map(v => `<a href="#${v}" class="${v === S.view ? "on" : ""}" ${v === S.view ? 'aria-current="page"' : ""}>${esc(t("n_" + v))}${v === "alerts" && nAlerts ? ` <span class="badge">${nAlerts}</span>` : ""}</a>`).join("");
  $("#main").innerHTML = (V[S.view] || V.home)();
  netStatus();
}
function netStatus() { const el = $("#net"); el.textContent = navigator.onLine ? "● " + t("online") : "● " + t("offline"); el.className = navigator.onLine ? "net on" : "net off"; }

/* ---------- actions ---------- */
const who = () => ({ mo: S.my.name, assessor: S.my.assessor, regional: "Regional Secretariat " + S.my.region, revcom: "Review Commission", gs: "CI General Secretariat" }[S.role]);
const ACT = {
  ortTab: el => { S.ortTab = el.dataset.id; },
  submitSelf: () => { const st = myStats(); if (st.scored < st.total && !confirm(`${st.scored}/${st.total} scored. Submit anyway (demo)?`)) return false; S.my.status = "self_submitted"; logStep(who(), "Self-assessment closed and submitted to CI GS + Regional Secretariat"); toast(t("s_self_submitted")); },
  startExternal: () => { S.my.status = "external_in_progress"; const i = makeLetter("engagement"); logStep(who(), "Assessor mandated; engagement letter signed: " + S.my.assessor); toast(t("s_external_in_progress")); openLetter(i); },
  completeExternal: () => { S.my.status = "external_completed"; const i = makeLetter("ip_request"); logStep(who(), "External assessment completed; report issued; assessor evidence access closed"); openLetter(i); },
  submitIPFinal: () => { S.my.status = "ip_final"; logStep(who(), "Final Improvement Plan submitted (" + S.ip.length + " actions)"); toast(t("s_ip_final")); },
  validate: () => { S.my.status = "validated"; const i = makeLetter("certificate"); logStep(who(), "Report and Improvement Plan validated; certificate generated"); openLetter(i); },
  publish: () => { S.baobab.push({ id: uid("BQ"), ref: S.my.name + " cycle " + S.my.cycle + " validated report", status: "queued", ts: today(), remote: "" }); logStep(who(), "Publication to Baobab authorised (queued)"); doSync(); },
  sync: () => { doSync(); },
  fromGP: el => { const g = gpsOf().find(x => x.id === el.dataset.gp); S.ip.push({ id: "IP-" + (S.ip.length + 1), title: "Address: " + L(g.text), gp: g.id, od: "Governance", owner: "", deadline: addDays(180), status: "planned", progress: 0, notes: "", odsf: "" }); toast(t("saved") + " → " + t("n_ip")); },
  addIP: () => { S.ip.push({ id: "IP-" + (S.ip.length + 1), title: "New action", gp: "", od: D.OD_AREAS[0], owner: "", deadline: addDays(90), status: "planned", progress: 0, notes: "", odsf: "" }); },
  report: el => { const v = $("#rep-" + el.dataset.k).value.trim(); if (!v) return false; S.reports[el.dataset.k] = { ts: today(), text: v }; logStep(who(), (el.dataset.k === "r2" ? "2" : "4") + "-year Improvement Plan report submitted"); },
  reviewReport: () => { const v = $("#rev-note").value.trim(); if (!v) return false; S.reports.reviews.push({ ts: today(), who: who(), text: v }); },
  chat: el => { const inp = document.getElementById("chat-" + el.dataset.gp), v = inp.value.trim(); if (!v) return false; const a = S.my.answers[el.dataset.gp] = S.my.answers[el.dataset.gp] || { ev: [], chat: [] }; (a.chat = a.chat || []).push({ who: S.role === "assessor" ? "Assessor" : "MO", ts: today(), text: v }); },
  unlink: el => { const a = S.my.answers[el.dataset.gp]; a.ev = a.ev.filter(x => x !== el.dataset.id); },
  gotoGP: el => { const g = gpsOf().find(x => x.id === el.dataset.gp); S.ortTab = g.std; S.view = "ort"; setTimeout(() => { const n = document.getElementById(g.id); if (n) n.scrollIntoView({ behavior: "smooth" }); }, 50); },
  dl: el => { const e = S.evidence.find(x => x.id === el.dataset.id); if (e && e.data) { const a = document.createElement("a"); a.href = e.data; a.download = e.name; a.click(); } return false; },
  docDl: el => { const d = S.docs.find(x => x.id === el.dataset.id); const blob = new Blob([`${L(d.title)}\nVersion ${d.version} · ${d.updated}\n\nPlaceholder document generated by the 92 Logics demo. Real CIMS documents would be served here according to access rights.`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = d.id + "-v" + d.version + ".txt"; a.click(); return false; },
  translate: el => { const d = S.docs.find(x => x.id === el.dataset.id), box = document.getElementById("tr-" + d.id); box.innerHTML = `<span class="fine">${["en", "fr", "es"].filter(l => l !== S.lang).map(l => l.toUpperCase() + ": " + esc(d.title[l])).join(" · ")}<br><i>${t("translating")}</i></span>`; return false; },
  kcAdd: () => { const rep = $("#kc-replace").value, title = $("#kc-title").value.trim() || "Untitled";
    if (rep) { const d = S.docs.find(x => x.id === rep); d.version++; d.updated = today(); }
    else S.docs.push({ id: uid("D"), title: { en: title, fr: title, es: title }, type: $("#kc-type").value, audience: [$("#kc-aud").value], langs: "EN", version: 1, updated: today() });
    S.seenDocs = addDays(-1); toast(t("saved") + " · " + t("alertsTitle")); },
  markSeen: () => { S.seenDocs = today(); },
  addGP: el => { const [s, a] = el.dataset.p.split("|"), inp = document.getElementById("ngp-" + a), v = inp.value.trim(); if (!v) return false; const art = S.ort.find(x => x.id === s).articles.find(x => x.id === a);
    art.gps.push({ id: a.replace("A", "GP") + "." + (art.gps.length + 1), text: { en: v, fr: v, es: v }, g: { purpose: "—", required: "—", context: "—" }, custom: true }); toast(t("saved")); },
  delGP: el => { const [s, a, g] = el.dataset.p.split("|"); const art = S.ort.find(x => x.id === s).articles.find(x => x.id === a); art.gps = art.gps.filter(x => x.id !== g); },
  odsfNew: () => { modal(odsfForm()); return false; },
  odsfCreate: () => { const fund = $("#of-fund").value, amount = +$("#of-amount").value, months = +$("#of-months").value, err = $("#of-err");
    const cap = fund === "initiating" ? 5000 : 20000; if (amount > cap) { err.textContent = t("capError") + " (" + fmtEUR(cap) + ")"; return false; } if (months > 24) { err.textContent = t("periodError"); return false; }
    const ips = [...document.querySelectorAll(".of-ip:checked")].map(x => x.value); const id = "ODSF-" + new Date().getFullYear() + "-" + String(S.odsf.length + 1).padStart(3, "0");
    S.odsf.unshift({ id, mo: S.my.id, fund, title: $("#of-title").value, amount, months, status: "draft", ipActions: ips, just: $("#of-just").value, log: [{ ts: today(), who: who(), what: "Draft created; pre-filled from CIMS (" + ips.length + " IP actions)" }] });
    ips.forEach(x => { S.ip.find(i => i.id === x).odsf = id; }); closeModal(); toast(t("saved")); },
  odsfOpen: el => { modal(odsfDetail(S.odsf.find(o => o.id === el.dataset.id))); return false; },
  closeModal: () => { closeModal(); return false; },
  printLetter: () => { window.print(); return false; },
  openLetter: el => { openLetter(+el.dataset.i); return false; },
  exportCsv: () => { const gps = gpsOf(); const rows = [["mo", "region", "phase", "cycle", "compliance_c1", "compliance_c2", "assessor", "delay_days", ...gps.map(g => g.id + "_latest")]];
    netFiltered().forEach(m => rows.push([m.name, m.region, m.phase, m.cycle, compliancePct(m.c1), m.c2 ? compliancePct(m.c2) : "", m.assessor, m.delay, ...gps.map(g => latest(m)[g.id])]));
    const blob = new Blob([rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "cims-sample-export.csv"; a.click(); return false; }
};
function odsfStep(id, status, what) { const o = S.odsf.find(x => x.id === id), note = ($("#od-note") || {}).value || ""; o.status = status; (o.log = o.log || []).push({ ts: today(), who: who(), what: what + (note ? ": " + note : "") }); closeModal(); toast(t("o_" + status)); }
Object.assign(ACT, {
  odsfSubmit: el => odsfStep(el.dataset.id, "submitted", "Application submitted"),
  odsfRecommend: el => odsfStep(el.dataset.id, "review", "Recommendation recorded (Regional/IDCS)"),
  odsfApprove: el => odsfStep(el.dataset.id, "approved", "Approved by Review Committee; applicant notified"),
  odsfReject: el => odsfStep(el.dataset.id, "rejected", "Rejected by Review Committee; applicant notified"),
  odsfStart: el => odsfStep(el.dataset.id, "implementation", "Implementation period and activities recorded"),
  odsfProgress: el => { const o = S.odsf.find(x => x.id === el.dataset.id); o.log.push({ ts: today(), who: who(), what: "Progress report submitted" + (($("#od-note") || {}).value ? ": " + $("#od-note").value : "") }); closeModal(); toast(t("saved")); },
  odsfFinal: el => odsfStep(el.dataset.id, "completed", "Final report submitted and reviewed")
});
function doSync() {
  const q = S.baobab.filter(b => b.status === "queued"); if (!q.length) { toast(t("synced")); return; }
  if (!navigator.onLine) { toast(t("offline")); return; }
  setTimeout(() => { q.forEach(b => { b.status = "synced"; b.remote = "BAO-" + Math.floor(10000 + Math.random() * 89999); b.ts = today(); }); if (S.my.status === "validated" && q.some(b => b.ref.startsWith(S.my.name))) { S.my.status = "published"; logStep("Baobab (mock)", "Validated report published"); } save(); render(); toast(t("synced")); }, 700);
}

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return; const fn = ACT[el.dataset.act]; if (!fn) return;
  e.preventDefault(); const res = fn(el); save(); if (res !== false) render();
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.gp && el.dataset.field) { const a = S.my.answers[el.dataset.gp] = S.my.answers[el.dataset.gp] || { ev: [], chat: [] };
    a[el.dataset.field] = el.type === "checkbox" ? el.checked : (el.dataset.field === "self" || el.dataset.field === "aScore") ? (el.value === "" ? null : +el.value) : el.value; save(); if (el.tagName === "SELECT" || el.type === "checkbox") render(); return; }
  if (el.dataset.actChange === "attach" && el.value) { const a = S.my.answers[el.dataset.gp] = S.my.answers[el.dataset.gp] || { ev: [], chat: [] }; (a.ev = a.ev || []).push(el.value); save(); render(); return; }
  if (el.dataset.ip) { const x = S.ip.find(i => i.id === el.dataset.ip); x[el.dataset.f] = el.dataset.f === "progress" ? +el.value : el.value; save(); render(); return; }
  if (el.dataset.mand) { const [s, a] = el.dataset.mand.split("|"); S.ort.find(x => x.id === s).articles.find(x => x.id === a).mandatory = el.checked; save(); render(); return; }
  if (el.dataset.bind) { S[el.dataset.bind] = el.value; save(); render(); return; }
  if (el.dataset.upload !== undefined || el.dataset.replace) { const f = el.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { const data = f.size <= 400 * 1024 ? r.result : null;
      if (el.dataset.replace) { const ev = S.evidence.find(x => x.id === el.dataset.replace); ev.versions++; ev.size = f.size; ev.uploaded = today(); ev.data = data; }
      else { const id = uid("EV"); S.evidence.push({ id, name: f.name, size: f.size, type: f.type, uploaded: today(), by: "MO", versions: 1, data, confidential: false });
        if (el.dataset.upload) { const a = S.my.answers[el.dataset.upload] = S.my.answers[el.dataset.upload] || { ev: [], chat: [] }; (a.ev = a.ev || []).push(id); } }
      save(); render(); toast(t("saved") + (data ? "" : " (metadata only)")); };
    r.readAsDataURL(f); }
});
document.addEventListener("input", e => { if (e.target.id === "kc-q") { S.kcQuery = e.target.value; clearTimeout(window._kq); window._kq = setTimeout(() => { save(); render(); const i = $("#kc-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); } });
$("#sel-role").addEventListener("change", e => { S.role = e.target.value; S.view = NAV[S.role][0]; save(); location.hash = S.view; render(); });
$("#sel-lang").addEventListener("change", e => { S.lang = e.target.value; save(); render(); });
$("#btn-reset").addEventListener("click", () => { if (confirm(t("resetConfirm"))) { localStorage.removeItem(KEY); S = initialState(); save(); render(); } });
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
window.addEventListener("hashchange", () => { const v = location.hash.slice(1); if (v && V[v]) { S.view = v; save(); render(); window.scrollTo(0, 0); } });
window.addEventListener("online", () => { netStatus(); doSync(); });
window.addEventListener("offline", netStatus);
const h = location.hash.slice(1); if (h && V[h]) S.view = h;
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
window.__cims = { S: () => S, ACT, render };
})();
