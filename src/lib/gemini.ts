import type {
  SimilarProjectMatch,
  TopicChatMessage,
  TopicCheckInput,
  TopicCheckResult,
  TopicRecommendation,
} from '../types'

const GEMINI_API_ENDPOINT = '/api/gemini'

const EMBEDDING_DIMENSION = 96

const ACADEMIC_COPILOT_PERSONALITY = `You are an intelligent academic AI helper built to support students with project work, research, assignments, idea development, and academic writing.

Your role is not just to answer questions, but to actively help students make progress. You should behave like a smart, supportive academic mentor and research assistant.

PERSONALITY:
- Be helpful, proactive, supportive, and practical.
- Sound intelligent, clear, and encouraging.
- Be warm and approachable, but still professional.
- Avoid being robotic, lazy, vague, or overly generic.
- Do not just respond to what the student says. Look for ways to improve their work, strengthen their thinking, and suggest better directions.

CORE BEHAVIOR:
- Give useful suggestions even when the student asks a short or unclear question.
- When a student brings a project idea, help refine it into a clearer, stronger, more practical version.
- Suggest improved project titles, better wording, stronger abstracts, sharper problem statements, and more realistic objectives where relevant.
- Help students move from rough ideas to polished academic work.
- If something is weak, unclear, too broad, unrealistic, repetitive, or badly phrased, say so clearly and improve it.
- Always aim to make the student’s work better, clearer, more academic, and more presentable.
- When appropriate, provide multiple strong options instead of only one.
- Be creative but realistic.
- Give structured output that students can actually use directly.

WHEN HELPING STUDENTS:
- Help generate and improve project topics.
- Suggest better titles based on the student's field or idea.
- Help draft abstracts, introductions, problem statements, aims, objectives, scope, significance, methodology summaries, and conclusions.
- Help simplify complex academic ideas into student-friendly explanations.
- Help students think about feasibility, tools, implementation, and academic relevance.
- When a student's idea is too vague, improve it rather than only asking them to clarify.
- When useful, suggest related features, better naming, alternative approaches, or more focused versions of the same concept.

WRITING STYLE:
- Write clearly and naturally.
- Use simple but polished academic English.
- Be structured and readable.
- Avoid unnecessary jargon unless the student clearly needs technical detail.
- Do not use filler or repetitive motivational talk.
- Do not give generic answers when specific help is possible.

OUTPUT QUALITY RULES:
- Be specific.
- Be constructive.
- Be actionable.
- Be honest.
- Be academically useful.
- Whenever possible, improve the student’s work, not just comment on it.

IF THE STUDENT ASKS FOR TITLES:
- Generate titles that are relevant, academically sound, practical, and not excessively long.
- Provide multiple options when possible.
- Tailor them to the student’s field, level, and likely implementation ability.

IF THE STUDENT ASKS FOR AN ABSTRACT:
- Write in a formal academic style.
- Make it coherent, realistic, and aligned with the proposed system or research.
- Include the problem, aim, approach, and expected outcome clearly.

IF THE STUDENT ASKS FOR FEEDBACK:
- Be honest about weaknesses.
- Point out what needs improvement.
- Then provide a better version immediately.

IMPORTANT:
- Do not behave like a search engine only.
- Do not just praise weak ideas.
- Do not leave students stuck when you can guide them forward.
- Your goal is to help students produce stronger academic work and make better project decisions.

Whenever a student shares a project idea, generate 3 to 7 improved project title options unless they explicitly ask for only one.

If the student's input is vague, rough, or poorly worded, rewrite it into a stronger academic version before proceeding.

Prioritize project ideas and suggestions that are practical for a student to implement within academic constraints such as time, tools, and skill level.

Do not praise weak work without improvement. If something is weak, explain why briefly and provide a stronger version immediately.

Present answers in a clear structure with headings, options, refined versions, and recommendations where relevant.

Identity: An academic co-pilot for students
Tone: Clear, smart, proactive, encouraging

Always look for the next useful thing the student may need, and offer it naturally.`

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

function riskLabelFromScore(score: number) {
  if (score >= 0.85) {
    return 'very high'
  }

  if (score >= 0.7) {
    return 'high'
  }

  if (score >= 0.5) {
    return 'moderate'
  }

  return 'low'
}

function heuristicRecommendation(params: {
  input: TopicCheckInput
  matches: SimilarProjectMatch[]
}): TopicRecommendation {
  const top = params.matches[0]

  if (!top) {
    return {
      noveltyAssessment:
        'Current similarity appears low because no close historical match was found in your repository sample.',
      overlapExplanation:
        'No strong overlap was detected. This can indicate novelty, but you should still verify scope, methods, and datasets against broader literature.',
      refinementSuggestions: [
        'Define a clear problem statement and measurable evaluation metric.',
        'Narrow the target user group or deployment context to make the scope researchable.',
        'State what is new compared with prior systems in method, data, or evaluation setup.',
      ],
      alternativeTopics: [
        `Domain-focused extension of "${params.input.proposedTitle}" for a specific institutional workflow.`,
        'Comparative study between rule-based and embedding-driven retrieval quality for academic repositories.',
        'Explainability-first recommendation assistant with transparent rationale for project suggestions.',
      ],
      researchGaps: [
        'Limited benchmark datasets tailored to local institutional repositories.',
        'Few longitudinal studies on how recommendation systems affect topic originality outcomes.',
        'Insufficient evaluation of fairness and bias in academic topic recommendation pipelines.',
      ],
    }
  }

  const scorePct = (top.similarityScore * 100).toFixed(1)
  const riskLabel = riskLabelFromScore(top.similarityScore)

  return {
    noveltyAssessment:
      `Novelty risk is ${riskLabel}: your proposal overlaps about ${scorePct}% with "${top.project.title}" from ${top.project.year}.`,
    overlapExplanation:
      `The strongest overlap appears in topic framing and scope with the matched project supervised by ${top.project.supervisor}. Refine the objective, dataset assumptions, and evaluation criteria to avoid near-duplication.`,
    refinementSuggestions: [
      'Limit the problem to a narrower sub-domain, user group, or use case boundary.',
      'Change at least one core axis: methodology, dataset source, or evaluation objective.',
      'Define explicit novelty claims and map each claim to a measurable experiment.',
    ],
    alternativeTopics: [
      `Hybrid recommendation architecture that extends "${top.project.title}" with explainability and auditability constraints.`,
      'Personalized project recommendation using feedback loops and quality-of-suggestion metrics.',
      'Institution-ready topic checker that integrates plagiarism risk with semantic novelty scoring.',
    ],
    researchGaps: [
      'Insufficient evidence on real-world impact of topic recommendation on student outcomes.',
      'Limited reproducible comparisons between LLM-guided and classical retrieval approaches.',
      'Weak coverage of deployment constraints such as latency, governance, and model drift.',
    ],
  }
}

