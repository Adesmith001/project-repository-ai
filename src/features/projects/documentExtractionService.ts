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
  const abstractMatch = text.match(
    /\babstract\b\s*[:\-]?\s*([\s\S]{120,3500}?)(?:\n\s*(?:keywords?|index terms?|introduction|chapter\s*1|1\.?\s*introduction)\b)/i,
  )

  if (abstractMatch && abstractMatch[1]) {
    return normalizeWhitespace(abstractMatch[1])
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
        text += `${token.str} `
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
