/**
 * useTerm — returns workspace-specific terminology labels.
 *
 * Usage:
 *   const t = useTerm()
 *   t('okr')        → "OKR" / "Goal" / "Objective" depending on workspace.sector
 *   t('kr')         → "KR" / "KPI" / "Metric"
 *   t('initiative') → "Initiative" / "Program" / "Project"
 *   t('issue')      → "Issue" / "Task" / "Activity"
 */

import { useApp } from '../state/AppContext.jsx'

// Default term set (tech)
export const DEFAULT_TERMS = {
  okr:           'OKR',
  okrs:          'OKRs',
  kr:            'KR',
  krs:           'KRs',
  initiative:    'Initiative',
  initiatives:   'Initiatives',
  issue:         'Issue',
  issues:        'Issues',
  northstar:     'North Star',
  roadmap:       'Roadmap',
  sprint:        'Sprint',
  sprints:       'Sprints',
  dashboard:     'Dashboard',
  workspace:     'Workspace',
  member:        'Member',
  members:       'Members',
}

export const SECTOR_TERMS = {
  tech: {
    ...DEFAULT_TERMS,
  },
  government: {
    ...DEFAULT_TERMS,
    okr:         'Goal',
    okrs:        'Goals',
    kr:          'KPI',
    krs:         'KPIs',
    initiative:  'Program',
    initiatives: 'Programs',
    issue:       'Task',
    issues:      'Tasks',
    northstar:   'Strategic Vision',
    sprint:      'Work Cycle',
    sprints:     'Work Cycles',
  },
  healthcare: {
    ...DEFAULT_TERMS,
    okr:         'Objective',
    okrs:        'Objectives',
    kr:          'Metric',
    krs:         'Metrics',
    initiative:  'Project',
    initiatives: 'Projects',
    issue:       'Activity',
    issues:      'Activities',
    northstar:   'Clinical Mission',
    sprint:      'Care Cycle',
    sprints:     'Care Cycles',
  },
  finance: {
    ...DEFAULT_TERMS,
    okr:         'Strategic Goal',
    okrs:        'Strategic Goals',
    kr:          'Indicator',
    krs:         'Indicators',
    initiative:  'Project',
    initiatives: 'Projects',
    issue:       'Action',
    issues:      'Actions',
    northstar:   'Strategic Direction',
  },
  research: {
    ...DEFAULT_TERMS,
    okr:         'Aim',
    okrs:        'Aims',
    kr:          'Milestone',
    krs:         'Milestones',
    initiative:  'Study',
    initiatives: 'Studies',
    issue:       'Task',
    issues:      'Tasks',
    northstar:   'Research Vision',
    sprint:      'Research Cycle',
    sprints:     'Research Cycles',
  },
}

export function getTermSet(workspace) {
  if (!workspace) return DEFAULT_TERMS
  // Custom overrides take priority
  const customTerms = workspace.customTerms || {}
  const sectorTerms = SECTOR_TERMS[workspace.sector] || DEFAULT_TERMS
  return { ...DEFAULT_TERMS, ...sectorTerms, ...customTerms }
}

export default function useTerm() {
  const { state } = useApp()
  const { workspaces = [], currentWorkspaceId } = state
  const ws      = workspaces.find(w => w.id === currentWorkspaceId)
  const terms   = getTermSet(ws)

  return (key) => terms[key] ?? key
}
