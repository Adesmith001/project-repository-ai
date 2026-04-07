interface PdfTextContent {
	items: unknown[]
}

interface PdfPageProxy {
	getTextContent(): Promise<PdfTextContent>
}

export interface PdfDocumentProxy {
	numPages: number
	getPage(pageNumber: number): Promise<PdfPageProxy>
}

interface PdfDocumentLoadingTask {
	promise: Promise<PdfDocumentProxy>
}

interface PdfJsModule {
	getDocument(params: { data: ArrayBuffer | Uint8Array }): PdfDocumentLoadingTask
	GlobalWorkerOptions: {
		workerSrc: string
	}
}

let pdfModule: PdfJsModule | null = null

async function loadPdfModule(): Promise<PdfJsModule> {
	if (pdfModule) {
		return pdfModule
	}

	// The package ships ESM bundles whose declaration resolution can be inconsistent in editor tooling.
	// Loading at runtime keeps type diagnostics local and stable.
	// @ts-ignore
	const module = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsModule
	module.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

	pdfModule = module
	return module
}

export async function getPdfDocument(data: ArrayBuffer) {
	const module = await loadPdfModule()
	return module.getDocument({ data }).promise
}
