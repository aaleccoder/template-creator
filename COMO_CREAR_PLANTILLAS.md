# Tutorial: Creación de Plantillas de Formularios Dinámicos

Este tutorial te guiará a través del proceso de creación de plantillas JSON para generar formularios dinámicos en la aplicación. Estos formularios son renderizados por el componente `FormRenderer`, que interpreta un objeto JSON (un "schema") para construir la interfaz de usuario y aplicar reglas de validación.

## Índice
1.  [Estructura Base del Schema](#1-estructura-base-del-schema)
2.  [Definición de Campos (`fields`)](#2-definición-de-campos-fields)
3.  [Propiedades Comunes de los Campos](#3-propiedades-comunes-de-los-campos)
4.  [Tipos de Campos y sus Propiedades Específicas](#4-tipos-de-campos-y-sus-propiedades-específicas)
    *   [Texto (`text`)](#texto-text)
    *   [Área de Texto (`textarea`)](#área-de-texto-textarea)
    *   [Número (`number`)](#número-number)
    *   [Selector (`select`)](#selector-select)
    *   [Fecha (`date`)](#fecha-date)
    *   [Imagen (`image`)](#imagen-image)
    *   [Lista/Array (`array`)](#listaarray-array)
5.  [Ejemplo Completo de un Schema](#5-ejemplo-completo-de-un-schema)
6.  [Conexión con las Plantillas Handlebars](#6-conexión-con-las-plantillas-handlebars)

---

### 1. Estructura Base del Schema

Cada plantilla de formulario se define en un archivo JSON. La estructura raíz de este JSON, a la que llamamos "schema", debe contener las siguientes propiedades:

-   `title` (string): El título principal del formulario.
-   `description` (string): Una breve descripción o instrucciones para el usuario.
-   `fields` (array): Una lista de objetos, donde cada objeto define un campo del formulario.

**Ejemplo de la estructura base:**

```json
{
  "title": "Ficha de Producto",
  "description": "Rellena los siguientes campos para crear una nueva ficha de producto.",
  "fields": [
    // ... aquí irán las definiciones de los campos ...
  ]
}
```

---

### 2. Definición de Campos (`fields`)

La propiedad `fields` es un array que contiene la definición de cada uno de los campos que aparecerán en el formulario. El orden de los objetos en el array determina el orden en que se mostrarán en la interfaz.

Cada objeto de campo debe tener una serie de propiedades para definir su comportamiento y apariencia.

---

### 3. Propiedades Comunes de los Campos

Estas son las propiedades básicas que se pueden aplicar a casi todos los tipos de campos:

-   `name` (string, **requerido**): El identificador único del campo. Este será el `key` en el objeto de datos final. No debe contener espacios ni caracteres especiales.
-   `label` (string, **requerido**): La etiqueta que se mostrará al usuario junto al campo de entrada.
-   `type` (string, **requerido**): Define el tipo de control que se renderizará. Los valores posibles se detallan en la siguiente sección.
-   `required` (boolean, opcional): Si se establece en `true`, el usuario no podrá enviar el formulario si este campo está vacío.
-   `placeholder` (string, opcional): El texto de ejemplo que aparece dentro del campo antes de que el usuario escriba algo.

**Ejemplo de un campo de texto simple:**

```json
{
  "name": "product_name",
  "label": "Nombre del Producto",
  "type": "text",
  "required": true,
  "placeholder": "Ej: Camiseta de algodón"
}
```

---

### 4. Tipos de Campos y sus Propiedades Específicas

Aquí se detallan todos los tipos de campos (`type`) disponibles y sus propiedades de configuración y validación adicionales.

#### Texto (`text`)

Ideal para entradas de texto cortas.

-   `minLength` (number, opcional): Mínimo número de caracteres permitidos.
-   `maxLength` (number, opcional): Máximo número de caracteres permitidos.
-   `pattern` (string, opcional): Una expresión regular (regex) que el valor debe cumplir.
-   `format` (string, opcional): Pre-configuración de validación. Valores posibles:
    -   `email`: Valida que el texto tenga formato de correo electrónico.
    -   `url`: Valida que el texto sea una URL (aunque `type="url"` es más semántico).

**Ejemplo:**

```json
{
  "name": "customer_email",
  "label": "Correo Electrónico del Cliente",
  "type": "text",
  "format": "email",
  "required": true,
  "placeholder": "usuario@ejemplo.com"
}
```

#### Área de Texto (`textarea`)

Similar al tipo `text`, pero renderiza un campo de texto de múltiples líneas, ideal para descripciones largas. Admite las mismas propiedades que `text` (`minLength`, `maxLength`, `pattern`).

**Ejemplo:**

```json
{
  "name": "product_description",
  "label": "Descripción del Producto",
  "type": "textarea",
  "maxLength": 500,
  "placeholder": "Describe las características principales del producto..."
}
```

#### Número (`number`)

Para valores numéricos.

-   `min` (number, opcional): El valor mínimo permitido.
-   `max` (number, opcional): El valor máximo permitido.
-   `integer` (boolean, opcional): Si es `true`, solo se permitirán números enteros.
-   `step` (number, opcional): Define el incremento para los botones de subida/bajada del campo numérico.

**Ejemplo:**

```json
{
  "name": "product_price",
  "label": "Precio (€)",
  "type": "number",
  "required": true,
  "min": 0,
  "step": 0.01,
  "placeholder": "25.99"
}
```

#### Selector (`select`)

Renderiza una lista desplegable de opciones.

-   `options` (array, **requerido**): Un array de objetos, cada uno con `value` y `label`.
    -   `value` (string): El valor que se guardará cuando se seleccione la opción.
    -   `label` (string): El texto que verá el usuario en la lista.

**Ejemplo:**

```json
{
  "name": "product_category",
  "label": "Categoría",
  "type": "select",
  "required": true,
  "placeholder": "Seleccione una categoría",
  "options": [
    { "value": "ropa", "label": "Ropa y Accesorios" },
    { "value": "hogar", "label": "Hogar y Jardín" },
    { "value": "electronica", "label": "Electrónica" }
  ]
}
```

#### Fecha (`date`)

Renderiza un selector de fecha nativo del navegador. No tiene propiedades específicas adicionales.

**Ejemplo:**

```json
{
  "name": "delivery_date",
  "label": "Fecha de Entrega Estimada",
  "type": "date",
  "required": true
}
```

#### Imagen (`image`)

Renderiza un componente para subir imágenes. El valor guardado será la URL de la imagen subida.

-   `acceptMime` (string, opcional): El tipo de archivo MIME aceptado. Por defecto es `image/*`. Ejemplo: `image/jpeg, image/png`.
-   `maxSizeMB` (number, opcional): El tamaño máximo del archivo en Megabytes. Por defecto es `5`.

**Ejemplo:**

```json
{
  "name": "product_image",
  "label": "Imagen Principal del Producto",
  "type": "image",
  "required": true,
  "maxSizeMB": 2
}
```

#### Lista/Array (`array`)

Permite al usuario añadir dinámicamente una lista de elementos, donde cada elemento es un conjunto de campos.

-   `itemFields` (array, **requerido**): Un array de definiciones de campos que componen cada elemento de la lista. La estructura es la misma que la del array `fields` principal.
-   `minItems` (number, opcional): El número mínimo de elementos que la lista debe contener.
-   `maxItems` (number, opcional): El número máximo de elementos que se pueden añadir a la lista.

**Ejemplo de una lista de características:**

```json
{
  "name": "product_features",
  "label": "Características",
  "type": "array",
  "minItems": 1,
  "maxItems": 5,
  "itemFields": [
    {
      "name": "feature_name",
      "label": "Nombre de la Característica",
      "type": "text",
      "required": true,
      "placeholder": "Ej: Material"
    },
    {
      "name": "feature_value",
      "label": "Valor",
      "type": "text",
      "required": true,
      "placeholder": "Ej: 100% Algodón"
    }
  ]
}
```

---

### 5. Ejemplo Completo de un Schema

Aquí tienes un ejemplo completo de un schema para una "Ficha de Producto" que combina varios de los tipos de campos explicados.

```json
{
  "title": "Ficha de Producto Avanzada",
  "description": "Rellena todos los detalles para dar de alta un nuevo producto en el catálogo.",
  "fields": [
    {
      "name": "product_name",
      "label": "Nombre del Producto",
      "type": "text",
      "required": true,
      "minLength": 3,
      "maxLength": 80,
      "placeholder": "Camiseta Premium"
    },
    {
      "name": "product_sku",
      "label": "SKU (Código de Producto)",
      "type": "text",
      "required": true,
      "pattern": "^[A-Z0-9-]{5,15}$",
      "placeholder": "SKU-12345"
    },
    {
      "name": "product_description",
      "label": "Descripción Larga",
      "type": "textarea",
      "required": true,
      "maxLength": 1000,
      "placeholder": "Una descripción detallada del producto, sus materiales, uso, etc."
    },
    {
      "name": "product_price",
      "label": "Precio de Venta (€)",
      "type": "number",
      "required": true,
      "min": 0.50,
      "placeholder": "29.99"
    },
    {
      "name": "product_category",
      "label": "Categoría",
      "type": "select",
      "required": true,
      "options": [
      	{ "value": "", "label": "Seleccione una categoría" },
        { "value": "ropa", "label": "Ropa" },
        { "value": "calzado", "label": "Calzado" },
        { "value": "accesorios", "label": "Accesorios" }
      ]
    },
    {
      "name": "product_image",
      "label": "Imagen Principal",
      "type": "image",
      "required": true,
      "maxSizeMB": 3,
      "acceptMime": "image/jpeg, image/png"
    },
    {
      "name": "product_features",
      "label": "Características Técnicas",
      "type": "array",
      "minItems": 1,
      "maxItems": 8,
      "itemFields": [
        {
          "name": "feature_name",
          "label": "Característica",
          "type": "text",
          "required": true,
          "placeholder": "Material"
        },
        {
          "name": "feature_value",
          "label": "Valor",
          "type": "text",
          "required": true,
          "placeholder": "Algodón orgánico"
        }
      ]
    }
  ]
}
```

---

### 6. Conexión con las Plantillas Handlebars

Una vez que el usuario rellena el formulario, los datos se recopilan en un único objeto JSON. Las claves (`key`) de este objeto son los `name` que definiste para cada campo en el schema.

Este objeto de datos se utiliza para renderizar una plantilla HTML a través de [Handlebars](https://handlebarsjs.com/). En tu plantilla Handlebars, puedes acceder a cada valor utilizando su `name`.

**Ejemplo:**

Si el usuario introduce "Camiseta Premium" en el campo con `name: "product_name"`, en tu plantilla Handlebars puedes mostrarlo así:

```html
<h1>{{ product_name }}</h1>
```

Para una lista (`array`) como `product_features`, puedes iterar sobre ella:

```html
<ul>
  {{#each product_features}}
    <li><strong>{{this.feature_name}}:</strong> {{this.feature_value}}</li>
  {{/each}}
</ul>
```

Asegúrate de que los `name` en tu schema JSON coincidan exactamente con las variables que usas en tu plantilla Handlebars.
