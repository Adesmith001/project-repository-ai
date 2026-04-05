export function parseKeywordInput(input: string) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function buildSemanticQuery(params: {
  title: string
  description: string
  keywords: string[]
}) {
  const keywordText = params.keywords.length > 0 ? `Keywords: ${params.keywords.join(', ')}` : ''

  return [
    `Proposed title: ${params.title}`,
    `Description: ${params.description}`,
    keywordText,
  ]
    .filter(Boolean)
    .join('\n')
}
