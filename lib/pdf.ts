import puppeteer from 'puppeteer';

/**
 * Genera un buffer de PDF a partir de una cadena de HTML.
 * - Si GOTENBERG_URL / NEXT_PUBLIC_GOTENBERG_URL está definido, usa Gotenberg.
 * - En caso contrario (o si falla), hace fallback a Puppeteer.
 * @param html El contenido HTML completo para convertir a PDF.
 * @returns Una promesa que se resuelve con el buffer del PDF como un Uint8Array.
 */
export async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  // Resolver URL de Gotenberg desde variables de entorno
  const gotenbergUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOTENBERG_URL) ||
    (typeof process !== 'undefined' && process.env.GOTENBERG_URL) ||
    '';

  // Intentar con Gotenberg si está configurado
  if (gotenbergUrl) {
    try {
      const base = gotenbergUrl.replace(/\/+$/, '');
      // Usar FormData/Blob globales (Node 18+ / Next.js) sin dependencias extra
      const form = new (globalThis as any).FormData();
      const blob = new (globalThis as any).Blob([html], { type: 'text/html' });
      form.append('files', blob, 'index.html');
      form.append('printBackground', 'true'); // equivalente a Puppeteer printBackground

      const res = await fetch(`${base}/forms/chromium/convert/html`, {
        method: 'POST',
        body: form as any,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gotenberg error ${res.status}: ${errText}`);
      }

      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    } catch (error) {
      console.error('Error generando PDF vía Gotenberg, usando fallback Puppeteer:', error);
      // continúa con fallback
    }
  }

  // Fallback: Puppeteer
  let browser;
  try {
    // Las flags '--no-sandbox' son a menudo necesarias en entornos de contenedor
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Establece el contenido de la página
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Genera el PDF con formato A4
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Asegura que los colores de fondo se impriman
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Error generando el PDF con Puppeteer:", error);
    throw new Error("No se pudo generar el PDF.");
  } finally {
    // Asegúrate de que el navegador se cierre siempre
    if (browser) {
      await browser.close();
    }
  }
}