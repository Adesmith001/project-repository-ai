import { createEmbedding, generateGroundedRecommendation, generateTopicFollowUpResponse } from '../../lib/gemini'
import type { TopicCheckInput, TopicCheckResult } from '../../types'
import { buildSemanticQuery } from '../../utils/parsers'
import { riskFromSimilarity } from '../../utils/risk'
import { findSimilarProjects } from '../projects/vectorSearchService'

export async function runTopicCheck(input: TopicCheckInput): Promise<TopicCheckResult> {
  const queryText = buildSemanticQuery({
    title: input.proposedTitle,
    description: input.proposedDescription,
    keywords: input.optionalKeywords,
  })

  const queryEmbedding = await createEmbedding(queryText)
  const matches = await findSimilarProjects(queryEmbedding, 5)

  const highestSimilarity = matches[0]?.similarityScore ?? 0
  const risk = riskFromSimilarity(highestSimilarity)

  const recommendation = await generateGroundedRecommendation({
    input,
    matches,
  })

  return {
    matches,
    risk,
    recommendation,
  }
}

export async function askTopicFollowUp(
  input: TopicCheckInput,
  result: TopicCheckResult,
  question: string,
) {
  return generateTopicFollowUpResponse({
    question,
    input,
    result,
  })
}
