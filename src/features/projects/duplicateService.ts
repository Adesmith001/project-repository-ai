import type {
  ProjectDuplicateGroup,
  ProjectDuplicateSuggestion,
  ProjectRecord,
} from '../../types'
import { scoreProjectSimilarity } from './vectorSearchService'
import { normalizeSupervisorName } from './projectService'

function normalizeProjectTitle(title: string) {
  return normalizeSupervisorName(title)
}

export function findProjectDuplicates(
  projects: ProjectRecord[],
  nearDuplicateThreshold = 0.9,
): {
  exactTitleGroups: ProjectDuplicateGroup[]
  nearDuplicatePairs: ProjectDuplicateSuggestion[]
} {
  const titleGroups = new Map<string, ProjectRecord[]>()

  for (const project of projects) {
    const normalizedTitle = normalizeProjectTitle(project.title)

    if (!normalizedTitle) {
      continue
    }

    const currentGroup = titleGroups.get(normalizedTitle) || []
    currentGroup.push(project)
    titleGroups.set(normalizedTitle, currentGroup)
  }

  const exactTitleGroups = Array.from(titleGroups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([normalizedTitle, group]) => ({
      normalizedTitle,
      projects: group,
    }))

  const nearDuplicatePairs: ProjectDuplicateSuggestion[] = []

  for (let leftIndex = 0; leftIndex < projects.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < projects.length; rightIndex += 1) {
      const left = projects[leftIndex]
      const right = projects[rightIndex]
      const similarityScore = scoreProjectSimilarity(left, {
        title: right.title,
        abstract: right.abstract,
        keywords: right.keywords,
        embedding: right.embedding,
      })

      if (similarityScore >= nearDuplicateThreshold) {
        nearDuplicatePairs.push({
          left,
          right,
          similarityScore,
        })
      }
    }
  }

  return {
    exactTitleGroups,
    nearDuplicatePairs,
  }
}
