# CIMS & ODSF platform — working prototype (demo by 92 Logics)

**Live:** https://92logics.github.io/caritas-cims-demo/

A clickable prototype of a management-standards assessment platform with an integrated small-grants (ODSF) workflow, built by 92 Logics to illustrate our proposed approach.

> **Not an official Caritas Internationalis system. No affiliation is implied.** All organisations, scores, documents and grant records are fictional sample data. The Standards, Articles, Good Practice statements and Scoring Guidelines shown are placeholder text written by 92 Logics, not the approved CIMS content.

## What you can try
| Area | In the demo |
|---|---|
| Roles | Switch between Member Organisation, External Assessor, Regional Secretariat, Review Commission and General Secretariat (admin); navigation, data scope and permitted actions change |
| Digital ORT | Standards → Articles → GP statements, mandatory flags, Safeguarding as cross-cutting/standalone tab, Scoring Guidelines (Purpose / Required elements / Context) beside each GP, scores, comments, risk, priority, expected results |
| Evidence | Upload once, link to many GP statements, version history, confidentiality flag; assessor access closes when the assessment completes |
| Three phases | Self-assessment submit → assessor mandate + engagement letter → assessor scoring (MO self-scores hidden) with clarification chat → report → final Improvement Plan → RevCom validation → auto-generated certificate → Baobab publication |
| Improvement Plan | Actions linked to GP statements and OD areas, owners, deadlines, status, progress, notes; 2-year and 4-year reports; regional follow-up and escalation |
| ODSF | Initiating Fund (≤ EUR 5,000) and Improvement Fund (≤ EUR 20,000), ≤ 24 months; application pre-filled from CIMS Improvement Plan actions; recommendation → decision → implementation → progress/final reports |
| Dashboards | Confederation / regional / MO views: phase counts, compliance by Standard across cycles, trend line, mandatory-article non-compliance, persistent issues, common risks, assessor workload and delays, ODSF portfolio; CSV export |
| Alerts | Due-soon, overdue and escalation rules; workflow hand-offs; document updates |
| Knowledge Centre | Role-filtered library, search and filter, versioned replace with update alerts, translation preview |
| Multilingual | English / Français / Español UI switch |
| Offline | Service worker + localStorage: the app loads and keeps working without a connection; Baobab items queue and sync on reconnect |
| Configurability | Admin can add GP statements and change mandatory flags without code changes |

## Tech
Static HTML/CSS/vanilla JS, no build step, no server, no tracking. The proposed production stack is ASP.NET Core + Blazor/React + SQL Server (see the technical proposal).

Demo by 92 Logics · cowork@92logics.com
