import { describe, expect, it, vi } from 'vitest'
import { downloadProjectPdf } from '../projectDownloadService'

describe('downloadProjectPdf', () => {
  it('downloads the remote PDF through a blob URL', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    })
    const appendChildMock = vi.spyOn(document.body, 'appendChild')
    const removeChildMock = vi.spyOn(document.body, 'removeChild')
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:project')
    const revokeObjectUrlMock = vi.fn()
    const clickMock = vi.fn()
    const anchor = document.createElement('a')

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', {
      createObjectURL: createObjectUrlMock,
      revokeObjectURL: revokeObjectUrlMock,
    })

    vi.spyOn(anchor, 'click').mockImplementation(clickMock)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return anchor
      }

      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement
    })

    await downloadProjectPdf({
      title: 'AI Attendance System',
      fileUrl: 'https://example.com/project.pdf',
    })

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/project.pdf')
    expect(createObjectUrlMock).toHaveBeenCalledWith(blob)
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(appendChildMock).toHaveBeenCalledTimes(1)
    expect(removeChildMock).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:project')

    createElementSpy.mockRestore()
    appendChildMock.mockRestore()
    removeChildMock.mockRestore()
    vi.unstubAllGlobals()
  })
})
