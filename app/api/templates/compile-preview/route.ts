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

    Handlebars.registerHelper('formatCurrency', function (value, options) {
      if (typeof value !== 'number') {
        return value;
      }

      const { currency = 'USD', locale = 'en-US' } = options.hash || {};

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(value);
    });

    Handlebars.registerHelper('calculate_subtotal', function (items) {
      if (!Array.isArray(items)) {
        return 0;
      }
      return items.reduce((total, item) => {
        const price = Number(item.unit_price || 0);
        const quantity = Number(item.quantity || 1);
        return total + (price * quantity);
      }, 0);
    });

    Handlebars.registerHelper('calculate_tax', function (base_amount, percentage) {
      const amount = Number(base_amount);
      const percent = Number(percentage);
      if (isNaN(amount) || isNaN(percent)) {
        return 0;
      }
      return (amount * percent) / 100;
    });

    Handlebars.registerHelper('calculate_grand_total', function (items, vat_percentage, irpf_percentage) {
      if (!Array.isArray(items)) {
        return 0;
      }

      const subtotal = items.reduce((total, item) => {
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
    Handlebars.registerHelper('add', function (a, b) {
      return Number(a) + Number(b);
    });

    Handlebars.registerHelper('subtract', function (a, b) {
      return Number(a) - Number(b);
    });

    Handlebars.registerHelper('multiply', function (a, b) {
      return Number(a) * Number(b);
    });

    Handlebars.registerHelper('divide', function (a, b) {
      if (Number(b) === 0) {
        return 'Cannot divide by zero';
      }
      return Number(a) / Number(b);
    });

    // Comparison Helpers
    Handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    Handlebars.registerHelper('neq', function (a, b) {
      return a !== b;
    });

    Handlebars.registerHelper('lt', function (a, b) {
      return a < b;
    });

    Handlebars.registerHelper('gt', function (a, b) {
      return a > b;
    });

    Handlebars.registerHelper('lte', function (a, b) {
      return a <= b;
    });

    Handlebars.registerHelper('gte', function (a, b) {
      return a >= b;
    });

    // Logical Helpers
    Handlebars.registerHelper('and', function () {
      return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
    });

    Handlebars.registerHelper('or', function () {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    });

    Handlebars.registerHelper('not', function (a) {
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