import * as pdfjsLib from 'pdfjs-dist';
import { readMediaBinary, savePdfPageImage, isTauriEnvironment } from './tauri';

// Configurar el worker de PDF.js para Vite / WebView2
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
  } catch (err) {
    console.warn('[PDF Service] Error configurando worker de PDF.js:', err);
  }
}

export interface RenderedPdfPage {
  pageNumber: number;
  totalPages: number;
  imagePath: string;
  pdfName: string;
}

export interface PdfProgressCallback {
  (current: number, total: number, filename: string): void;
}

/**
 * Renderiza todas las páginas de un archivo PDF a imágenes de alta definición (Full HD / 4K)
 * y las guarda localmente en el directorio persistente de NEXA Church.
 * No impone límite en la cantidad de páginas a procesar.
 */
export async function renderPdfPagesToImages(
  filePath: string,
  onProgress?: PdfProgressCallback
): Promise<RenderedPdfPage[]> {
  // 1. Extraer nombre amigable del archivo PDF
  const rawFileName = filePath.split(/[\\/]/).pop() || 'documento.pdf';
  const pdfName = rawFileName.replace(/\.pdf$/i, '').trim() || 'Documento PDF';
  const sanitizedFolder = pdfName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40) + `_${Date.now()}`;

  // 2. Cargar bytes binarios del archivo PDF
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await readMediaBinary(filePath);
  } catch (err) {
    throw new Error(`No se pudo leer el archivo PDF desde el disco: ${err}`);
  }

  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('El archivo PDF está vacío o no contiene datos válidos.');
  }

  // 3. Inicializar el motor de renderizado de PDF
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  if (totalPages === 0) {
    throw new Error('El documento PDF no contiene páginas legibles.');
  }

  const results: RenderedPdfPage[] = [];

  // 4. Procesar página por página sin límite
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, totalPages, pdfName);
    }

    const page = await pdfDoc.getPage(pageNum);

    // Escala 2.0x garantiza nitidez cristalina en pantallas Full HD y proyectores 4K (aprox. 150-200 DPI)
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('No se pudo inicializar el contexto de dibujo para la página del PDF.');
    }

    // Fondo blanco nítido base para documentos / partituras / diapositivas
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // Exportar a JPEG de alta fidelidad (calidad 92%)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    let savedPath = dataUrl;
    if (isTauriEnvironment()) {
      try {
        savedPath = await savePdfPageImage(sanitizedFolder, pageNum, dataUrl);
      } catch (saveErr) {
        console.warn(`[PDF Service] Fallback a memoria para pág. ${pageNum}:`, saveErr);
        savedPath = dataUrl;
      }
    }

    results.push({
      pageNumber: pageNum,
      totalPages,
      imagePath: savedPath,
      pdfName,
    });

    // Liberar memoria del canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  return results;
}
