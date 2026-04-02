/**
 * aiSimulator.js
 * Simulates AI generation for North Star, Objectives, KRs, and Discovery cards.
 * In production these would call a real LLM endpoint.
 * All functions return Promises so call-sites can use async/await with loading states.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── North Star ───────────────────────────────────────────────────────────────

const NORTH_STARS = {
  tech: [
    'Become the most-adopted platform in our vertical by {year}, powering {n},000 active teams worldwide.',
    'Ship a 10× more reliable product in {year} — achieving 99.9% uptime and a Net Promoter Score above 60.',
    'Reach $10M ARR by end of {year} by turning every customer into a champion.',
  ],
  government: [
    'Deliver citizen services that are 3× faster and 50% cheaper than the legacy baseline by {year}.',
    'Achieve a 90% on-time delivery rate across all government programs by {year}.',
    'Become the model digital-government unit in the region by {year}, cited in at least 5 national reports.',
  ],
  healthcare: [
    'Reduce patient wait times by 40% and clinical errors by 30% through integrated data by {year}.',
    'Enable every clinician in the network to spend 80% of time on patient care — not administration — by {year}.',
    'Achieve Joint Commission Gold Seal and top-quartile patient satisfaction scores by {year}.',
  ],
  finance: [
    'Grow AUM by 35% in {year} while maintaining compliance with all new regulatory frameworks.',
    'Reduce operational risk incidents by 50% and cut time-to-close by 25% by end of {year}.',
    'Become the most trusted financial partner for our segment, with a client retention rate above 95% by {year}.',
  ],
  research: [
    'Publish {n} peer-reviewed papers and secure 2 major grants by {year}.',
    'Build a reproducible research platform used by {n} institutions by end of {year}.',
    'Translate {n} research findings into real-world pilots with measurable impact by {year}.',
  ],
  custom: [
    'Define a bold, measurable 12-month mission that rallies the entire team around a single outcome by {year}.',
    'Become undeniably excellent at one thing our market cares about most — measured and proven by {year}.',
  ],
}

export async function generateNorthStar({ sector, orgName, context } = {}) {
  await delay(900 + Math.random() * 600)
  const pool = NORTH_STARS[sector] || NORTH_STARS.tech
  const year = new Date().getFullYear() + 1
  const n    = pick(['5', '10', '20', '50'])
  let text   = pick(pool).replace('{year}', year).replace('{n}', n)
  if (orgName) text = text.replace('our', `${orgName}'s`)
  return text
}

// ─── Objectives ───────────────────────────────────────────────────────────────

const OBJECTIVE_SETS = {
  tech: [
    { title: 'Accelerate product velocity',       quarter: `Q${Math.ceil(new Date().getMonth()/3)+1}` },
    { title: 'Grow paid user base by 40%',        quarter: `Q${Math.ceil(new Date().getMonth()/3)+1}` },
    { title: 'Achieve enterprise-grade security', quarter: `Q${Math.ceil(new Date().getMonth()/3)+1}` },
    { title: 'Reduce churn below 3% monthly',     quarter: `Q${Math.ceil(new Date().getMonth()/3)+1}` },
    { title: 'Launch mobile experience',          quarter: `Q${Math.ceil(new Date().getMonth()/3)+1}` },
    { title: 'Build a world-class support system',quarter: `Q${Math.ceil(new Date().getMonth()/3)+1}` },
  ],
  government: [
    { title: 'Digitise all citizen-facing services',  quarter: 'Q2' },
    { title: 'Reduce process backlogs by 60%',        quarter: 'Q2' },
    { title: 'Achieve ISO 27001 certification',       quarter: 'Q3' },
    { title: 'Train 500 staff on new digital tools',  quarter: 'Q2' },
    { title: 'Launch inter-agency data-sharing hub',  quarter: 'Q3' },
    { title: 'Improve citizen satisfaction score',    quarter: 'Q4' },
  ],
  healthcare: [
    { title: 'Reduce average patient wait by 40%',    quarter: 'Q2' },
    { title: 'Roll out unified EHR across 3 sites',   quarter: 'Q2' },
    { title: 'Cut admin overhead by 25%',             quarter: 'Q3' },
    { title: 'Achieve top-quartile patient NPS',      quarter: 'Q4' },
    { title: 'Launch preventive-care programme',      quarter: 'Q3' },
    { title: 'Zero critical medication errors',       quarter: 'Q2' },
  ],
  finance: [
    { title: 'Grow AUM by 35%',                       quarter: 'Q2' },
    { title: 'Automate 80% of compliance checks',     quarter: 'Q2' },
    { title: 'Launch 3 new investment products',      quarter: 'Q3' },
    { title: 'Reduce operational risk incidents 50%', quarter: 'Q3' },
    { title: 'Achieve 95% client retention rate',     quarter: 'Q4' },
    { title: 'Cut reporting cycle from 5 to 2 days',  quarter: 'Q2' },
  ],
  research: [
    { title: 'Submit 3 grant applications',           quarter: 'Q2' },
    { title: 'Publish 2 peer-reviewed papers',        quarter: 'Q3' },
    { title: 'Build reproducible data pipeline',      quarter: 'Q2' },
    { title: 'Partner with 2 industry labs',          quarter: 'Q3' },
    { title: 'Train team on new methodologies',       quarter: 'Q2' },
    { title: 'Launch pilot study with 50 participants',quarter: 'Q3' },
  ],
  custom: [
    { title: 'Define and hit our #1 growth goal',     quarter: 'Q2' },
    { title: 'Improve team execution velocity',       quarter: 'Q2' },
    { title: 'Reduce our biggest operational cost',   quarter: 'Q3' },
    { title: 'Deliver a flagship product milestone',  quarter: 'Q2' },
    { title: 'Build repeatable customer success',     quarter: 'Q3' },
    { title: 'Strengthen data & reporting quality',   quarter: 'Q4' },
  ],
}

const KR_TEMPLATES = {
  'Accelerate product velocity':        ['Ship 8 features per sprint cycle', 'Cut release cycle from 3 weeks to 1 week', 'Reduce P1 bug resolution time to under 4h'],
  'Grow paid user base by 40%':         ['Add 2,000 new paid accounts', 'Reduce trial-to-paid time from 14 to 7 days', 'Achieve 40% MoM growth in signups'],
  'Achieve enterprise-grade security':  ['Pass SOC 2 Type II audit', 'Zero critical CVEs in production for 90 days', 'Complete pen-test with < 3 medium findings'],
  'Reduce churn below 3% monthly':      ['Implement proactive health-score alerts', 'Reach 85% feature adoption among at-risk accounts', 'Launch customer success playbooks for top 50 accounts'],
  default:                              ['Measure baseline and set target by Week 2', 'Hit 50% of target by midpoint', 'Achieve 100% of target by quarter end'],
}

export async function generateObjectives({ sector, northStar, count = 4 } = {}) {
  await delay(1200 + Math.random() * 800)
  const pool = (OBJECTIVE_SETS[sector] || OBJECTIVE_SETS.custom).slice()
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length)).map(o => ({
    id:       uid(),
    title:    o.title,
    quarter:  o.quarter,
    status:   'on_track',
    keyResults: [],
  }))
}

export async function generateKRsForObjective(objectiveTitle) {
  await delay(600 + Math.random() * 400)
  const krs = KR_TEMPLATES[objectiveTitle] || KR_TEMPLATES.default
  return krs.map(title => ({
    id:       uid(),
    title,
    progress: 0,
    target:   100,
    unit:     '%',
    status:   'on_track',
  }))
}

// ─── KR Ghost Input (single suggestion from partial text) ─────────────────────

const KR_SUGGESTIONS = [
  'Reach {N}% completion rate by end of quarter',
  'Reduce time-to-{action} from {X} to {Y} {unit}',
  'Achieve {N}% {metric} improvement vs. baseline',
  'Ship {N} new {thing} within the quarter',
  'Onboard {N} new customers to {feature}',
  'Cut {cost} by {N}% through {initiative}',
  'Score {N}/10 or higher on {survey} results',
]

export async function ghostKR(partialText) {
  await delay(300)
  if (!partialText || partialText.length < 5) return ''
  const suggestion = pick(KR_SUGGESTIONS)
  return suggestion
    .replace('{N}', pick(['25', '50', '80', '90', '3', '10']))
    .replace('{action}', pick(['close', 'deploy', 'onboard', 'resolve']))
    .replace('{X}', pick(['10', '5', '30']))
    .replace('{Y}', pick(['2', '1', '7']))
    .replace('{unit}', pick(['days', 'hours', 'minutes']))
    .replace('{metric}', pick(['efficiency', 'satisfaction', 'velocity', 'quality']))
    .replace('{thing}', pick(['features', 'integrations', 'reports', 'templates']))
    .replace('{feature}', pick(['the dashboard', 'automations', 'AI Pilot', 'analytics']))
    .replace('{cost}', pick(['overhead', 'CAC', 'support tickets', 'manual work']))
    .replace('{initiative}', pick(['automation', 'process improvement', 'self-serve tools']))
    .replace('{survey}', pick(['NPS', 'CSAT', 'team health']))
}

// ─── Discovery Mode suggestions ───────────────────────────────────────────────

const DISCOVERY_TEMPLATES = [
  { type: 'opportunity', title: 'Automate weekly status reports', impact: 'high',   effort: 'low',    desc: 'AI drafts updates from ticket progress — saves 2h per manager per week.' },
  { type: 'risk',        title: 'Q2 OKR falling behind pace',    impact: 'high',   effort: 'medium', desc: 'Current velocity suggests you\'ll hit 60% of target. Consider re-scoping or adding capacity.' },
  { type: 'insight',     title: 'Top contributor this sprint',    impact: 'medium', effort: 'low',    desc: 'Ali Nasser closed 14 tickets — highest velocity on the team.' },
  { type: 'opportunity', title: 'Reduce meeting overhead',        impact: 'medium', effort: 'low',    desc: 'Calendar analysis shows 35% of meetings have no agenda or outcome. Templates can fix this.' },
  { type: 'risk',        title: '3 initiatives without owners',   impact: 'high',   effort: 'low',    desc: 'Unowned initiatives have a 3× higher miss rate. Assign owners to unblock progress.' },
  { type: 'insight',     title: 'KR velocity spike this week',    impact: 'medium', effort: 'low',    desc: 'Key result progress jumped 18% — correlates with the new standup format introduced Monday.' },
  { type: 'opportunity', title: 'Cross-team dependency map',      impact: 'high',   effort: 'medium', desc: '4 initiatives share dependencies across teams. A shared roadmap view would surface blockers earlier.' },
  { type: 'risk',        title: 'Capacity risk next sprint',      impact: 'high',   effort: 'low',    desc: '3 team members are at 110% allocation. Defer or redistribute 2 tasks to protect output quality.' },
]

export async function generateDiscoveryCards(state) {
  await delay(800)
  // Shuffle and return 4–6 cards
  const shuffled = [...DISCOVERY_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4 + Math.floor(Math.random() * 3)).map(d => ({
    ...d,
    id: uid(),
  }))
}

// ─── CEO Intelligence health score ────────────────────────────────────────────

export function computeOKRHealth(okrs = []) {
  if (!okrs.length) return { score: 0, status: 'no_data', alerts: [] }

  const alerts = []
  let totalKRs = 0, atRisk = 0, behindCount = 0, noOwner = 0

  okrs.forEach(okr => {
    ;(okr.keyResults || []).forEach(kr => {
      totalKRs++
      const pct = kr.progress ?? 0
      if (pct < 30)  { atRisk++;     alerts.push({ level: 'error',   msg: `KR "${kr.title}" is at ${pct}% — critically behind` }) }
      else if (pct < 60) { behindCount++; alerts.push({ level: 'warning', msg: `KR "${kr.title}" is at ${pct}% — below pace` }) }
    })
    ;(okr.initiatives || []).forEach(ini => {
      if (!ini.owner) { noOwner++; }
    })
  })

  if (noOwner > 0) alerts.push({ level: 'warning', msg: `${noOwner} initiative${noOwner > 1 ? 's' : ''} have no owner assigned` })

  const healthPct = totalKRs
    ? Math.round(((totalKRs - atRisk - behindCount * 0.5) / totalKRs) * 100)
    : 100

  const score  = Math.max(0, Math.min(100, healthPct))
  const status = score >= 80 ? 'healthy' : score >= 50 ? 'at_risk' : 'critical'

  return { score, status, alerts: alerts.slice(0, 5) }
}
