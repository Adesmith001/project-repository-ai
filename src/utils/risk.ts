import type { DuplicationRisk } from '../types'

export function riskFromSimilarity(maxSimilarity: number): DuplicationRisk {
  if (maxSimilarity >= 0.82) {
    return 'high'
  }

  if (maxSimilarity >= 0.62) {
    return 'medium'
  }

  return 'low'
}
