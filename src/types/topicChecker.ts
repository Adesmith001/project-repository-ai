import type { ProjectRecord } from './project'

export type DuplicationRisk = 'low' | 'medium' | 'high'

export interface TopicCheckInput {
  proposedTitle: string
  proposedDescription: string
  optionalKeywords: string[]
}

export interface SimilarProjectMatch {
  project: ProjectRecord
  similarityScore: number
}

export interface TopicRecommendation {
  noveltyAssessment: string
  overlapExplanation: string
  refinementSuggestions: string[]
  alternativeTopics: string[]
  researchGaps: string[]
}

export interface TopicCheckResult {
  matches: SimilarProjectMatch[]
  risk: DuplicationRisk
  recommendation: TopicRecommendation
}
