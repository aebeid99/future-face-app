// ─── Saudi Vision 2030 Alignment Mapping ─────────────────────

export const VISION_PILLARS = [
  { id: 'vibrant_society',     label: 'Vibrant Society',     labelAr: 'مجتمع حيوي',    color: '#10B981' },
  { id: 'thriving_economy',    label: 'Thriving Economy',    labelAr: 'اقتصاد مزدهر',  color: '#D4920E' },
  { id: 'ambitious_nation',    label: 'Ambitious Nation',    labelAr: 'وطن طموح',       color: '#3B82F6' },
]

export const VISION_PROGRAMS = [
  { id: 'neom',          label: 'NEOM',                  pillar: 'thriving_economy' },
  { id: 'vision_realization', label: 'Vision Realization Program', pillar: 'ambitious_nation' },
  { id: 'housing',       label: 'Housing Program',       pillar: 'vibrant_society' },
  { id: 'health',        label: 'Quality of Life Program', pillar: 'vibrant_society' },
  { id: 'privatization', label: 'Privatization Program', pillar: 'thriving_economy' },
  { id: 'financial_sector', label: 'Financial Sector Development', pillar: 'thriving_economy' },
  { id: 'national_transformation', label: 'National Transformation Program', pillar: 'ambitious_nation' },
  { id: 'human_capital', label: 'Human Capital Development', pillar: 'vibrant_society' },
  { id: 'entertainment', label: 'Entertainment Authority', pillar: 'vibrant_society' },
  { id: 'local_content', label: 'Local Content & Gov Procurement', pillar: 'thriving_economy' },
]

export function getPillarById(id) {
  return VISION_PILLARS.find(p => p.id === id) || null
}

export function getProgramsByPillar(pillarId) {
  return VISION_PROGRAMS.filter(p => p.pillar === pillarId)
}

export function getAlignmentScore(okrs) {
  if (!okrs?.length) return 0
  const aligned = okrs.filter(o => o.vision2030).length
  return Math.round((aligned / okrs.length) * 100)
}
