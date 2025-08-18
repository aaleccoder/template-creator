import Handlebars from "handlebars";

interface CustomHelper {
  name: string;
  body: string;
}

// Flag to ensure base helpers are registered only once
let areBaseHelpersRegistered = false;

export function registerHandlebarsHelpers(customHelpers: CustomHelper[] = []) {
  if (!areBaseHelpersRegistered) {
    /**
     * Helper para comparar si dos valores son iguales.
     * Uso: {{#if_eq valor1 valor2}}...{{/if_eq}}
     */
    Handlebars.registerHelper("if_eq", function (a, b, options) {
      if (a === b) {
        // @ts-ignore
        return options.fn(this);
      }
      // @ts-ignore
      return options.inverse(this);
    });

    /**
     * Helper para formatear un número como moneda.
     * Uso: {{formatCurrency valor "EUR"}} o {{formatCurrency valor}} (predeterminado a USD)
     */
    Handlebars.registerHelper("formatCurrency", function (value, currency) {
      const numValue = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(numValue)) {
        return ""; // No mostrar nada si el valor no es un número
      }

      const currencyCode = typeof currency === "string" ? currency : "USD";

      try {
        return new Intl.NumberFormat("de-DE", {
          // Usar un local que use . como separador de miles y , como decimal
          style: "currency",
          currency: currencyCode,
          currencyDisplay: "code", // Para evitar ambigüedad de símbolos como $
        })
          .format(numValue)
          .replace(currencyCode, "")
          .trim(); // Eliminar el código de la moneda para que no aparezca dos veces
      } catch (e) {
        console.error("Error en el helper formatCurrency:", e);
        return numValue;
      }
    });

    /**
     * Helper para convertir un objeto a una cadena JSON (útil para depuración).
     * Uso: {{{json someObject}}}
     */
    Handlebars.registerHelper("json", function (context) {
      return JSON.stringify(context, null, 2);
    });

    /**
     * Helper para formatear una fecha.
     * Uso: {{formatDate "2024-07-30T10:00:00Z" "es-ES"}}
     */
    Handlebars.registerHelper("formatDate", (isoString, locale = "es-ES") => {
      if (!isoString) return "";
      try {
        return new Date(isoString).toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (e) {
        return isoString;
      }
    });

    /**
     * Helper para multiplicar dos números.
     * Uso: {{multiply this.quantity this.unit_price}}
     */
    Handlebars.registerHelper("multiply", function (a, b) {
      const numA = typeof a === "number" ? a : parseFloat(a);
      const numB = typeof b === "number" ? b : parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA * numB;
      }
      return 0;
    });

    /**
     * Helper para calcular el subtotal de una lista de items.
     * Asume que cada item tiene 'quantity' y 'unit_price'.
     * Uso: {{calculate_subtotal line_items}}
     */
    Handlebars.registerHelper("calculate_subtotal", function (items) {
      if (!Array.isArray(items)) {
        return 0;
      }
      return items.reduce((total, item) => {
        const quantity = parseFloat(item.quantity);
        const price = parseFloat(item.unit_price);
        if (!isNaN(quantity) && !isNaN(price)) {
          return total + quantity * price;
        }
        return total;
      }, 0);
    });

    /**
     * Helper para calcular un impuesto sobre una base.
     * Uso: {{calculate_tax subtotal percentage}}
     */
    Handlebars.registerHelper("calculate_tax", function (base, percentage) {
      const baseNum = typeof base === "number" ? base : parseFloat(base);
      const percNum =
        typeof percentage === "number" ? percentage : parseFloat(percentage);

      if (isNaN(baseNum) || isNaN(percNum)) {
        return 0;
      }
      return baseNum * (percNum / 100);
    });

    /**
     * Helper para calcular el total final (subtotal + IVA - IRPF).
     * Uso: {{calculate_grand_total items vat_percentage irpf_percentage}}
     */
    Handlebars.registerHelper(
      "calculate_grand_total",
      function (items, vatPercentage, irpfPercentage) {
        // Reutilizar la lógica de los otros helpers para consistencia
        const subtotal = Handlebars.helpers.calculate_subtotal.call(this, items);
        const vatAmount = Handlebars.helpers.calculate_tax.call(
          this,
          subtotal,
          vatPercentage
        );

        let irpfAmount = 0;
        const irpfPercNum =
          typeof irpfPercentage === "number"
            ? irpfPercentage
            : parseFloat(irpfPercentage);
        if (!isNaN(irpfPercNum) && irpfPercNum > 0) {
          irpfAmount = Handlebars.helpers.calculate_tax.call(
            this,
            subtotal,
            irpfPercNum
          );
        }

        return subtotal + vatAmount - irpfAmount;
      }
    );

    areBaseHelpersRegistered = true;
  }

  // Registrar helpers dinámicos
  customHelpers.forEach((helper) => {
    if (Handlebars.helpers[helper.name]) {
      console.warn(
        `El helper dinámico '${helper.name}' ya existe y será sobreescrito.`
      );
    }
    try {
      const dynamicHelper = new Function(`return ${helper.body}`)();
      Handlebars.registerHelper(helper.name, dynamicHelper);
    } catch (e) {
      console.error(
        `Error al registrar el helper dinámico '${helper.name}':`,
        e
      );
    }
  });
}