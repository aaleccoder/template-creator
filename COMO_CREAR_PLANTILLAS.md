
---

### 8. Diseño de Plantillas para PDF

Cuando el objetivo final de una plantilla es generar un documento PDF, es crucial definir el tamaño de la página y los márgenes correctamente. La forma recomendada de hacerlo es usando la regla `@page` de CSS directamente en tu plantilla HTML.

#### Uso de la Regla `@page`

La regla `@page` te permite especificar el tamaño del papel y los márgenes del documento PDF que se generará. El motor de PDFs (Gotenberg) está configurado para respetar estas reglas.

**Sintaxis:**
```css
@page {
  size: <valor>; /* ej. A4, letter, 210mm 297mm */
  margin: <valor>; /* ej. 25mm, 1in */
}
```

**Ejemplo Práctico:**
Para una plantilla de factura en tamaño A4 con márgenes de 2.5cm en todos los lados, añadirías el siguiente código CSS a la sección `<style>` de tu HTML:

```css
@page {
  size: A4;
  margin: 25mm;
}

body {
  /* Estilos generales para el contenido del documento */
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
}
```

#### ¿Cómo afecta esto al HTML?

Al usar `@page`, los márgenes del documento PDF son controlados por la regla CSS. Ya no necesitas simular la página con un `<div>` con `padding`. El contenido de tu `<body>` se renderizará directamente dentro de los márgenes definidos.

**Antes (método no recomendado para PDF):**
```html
<style>
  .page { padding: 25mm; width: 210mm; }
</style>
<body>
  <div class="page">
    <h1>Contenido</h1>
  </div>
</body>
```

**Después (método recomendado para PDF):**
```html
<style>
  @page { size: A4; margin: 25mm; }
</style>
<body>
  <h1>Contenido</h1>
</body>
```

Este enfoque asegura que el PDF generado tenga las dimensiones y márgenes exactos que has definido, resultando en un documento profesional y bien alineado.
