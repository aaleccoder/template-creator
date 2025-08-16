import { NextRequest, NextResponse } from 'next/server';
import Handlebars from 'handlebars';

export async function POST(req: NextRequest) {
  try {
    const { html, css, data } = await req.json();

    if (html === undefined || data === undefined) {
      return NextResponse.json({ message: 'Template HTML or data is missing.' }, { status: 400 });
    }

    Handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context);
    });

    const template = Handlebars.compile(html);
    const processedHtml = template(data);

    const finalHtml = `
      <style>${css || ''}</style>
      ${processedHtml}
    `;

    return NextResponse.json({ previewHtml: finalHtml });
  } catch (error: any) {
    console.error('Error compiling template:', error);
    return NextResponse.json({ message: 'Error compiling template', error: error.message }, { status: 500 });
  }
}