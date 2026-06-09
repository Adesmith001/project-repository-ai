function sanitizeDownloadName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function downloadProjectPdf(input: { title: string; fileUrl: string }) {
  const response = await fetch(input.fileUrl)

  if (!response.ok) {
    throw new Error('Unable to download the project PDF.')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const fileName = sanitizeDownloadName(input.title) || 'project-record'

  anchor.href = objectUrl
  anchor.download = `${fileName}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
