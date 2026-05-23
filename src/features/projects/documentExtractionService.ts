import { getPdfDocument } from '../../lib/pdfjs'

interface ExtractedProjectMetadata {
  title?: string
  abstract?: string
  keywords?: string[]
  fullText?: string
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function parseKeywords(text: string) {
  const keywordMatch = text.match(/\bkeywords?\b\s*[:\-]\s*([^\n\r]+)/i)

  if (!keywordMatch || !keywordMatch[1]) {
    return []
  }

  return keywordMatch[1]
    .split(/[,;|]/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean)
    .slice(0, 12)
}

function parseAbstract(text: string) {
  let bestCandidate = ''

  // First pass: try to find abstract as a clear heading
  const headingRegex = /(?:^|\n|\s{2,})\s*abstract\b\s*[:\-]?\s*/gi
  let match

  while ((match = headingRegex.exec(text)) !== null) {
    const start = match.index + match[0].length
    const chunk = text.slice(start, start + 4000)
    
    const stopMatch = chunk.match(/\b(keywords?|index terms?|introduction|chapter\s*one|chapter\s*1|background of the study)\b/i)
    const end = stopMatch ? stopMatch.index : chunk.length
    
    const candidate = normalizeWhitespace(chunk.slice(0, end))
    
    if (candidate.length > 150 && candidate.length > bestCandidate.length) {
      bestCandidate = candidate
    }
  }

  if (bestCandidate) {
    return bestCandidate
  }

  // Fallback: look for the word abstract anywhere
  const fallbackRegex = /\babstract\b\s*[:\-]?\s*/gi
  while ((match = fallbackRegex.exec(text)) !== null) {
    const start = match.index + match[0].length
    const chunk = text.slice(start, start + 4000)
    
    const stopMatch = chunk.match(/\b(keywords?|index terms?|introduction|chapter\s*one|chapter\s*1|background of the study)\b/i)
    const end = stopMatch ? stopMatch.index : chunk.length
    
    const candidate = normalizeWhitespace(chunk.slice(0, end))
    
    // We only accept it if it's substantial, to avoid picking up the table of contents
    if (candidate.length > 150 && candidate.length > bestCandidate.length) {
      bestCandidate = candidate
    }
  }

  return bestCandidate
}

function parseTitle(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length >= 4)

  const titleLines: string[] = []
  
  for (const line of lines) {
    if (
      /^(by|a project|a thesis|a dissertation|submitted|in partial|department of|college of|faculty of)\b/i.test(line) ||
      /\b\d{2}[a-z]{2,3}\d{3,}\b/i.test(line)
    ) {
      break
    }
    
    titleLines.push(line)
    
    if (titleLines.join(' ').length > 250) {
      break
    }
  }

  const joinedTitle = titleLines.join(' ')
  return joinedTitle.length >= 10 ? joinedTitle : lines.find((line) => line.length <= 180)
}

function isTextItem(value: unknown): value is { str: string } {
  return typeof value === 'object'
    && value !== null
    && 'str' in value
    && typeof (value as { str?: unknown }).str === 'string'
}

async function extractPdfText(file: File) {
  const raw = await file.arrayBuffer()
  const document = await getPdfDocument(raw)

  const pages: string[] = []
  const count = document.numPages

  for (let pageNumber = 1; pageNumber <= count; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    let text = ''

    for (const token of content.items) {
      if (isTextItem(token)) {
        const hasEol = 'hasEOL' in token && Boolean((token as { hasEOL?: unknown }).hasEOL)
        text += hasEol ? `${token.str}\n` : `${token.str} `
      }
    }

    pages.push(text.trim())
  }

  return pages.join('\n')
}

export async function extractProjectMetadataFromPdf(file: File): Promise<ExtractedProjectMetadata> {
  const text = await extractPdfText(file)

  if (!text.trim()) {
    return {}
  }

  const title = parseTitle(text)
  const abstract = parseAbstract(text)
  const keywords = parseKeywords(text)

  return {
    title,
    abstract: abstract.length >= 60 ? abstract : undefined,
    keywords,
    fullText: text,
  }
}
