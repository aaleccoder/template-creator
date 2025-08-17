export async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  const gotenbergUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOTENBERG_URL) ||
    (typeof process !== 'undefined' && process.env.GOTENBERG_URL) ||
    '';

  if (!gotenbergUrl) {
    throw new Error(
      'La URL de Gotenberg no está configurada en las variables de entorno (GOTENBERG_URL o NEXT_PUBLIC_GOTENBERG_URL).',
    );
  }

  try {
    const base = gotenbergUrl.replace(/\/+$/, '');
    const form = new (globalThis as any).FormData();
    const blob = new (globalThis as any).Blob([html], { type: 'text/html' });
    form.append('files', blob, 'index.html');
    form.append('printBackground', 'true');
    form.append('preferCSSPageSize', 'true'); // Le indica a Gotenberg que use el tamaño de página del CSS (@page)

    const username = process.env.GOTENBERG_API_BASIC_AUTH_USERNAME;
    const password = process.env.GOTENBERG_API_BASIC_AUTH_PASSWORD;

    const headers: HeadersInit = {};
    if (username && password) {
      const credentials = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const res = await fetch(`${base}/forms/chromium/convert/html`, {
      method: 'POST',
      body: form as any,
      headers,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gotenberg error ${res.status}: ${errText}`);
    }

    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch (error) {
    console.error('Error generando PDF vía Gotenberg:', error);
    throw new Error('No se pudo generar el PDF con Gotenberg.');
  }
}
