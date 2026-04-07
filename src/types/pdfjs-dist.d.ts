declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export interface TextItem {
    str: string
  }

  export interface TextMarkedContent {
    type?: string
  }

  export interface TextContent {
    items: Array<TextItem | TextMarkedContent>
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>
  }

  export interface PDFDocumentProxy {
    numPages: number
    getPage(pageNumber: number): Promise<PDFPageProxy>
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>
  }

  export function getDocument(params: { data: ArrayBuffer | Uint8Array }): PDFDocumentLoadingTask

  export const GlobalWorkerOptions: {
    workerSrc: string
  }
}
