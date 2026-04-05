import { GoogleGenAI } from '@google/genai'
import type { SimilarProjectMatch, TopicCheckInput, TopicRecommendation } from '../types'
import { appEnv, isGeminiConfigured } from './env'

const geminiClient = isGeminiConfigured
  ? new GoogleGenAI({ apiKey: appEnv.geminiApiKey })
  : null

const EMBEDDING_DIMENSION = 96

function parseJsonResponse(rawText: string) {
  const normalized = rawText.trim()

  try {
    return JSON.parse(normalized) as TopicRecommendation
  } catch {
    const fenced = normalized.match(/```json\s*([\s\S]*?)\s*```/i)

    if (fenced && fenced[1]) {
      return JSON.parse(fenced[1]) as TopicRecommendation
    }

    throw new Error('Gemini response is not valid JSON.')
  }
}

function fallbackEmbedding(input: string) {
  const vector = Array.from({ length: EMBEDDING_DIMENSION }, () => 0)

  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index)
    vector[index % EMBEDDING_DIMENSION] += charCode / 255
  }

  const magnitude = Math.sqrt(vector.reduce((acc, value) => acc + value * value, 0)) || 1
  return vector.map((value) => value / magnitude)
}

function emptyRecommendation(): TopicRecommendation {
  return {
    noveltyAssessment: 'Unable to generate a novelty assessment at the moment.',
    overlapExplanation:
      'AI recommendation generation is currently unavailable. Review the similar projects and refine manually.',
    refinementSuggestions: [
      'Narrow your scope to a specific user group or local context.',
      'Add a measurable outcome metric to improve originality.',
    ],
    alternativeTopics: [
      'Design a domain-specific dataset collection framework for your department.',
      'Evaluate explainable AI approaches for student support systems.',
    ],
    researchGaps: [
      'Limited local datasets for reproducible experiments.',
      'Few studies compare long-term deployment outcomes in your institution.',
    ],
  }
}

export async function createEmbedding(text: string) {
  if (!geminiClient) {
    return fallbackEmbedding(text)
  }

  try {
    const response = await geminiClient.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    })

    const values = response.embeddings?.[0]?.values

    if (!values || values.length === 0) {
      return fallbackEmbedding(text)
    }

    return values
  } catch {
    return fallbackEmbedding(text)
  }
}

export async function generateGroundedRecommendation(params: {
  input: TopicCheckInput
  matches: SimilarProjectMatch[]
}): Promise<TopicRecommendation> {
  if (!geminiClient) {
    return emptyRecommendation()
  }

  const context = params.matches
    .map((match, index) => {
      const project = match.project

      return [
        `Match #${index + 1}`,
        `Title: ${project.title}`,
        `Department: ${project.department}`,
        `Year: ${project.year}`,
        `Keywords: ${project.keywords.join(', ')}`,
        `Abstract: ${project.abstract}`,
        `Similarity: ${match.similarityScore.toFixed(3)}`,
      ].join('\n')
    })
    .join('\n\n')

  const prompt = `You are assisting with project originality checks for final-year projects.\nUse ONLY the retrieved project context below. Do not invent project records.\n\nStudent proposal:\nTitle: ${params.input.proposedTitle}\nDescription: ${params.input.proposedDescription}\nKeywords: ${params.input.optionalKeywords.join(', ') || 'none'}\n\nRetrieved similar projects:\n${context || 'No similar projects found.'}\n\nReturn strict JSON only with the shape:\n{\n  \"noveltyAssessment\": string,\n  \"overlapExplanation\": string,\n  \"refinementSuggestions\": string[],\n  \"alternativeTopics\": string[],\n  \"researchGaps\": string[]\n}\n\nEnsure each list has at least 3 concise items when possible.`

  try {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    const text = response.text ?? ''

    if (!text.trim()) {
      return emptyRecommendation()
    }

    const parsed = parseJsonResponse(text)

    return {
      noveltyAssessment: parsed.noveltyAssessment || emptyRecommendation().noveltyAssessment,
      overlapExplanation: parsed.overlapExplanation || emptyRecommendation().overlapExplanation,
      refinementSuggestions: parsed.refinementSuggestions?.slice(0, 6) || emptyRecommendation().refinementSuggestions,
      alternativeTopics: parsed.alternativeTopics?.slice(0, 6) || emptyRecommendation().alternativeTopics,
      researchGaps: parsed.researchGaps?.slice(0, 6) || emptyRecommendation().researchGaps,
    }
  } catch {
    return emptyRecommendation()
  }
}
