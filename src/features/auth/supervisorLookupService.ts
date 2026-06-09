import type { UserProfile } from '../../types'

export interface SupervisorSuggestion {
  uid: string
  name: string
}

export interface SupervisorRoutingDecision {
  supervisor: string
  supervisorUid: string
  status: 'pending_supervisor' | 'pending_admin'
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function buildSupervisorSuggestions(supervisors: UserProfile[]) {
  const suggestions = new Map<string, SupervisorSuggestion>()

  for (const supervisor of supervisors) {
    const normalized = normalizeName(supervisor.fullName)

    if (!normalized || suggestions.has(normalized)) {
      continue
    }

    suggestions.set(normalized, {
      uid: supervisor.uid,
      name: supervisor.fullName.trim().replace(/\s+/g, ' '),
    })
  }

  return Array.from(suggestions.values()).sort((first, second) => first.name.localeCompare(second.name))
}

export function resolveSupervisorRouting(
  input: string,
  suggestions: SupervisorSuggestion[],
): SupervisorRoutingDecision {
  const normalizedInput = normalizeName(input)
  const matchedSupervisor = suggestions.find((suggestion) => normalizeName(suggestion.name) === normalizedInput)
  const supervisor = input.trim().replace(/\s+/g, ' ')

  if (matchedSupervisor) {
    return {
      supervisor: matchedSupervisor.name,
      supervisorUid: matchedSupervisor.uid,
      status: 'pending_supervisor',
    }
  }

  return {
    supervisor,
    supervisorUid: '',
    status: 'pending_admin',
  }
}