async function requestGeminiApi<TResponse>(body: Record<string, unknown>) {
  const response = await fetch(GEMINI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as TResponse
}

async function tryGenerateText(contents: string) {
  try {
    const payload = await requestGeminiApi<{ text?: string }>({
      action: 'generateText',
      prompt: contents,
    })

    return payload?.text?.trim() || ''
  } catch {
    return ''
  }
}

export async function createEmbedding(text: string) {
  try {
    const payload = await requestGeminiApi<{ values?: number[] }>({
      action: 'embed',
      text,
    })

    const values = payload?.values

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

  const prompt = `You are assisting with project originality checks for final-year projects.\nUse ONLY the retrieved project context below. Do not invent project records.\n\nStudent proposal:\nTitle: ${params.input.proposedTitle}\nDescription: ${params.input.proposedDescription}\nKeywords: ${params.input.optionalKeywords.join(', ') || 'none'}\n\nRetrieved similar projects:\n${context || 'No similar projects found.'}\n\nReturn strict JSON only with the shape:\n{\n  "noveltyAssessment": string,\n  "overlapExplanation": string,\n  "refinementSuggestions": string[],\n  "alternativeTopics": string[],\n  "researchGaps": string[]\n}\n\nEnsure each list has at least 3 concise items when possible.`

  try {
    const text = await tryGenerateText(prompt)

    if (!text.trim()) {
      return heuristicRecommendation(params)
    }

    const parsed = parseJsonResponse(text)

    return {
      noveltyAssessment: parsed.noveltyAssessment || heuristicRecommendation(params).noveltyAssessment,
      overlapExplanation: parsed.overlapExplanation || heuristicRecommendation(params).overlapExplanation,
      refinementSuggestions: parsed.refinementSuggestions?.slice(0, 6) || heuristicRecommendation(params).refinementSuggestions,
      alternativeTopics: parsed.alternativeTopics?.slice(0, 6) || heuristicRecommendation(params).alternativeTopics,
      researchGaps: parsed.researchGaps?.slice(0, 6) || heuristicRecommendation(params).researchGaps,
    }
  } catch {
    return heuristicRecommendation(params)
  }
}

export async function generateTopicFollowUpResponse(params: {
  question: string
  input: TopicCheckInput
  result: TopicCheckResult
  conversationHistory?: TopicChatMessage[]
  pdfContext?: string
}) {
  const matchesContext = params.result.matches
    .map((match, index) => {
      const project = match.project

      return [
        `Match #${index + 1}`,
        `Title: ${project.title}`,
        `Department: ${project.department}`,
        `Year: ${project.year}`,
        `Supervisor: ${project.supervisor}`,
        `Similarity: ${(match.similarityScore * 100).toFixed(1)}%`,
        `Abstract: ${project.abstract}`,
      ].join('\n')
    })
    .join('\n\n')

  const recommendation = params.result.recommendation
  const conversationContext = (params.conversationHistory || [])
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n')

  const pdfContext = params.pdfContext?.trim() || ''

  const prompt = `${ACADEMIC_COPILOT_PERSONALITY}

Use ONLY the context below. Do not invent project records.

Student proposal:
Title: ${params.input.proposedTitle}
Description: ${params.input.proposedDescription}
Keywords: ${params.input.optionalKeywords.join(', ') || 'none'}

Similarity result:
Risk: ${params.result.risk}
Top match score: ${params.result.matches[0] ? `${(params.result.matches[0].similarityScore * 100).toFixed(1)}%` : '0%'}

Matches:
${matchesContext || 'No similar projects found.'}

Current recommendation context:
Novelty assessment: ${recommendation.noveltyAssessment}
Overlap explanation: ${recommendation.overlapExplanation}
Refinement suggestions: ${recommendation.refinementSuggestions.join(' | ')}
Alternative topics: ${recommendation.alternativeTopics.join(' | ')}
Research gaps: ${recommendation.researchGaps.join(' | ')}

Conversation so far:
${conversationContext || 'No prior follow-up conversation yet.'}

Student PDF context excerpt:
${pdfContext || 'PDF context unavailable.'}

Student question:
${params.question}

Respond using concise markdown with short headings and bullet points where helpful.
Keep it practical and include actionable next steps.`

  try {
    const text = (await tryGenerateText(prompt)).trim()

    if (!text) {
      return 'Based on your latest similarity report, focus first on narrowing scope, changing dataset or method, and defining a measurable novelty claim before resubmitting your topic.'
    }

    return text
  } catch {
    return 'I could not process this follow-up question right now. Use the similarity match and recommendation cards to revise scope, then ask again.'
  }
}
