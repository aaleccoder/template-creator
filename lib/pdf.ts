import puppeteer from 'puppeteer';

/**
 * Genera un buffer de PDF a partir de una cadena de HTML.
 * @param html El contenido HTML completo para convertir a PDF.
 * @returns Una promesa que se resuelve con el buffer del PDF como un Uint8Array.
 */
export async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  let browser;
  try {
    // Inicia una instancia de navegador
    // Las flags '--no-sandbox' son a menudo necesarias en entornos de servidor/contenedores
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