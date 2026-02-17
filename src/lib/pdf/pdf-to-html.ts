// src/lib/pdf/pdf-to-html.ts

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { createCanvas } from 'canvas';

// Set worker path
const PDFJS_WORKER_SRC = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfPage {
  pageNumber: number;
  imageDataUrl: string;  // Page rendered as image
  textContent: string;   // Extracted text
  width: number;
  height: number;
}

export interface PdfConversionResult {
  pages: PdfPage[];
  fullText: string;
  metadata: {
    pageCount: number;
    title?: string;
  };
}

export async function convertPdfToHtml(pdfBuffer: Buffer): Promise<PdfConversionResult> {
  try {
    // Load PDF
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    const pages: PdfPage[] = [];
    let fullText = '';

    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Get viewport
      const scale = 2.0; // Higher scale = better quality
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // Render page to canvas
      await page.render({
        canvasContext: context as any,
        viewport: viewport,
      }).promise;

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/png');

      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';

      pages.push({
        pageNumber: pageNum,
        imageDataUrl,
        textContent: pageText,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return {
      pages,
      fullText: fullText.trim(),
      metadata: {
        pageCount: pdf.numPages,
        title: (await pdf.getMetadata()).info?.Title,
      },
    };
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert PDF to HTML');
  }
}

// Generate clean HTML for a page
export function generatePageHtml(page: PdfPage): string {
  return `
    <div class="lesson-page" data-page="${page.pageNumber}">
      <img 
        src="${page.imageDataUrl}" 
        alt="Lesson page ${page.pageNumber}"
        class="w-full h-auto rounded-lg shadow-lg"
        loading="lazy"
      />
    </div>
  `;
}