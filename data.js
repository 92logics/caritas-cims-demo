/* Fictional sample data — demo by 92 Logics. Placeholder ORT content, NOT the approved CIMS text. */
(function () {
const L = (en, fr, es) => ({ en, fr, es });
const G = (p, r, c) => ({ purpose: p, required: r, context: c });

const ORT = [
 { id: "S1", name: L("Standard 1 · Governance & Ethics", "Norme 1 · Gouvernance et éthique", "Norma 1 · Gobernanza y ética"), articles: [
   { id: "A1.1", name: L("Legal identity and statutes", "Identité juridique et statuts", "Identidad jurídica y estatutos"), mandatory: true, gps: [
     { id: "GP1.1.1", text: L("Statutes are approved, registered and available to the Board.", "Les statuts sont approuvés, enregistrés et accessibles au Conseil.", "Los estatutos están aprobados, registrados y disponibles para la Junta."), g: G("Confirms legal existence and mandate.", "Registered statutes; registration certificate; date of last revision.", "Where registration is not possible, record the local legal constraint.") },
     { id: "GP1.1.2", text: L("The Board reviews statutory compliance at least annually.", "Le Conseil examine la conformité statutaire au moins une fois par an.", "La Junta revisa el cumplimiento estatutario al menos una vez al año."), g: G("Ensures the organisation acts within its mandate.", "Minutes showing annual review.", "Small MOs may combine with the general assembly.") } ] },
   { id: "A1.2", name: L("Board oversight and integrity", "Supervision et intégrité du Conseil", "Supervisión e integridad de la Junta"), mandatory: true, gps: [
     { id: "GP1.2.1", text: L("The Board meets regularly and keeps signed minutes.", "Le Conseil se réunit régulièrement et tient des procès-verbaux signés.", "La Junta se reúne periódicamente y mantiene actas firmadas."), g: G("Evidence of functioning oversight.", "Calendar of meetings; signed minutes.", "Frequency may vary with context.") },
     { id: "GP1.2.2", text: L("A conflict-of-interest policy is signed by all Board members.", "Une politique de conflit d'intérêts est signée par tous les membres du Conseil.", "Todos los miembros de la Junta firman una política de conflicto de intereses."), g: G("Protects integrity of decisions.", "Policy; signed declarations.", "—") } ] } ] },
 { id: "S2", name: L("Standard 2 · Organisation & Management", "Norme 2 · Organisation et gestion", "Norma 2 · Organización y gestión"), articles: [
   { id: "A2.1", name: L("Strategy and planning", "Stratégie et planification", "Estrategia y planificación"), mandatory: false, gps: [
     { id: "GP2.1.1", text: L("A current strategic plan is approved and monitored.", "Un plan stratégique en vigueur est approuvé et suivi.", "Existe un plan estratégico vigente, aprobado y monitoreado."), g: G("Direction and priorities are explicit.", "Approved plan; monitoring report.", "Plan length can reflect context.") } ] },
   { id: "A2.2", name: L("People management", "Gestion des personnes", "Gestión de personas"), mandatory: true, gps: [
     { id: "GP2.2.1", text: L("HR policies and a code of conduct are signed by all staff.", "Des politiques RH et un code de conduite sont signés par tout le personnel.", "Todo el personal firma las políticas de RR. HH. y el código de conducta."), g: G("Fair and safe employment.", "HR manual; signed code of conduct.", "Volunteers covered where applicable.") },
     { id: "GP2.2.2", text: L("Staff receive an annual performance review.", "Le personnel bénéficie d'une évaluation annuelle.", "El personal recibe una evaluación anual de desempeño."), g: G("Development and accountability of staff.", "Appraisal records (sample).", "—") } ] } ] },
 { id: "S3", name: L("Standard 3 · Finance & Accountability", "Norme 3 · Finances et redevabilité", "Norma 3 · Finanzas y rendición de cuentas"), articles: [
   { id: "A3.1", name: L("Financial control", "Contrôle financier", "Control financiero"), mandatory: true, gps: [
     { id: "GP3.1.1", text: L("Annual accounts are externally audited.", "Les comptes annuels font l'objet d'un audit externe.", "Las cuentas anuales se auditan externamente."), g: G("Assurance over financial statements.", "Audit report and management letter.", "Where audit is unaffordable, consider ODSF support.") },
     { id: "GP3.1.2", text: L("A procurement policy with thresholds is applied.", "Une politique d'achats avec seuils est appliquée.", "Se aplica una política de compras con umbrales."), g: G("Value for money and transparency.", "Policy; sample procurement files.", "—") } ] },
   { id: "A3.2", name: L("Reporting to stakeholders", "Rapports aux parties prenantes", "Informes a las partes interesadas"), mandatory: false, gps: [
     { id: "GP3.2.1", text: L("Donor and network reports are submitted on time.", "Les rapports aux bailleurs et au réseau sont remis à temps.", "Los informes a donantes y a la red se entregan a tiempo."), g: G("Accountability to partners.", "Reporting calendar; submission log.", "—") } ] } ] },
 { id: "S4", name: L("Standard 4 · Stakeholder Engagement", "Norme 4 · Engagement des parties prenantes", "Norma 4 · Participación de las partes interesadas"), articles: [
   { id: "A4.1", name: L("Participation and feedback", "Participation et retour d'information", "Participación y retroalimentación"), mandatory: true, gps: [
     { id: "GP4.1.1", text: L("A feedback and complaints mechanism is accessible to communities.", "Un mécanisme de retour et de plaintes est accessible aux communautés.", "Existe un mecanismo de quejas y retroalimentación accesible a las comunidades."), g: G("Accountability to affected people.", "Mechanism description; complaint log (anonymised).", "Channels adapted to literacy and connectivity.") } ] },
   { id: "A4.2", name: L("Partnerships", "Partenariats", "Alianzas"), mandatory: false, gps: [
     { id: "GP4.2.1", text: L("Partnership agreements define roles and responsibilities.", "Les accords de partenariat définissent les rôles et responsabilités.", "Los acuerdos de alianza definen roles y responsabilidades."), g: G("Clear partnership terms.", "Signed agreements.", "—") } ] } ] },
 { id: "SG", crossCutting: true, name: L("Safeguarding (cross-cutting)", "Protection / safeguarding (transversal)", "Salvaguarda (transversal)"), articles: [
   { id: "A5.1", name: L("Safeguarding policy and practice", "Politique et pratique de protection", "Política y práctica de salvaguarda"), mandatory: true, gps: [
     { id: "GP5.1.1", text: L("A safeguarding policy is approved and disseminated.", "Une politique de protection est approuvée et diffusée.", "Una política de salvaguarda está aprobada y difundida."), g: G("Prevent harm to children and vulnerable adults.", "Policy; dissemination records.", "Translate into local languages.") },
     { id: "GP5.1.2", text: L("A safeguarding focal point and confidential reporting channel exist.", "Un point focal et un canal de signalement confidentiel existent.", "Existen un punto focal de salvaguarda y un canal confidencial de denuncia."), g: G("Concerns can be raised safely.", "Focal point ToR; reporting channel.", "—") } ] } ] }
];

const OD_AREAS = ["Governance", "Leadership & Management", "Finance", "Human Resources", "Programme Quality", "Accountability", "Safeguarding", "Resource Mobilisation"];
const REGIONS = ["Africa", "Asia", "Europe", "Latin America & Caribbean", "Middle East & North Africa", "North America", "Oceania"];
const ASSESSORS = ["Assessor A (sample)", "Assessor B (sample)", "Assessor C (sample)", "Assessor D (sample)", "Assessor E (sample)"];
const DELAYS = ["Evidence not ready", "Assessor availability", "Translation", "Connectivity", "Board approval pending"];

function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const allGPs = () => ORT.flatMap(s => s.articles.flatMap(a => a.gps.map(g => ({ ...g, std: s.id, art: a.id, mandatory: a.mandatory }))));

function genNetwork() {
  const r = rng(92016), gps = allGPs(), mos = [];
  const phases = ["self", "external", "post", "post", "post", "none"];
  for (let i = 1; i <= 42; i++) {
    const region = REGIONS[i % REGIONS.length];
    const base = 1 + r() * 1.6; const c1 = {}, c2 = {};
    gps.forEach(g => { const m = g.mandatory ? -0.2 : 0; c1[g.id] = Math.max(0, Math.min(3, Math.round(base + m + (r() - 0.5) * 1.8)));
      c2[g.id] = Math.max(0, Math.min(3, Math.round(c1[g.id] + r() * 1.3 - 0.2))); });
    const phase = phases[Math.floor(r() * phases.length)];
    mos.push({ id: "MO-" + String(i).padStart(2, "0"), name: "Sample MO " + String(i).padStart(2, "0"), region, phase,
      cycle: phase === "none" ? 1 : (r() > 0.4 ? 2 : 1), c1, c2: phase === "post" ? c2 : null,
      assessor: ASSESSORS[Math.floor(r() * ASSESSORS.length)], delay: Math.round(r() * 60), delayReason: DELAYS[Math.floor(r() * DELAYS.length)],
      risks: [OD_AREAS[Math.floor(r() * 8)], OD_AREAS[Math.floor(r() * 8)]] });
  }
  return mos;
}

function genODSF() {
  const r = rng(2019), out = [], st = ["submitted", "review", "approved", "implementation", "completed", "completed", "rejected"];
  for (let i = 1; i <= 26; i++) {
    const fund = i <= 7 ? "initiating" : "improvement";
    out.push({ id: "ODSF-" + (2019 + (i % 7)) + "-" + String(i).padStart(3, "0"), mo: "MO-" + String(1 + Math.floor(r() * 42)).padStart(2, "0"),
      fund, title: fund === "initiating" ? "Accompaniment for self-assessment (sample)" : "Improvement Plan support: " + OD_AREAS[Math.floor(r() * 8)] + " (sample)",
      amount: fund === "initiating" ? 1500 + Math.round(r() * 35) * 100 : 6000 + Math.round(r() * 140) * 100, months: 6 + Math.floor(r() * 18),
      status: st[Math.floor(r() * st.length)], ipActions: [], sample: true, log: [] });
  }
  return out;
}

const DOCS = [
 { id: "D1", title: L("CIMS Standards (revised, placeholder)", "Normes CIMS (révisées, indicatif)", "Normas CIMS (revisadas, ilustrativo)"), type: "Standard", audience: ["all"], langs: "EN FR ES", version: 2, updated: "2026-10-01" },
 { id: "D2", title: L("Scoring Guidelines (placeholder)", "Lignes directrices de notation (indicatif)", "Guías de puntuación (ilustrativo)"), type: "Guidance", audience: ["mo", "assessor", "revcom"], langs: "EN FR ES", version: 3, updated: "2026-10-20" },
 { id: "D3", title: L("Assessor handbook (placeholder)", "Manuel de l'évaluateur (indicatif)", "Manual del evaluador (ilustrativo)"), type: "Guidance", audience: ["assessor", "gs"], langs: "EN FR", version: 1, updated: "2026-09-12" },
 { id: "D4", title: L("RACI matrix (placeholder)", "Matrice RACI (indicatif)", "Matriz RACI (ilustrativo)"), type: "Tool", audience: ["all"], langs: "EN FR ES", version: 1, updated: "2026-06-30" },
 { id: "D5", title: L("ODSF Reference Guide (placeholder)", "Guide de référence ODSF (indicatif)", "Guía de referencia ODSF (ilustrativo)"), type: "ODSF", audience: ["mo", "regional", "revcom", "gs"], langs: "EN FR ES", version: 2, updated: "2026-10-15" },
 { id: "D6", title: L("FAQ — completing the self-assessment", "FAQ — compléter l'auto-évaluation", "Preguntas frecuentes — autoevaluación"), type: "FAQ", audience: ["mo"], langs: "EN FR ES", version: 1, updated: "2026-08-03" },
 { id: "D7", title: L("Good practice example: complaints mechanism (sample)", "Exemple de bonne pratique : mécanisme de plaintes (exemple)", "Ejemplo de buena práctica: mecanismo de quejas (muestra)"), type: "Good practice", audience: ["all"], langs: "EN", version: 1, updated: "2026-07-21" },
 { id: "D8", title: L("Review Commission validation procedure (placeholder)", "Procédure de validation RevCom (indicatif)", "Procedimiento de validación RevCom (ilustrativo)"), type: "Procedure", audience: ["revcom", "gs"], langs: "EN FR ES", version: 1, updated: "2026-05-30" },
 { id: "D9", title: L("Training video: digital ORT walkthrough (sample)", "Vidéo de formation : ORT numérique (exemple)", "Video de formación: ORT digital (muestra)"), type: "Training", audience: ["all"], langs: "EN FR ES", version: 1, updated: "2026-10-22" }
];

window.CIMS_DATA = { ORT, OD_AREAS, REGIONS, ASSESSORS, DOCS, allGPs, genNetwork, genODSF };
})();
