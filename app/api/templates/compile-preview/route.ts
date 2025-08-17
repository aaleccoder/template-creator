import { NextRequest, NextResponse } from 'next/server';
import Handlebars from 'handlebars/dist/handlebars.js';

export async function POST(req: NextRequest) {
  try {
    const { html, css, data } = await req.json();

    if (html === undefined || data === undefined) {
      return NextResponse.json({ message: 'Template HTML or data is missing.' }, { status: 400 });
    }

    Handlebars.registerHelper('json', function(context: any) {
        return JSON.stringify(context);
    });

    Handlebars.registerHelper('formatCurrency', function (value: any, options: any) {
      if (typeof value !== 'number') {
        return value;
      }

      const { currency = 'USD', locale = 'en-US' } = options.hash || {};

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(value);
    });

    Handlebars.registerHelper('calculate_subtotal', function (items: any) {
      if (!Array.isArray(items)) {
        return 0;
      }
      return items.reduce((total: any, item: any) => {
        const price = Number(item.unit_price || 0);
        const quantity = Number(item.quantity || 1);
        return total + (price * quantity);
      }, 0);
    });

    Handlebars.registerHelper('calculate_tax', function (base_amount: any, percentage: any) {
      const amount = Number(base_amount);
      const percent = Number(percentage);
      if (isNaN(amount) || isNaN(percent)) {
        return 0;
      }
      return (amount * percent) / 100;
    });

    Handlebars.registerHelper('calculate_grand_total', function (items: any, vat_percentage: any, irpf_percentage: any) {
      if (!Array.isArray(items)) {
        return 0;
      }

      const subtotal = items.reduce((total: any, item: any) => {
        const price = Number(item.unit_price || 0);
        const quantity = Number(item.quantity || 1);
        return total + (price * quantity);
      }, 0);

      const vat_percent = Number(vat_percentage);
      const irpf_percent = Number(irpf_percentage || 0);

      const vat_amount = (subtotal * vat_percent) / 100;
      const irpf_amount = (subtotal * irpf_percent) / 100;

      return subtotal + vat_amount - irpf_amount;
    });

    // Math Helpers
    Handlebars.registerHelper('add', function (a: any, b: any) {
      return Number(a) + Number(b);
    });

    Handlebars.registerHelper('subtract', function (a: any, b: any) {
      return Number(a) - Number(b);
    });

    Handlebars.registerHelper('multiply', function (a: any, b: any) {
      return Number(a) * Number(b);
    });

    Handlebars.registerHelper('divide', function (a: any, b: any) {
      if (Number(b) === 0) {
        return 'Cannot divide by zero';
      }
      return Number(a) / Number(b);
    });

    // Comparison Helpers
    Handlebars.registerHelper('eq', function (a: any, b: any) {
      return a === b;
    });

    Handlebars.registerHelper('neq', function (a: any, b: any) {
      return a !== b;
    });

    Handlebars.registerHelper('lt', function (a: any, b: any) {
      return a < b;
    });

    Handlebars.registerHelper('gt', function (a: any, b: any) {
      return a > b;
    });

    Handlebars.registerHelper('lte', function (a: any, b: any) {
      return a <= b;
    });

    Handlebars.registerHelper('gte', function (a: any, b: any) {
      return a >= b;
    });

    // Logical Helpers
    Handlebars.registerHelper('and', function (...args: any[]) {
      return args.slice(0, -1).every(Boolean);
    });

    Handlebars.registerHelper('or', function (...args: any[]) {
      return args.slice(0, -1).some(Boolean);
    });

    Handlebars.registerHelper('not', function (a: any) {
        return !a;
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