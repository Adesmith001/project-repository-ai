import { getPdfDocument } from '../../lib/pdfjs'

interface ExtractedProjectMetadata {
  title?: string
  abstract?: string
  keywords?: string[]
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
  const headingPattern = /(?:^|\n)\s*abstract\b\s*[:\-]?\s*/gi
  const stopPattern = /\n\s*(?:keywords?|index terms?|introduction|chapter\s*\d+|[ivxlcdm]+\s+[a-z][^\n]{0,80}|[A-Z][A-Z\s]{6,})\b/i
  const frontMatterPattern = /\b(certification|dedication|acknowledg(e)?ment|table of contents)\b/i

  const candidates: string[] = []
  let match: RegExpExecArray | null

  while ((match = headingPattern.exec(text)) !== null) {
    const sectionStart = match.index + match[0].length
    const remainder = text.slice(sectionStart)
    const stopMatch = remainder.match(stopPattern)
    const sectionEnd = stopMatch && typeof stopMatch.index === 'number'
      ? sectionStart + stopMatch.index
      : Math.min(sectionStart + 4000, text.length)
    const candidate = normalizeWhitespace(text.slice(sectionStart, sectionEnd))

    if (candidate.length >= 120 && !frontMatterPattern.test(candidate.slice(0, 600))) {
      candidates.push(candidate)
    }
  }

  if (candidates.length > 0) {
    // Prefer the most substantial abstract-like section.
    return candidates.sort((a, b) => b.length - a.length)[0]
  }

  // Fallback: use the leading chunk when explicit abstract heading is absent.
  return normalizeWhitespace(text.slice(0, 1000))
}

function parseTitle(text: string) {
  const firstLines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length >= 8)

  return firstLines.find((line) => line.length <= 180)
}

function isTextItem(value: unknown): value is { str: string } {
  return typeof value === 'object'
    && value !== null
    && 'str' in value
    && typeof (value as { str?: unknown }).str === 'string'
}

async function extractPdfText(file: File, maxPages = 6) {
  const raw = await file.arrayBuffer()
  const document = await getPdfDocument(raw)

  const pages: string[] = []
  const count = Math.min(document.numPages, maxPages)

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
  }
}
