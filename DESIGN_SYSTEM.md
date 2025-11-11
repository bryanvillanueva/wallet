# Liquid Design System - Wallet App

## Filosofía de Diseño

Sistema de diseño minimalista inspirado en **iOS 26.01 Liquid**, con superficies fluidas, transparencias suaves y colores que se adaptan perfectamente a modo claro y oscuro.

---

## Paleta de Colores

### Light Mode (Modo Claro)
```css
--color-bg-light: #f7f8fa           /* Fondo principal gris muy claro */
--color-surface-light: rgba(255, 255, 255, 0.6)  /* Superficies con blur */
--color-surface-border-light: rgba(255, 255, 255, 0.3)  /* Bordes sutiles */
--color-text-light: #1a1a1a         /* Texto principal casi negro */
--color-text-secondary-light: #666666  /* Texto secundario gris */
--color-accent-light: #22d3ee       /* Azul-verde (cyan) suave */
```

**Uso:**
- Fondo general: `bg-[#f7f8fa]`
- Cards/Surfaces: `bg-white/60` + `backdrop-blur-md`
- Botones primarios: `bg-gradient-to-r from-[#22d3ee] to-[#22d3ee]`
- Texto principal: `text-[#1a1a1a]`
- Texto secundario: `text-[#666666]` o `text-[#999999]`

### Dark Mode (Modo Oscuro)
```css
--color-bg-dark: #0b0d10           /* Fondo negro profundo */
--color-surface-dark: rgba(26, 29, 36, 0.6)  /* Superficies oscuras con blur */
--color-surface-border-dark: rgba(255, 255, 255, 0.1)  /* Bordes sutiles claros */
--color-text-dark: #ffffff         /* Texto blanco */
--color-text-secondary-dark: #a3a3a3  /* Texto secundario gris claro */
--color-accent-dark: #4da3ff       /* Azul vivo brillante */
```

**Uso:**
- Fondo general: `dark:bg-[#0b0d10]`
- Cards/Surfaces: `dark:bg-[rgba(26,29,36,0.6)]` + `backdrop-blur-md`
- Botones primarios: `dark:from-[#4da3ff] dark:to-[#22d3ee]`
- Texto principal: `dark:text-white`
- Texto secundario: `dark:text-neutral-400` o `dark:text-neutral-500`

---

## Componentes Base

### Cards (Tarjetas)

```html
<!-- Light + Dark mode -->
<div class="bg-white/60 dark:bg-[rgba(26,29,36,0.6)]
            backdrop-blur-md
            rounded-2xl
            shadow-[0_8px_30px_rgba(0,0,0,0.12)]
            p-6
            border border-white/30 dark:border-white/10">
  <!-- Contenido -->
</div>
```

**Características:**
- Transparencia 60% en light, menor en dark
- Blur de fondo (glassmorphism)
- Bordes redondeados `rounded-2xl` (16px)
- Sombra difusa personalizada
- Bordes sutiles con transparencia

### Botones Primarios

```html
<button class="px-4 py-3
               bg-gradient-to-r from-[#22d3ee] to-[#22d3ee]
               dark:from-[#4da3ff] dark:to-[#22d3ee]
               rounded-2xl
               text-[15px] font-semibold text-white
               shadow-lg hover:shadow-xl
               transition duration-200 ease-out
               transform hover:scale-[0.98]">
  Botón Primario
</button>
```

**Estados:**
- Normal: Gradiente cyan (light) / azul vivo (dark)
- Hover: Sombra más grande + scale 98%
- Active/Press: Transform scale
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

### Botones Secundarios

```html
<button class="px-4 py-3
               bg-white/40 dark:bg-white/5
               hover:bg-white/60 dark:hover:bg-white/10
               backdrop-blur-md
               rounded-2xl
               text-[15px] font-semibold
               text-[#666666] dark:text-neutral-300
               transition duration-200 ease-out">
  Botón Secundario
</button>
```

### Inputs (Campos de Texto)

```html
<input type="text"
       class="w-full px-4 py-3
              bg-white/40 dark:bg-white/5
              backdrop-blur-md
              border border-white/30 dark:border-white/20
              rounded-2xl
              text-[#1a1a1a] dark:text-white
              text-[15px]
              placeholder-[#999999] dark:placeholder-neutral-500
              focus:outline-none
              focus:ring-2 focus:ring-[#22d3ee] dark:focus:ring-[#4da3ff]
              transition duration-200"
       placeholder="Texto aquí" />
```

**Estados:**
- Normal: Fondo translúcido + borde sutil
- Focus: Ring de 2px en color acento
- Error: `border-red-500/50` + mensaje debajo

---

## Tipografía

### Escala de Tamaños

```css
text-[13px]  → Labels, mensajes secundarios, footers
text-[15px]  → Texto base, inputs, botones
text-[17px]  → Subtítulos, nombres destacados
text-2xl     → Títulos de secciones (24px)
text-3xl     → Títulos principales (30px)
```

### Pesos

```css
font-medium    → 500 (labels)
font-semibold  → 600 (títulos, botones)
font-bold      → 700 (muy destacado, rara vez)
```

### Ejemplos

```html
<!-- Título principal -->
<h1 class="text-3xl font-semibold text-[#1a1a1a] dark:text-white">
  Wallet App
</h1>

<!-- Texto secundario -->
<p class="text-[15px] text-[#666666] dark:text-neutral-400">
  Gestiona tus finanzas
</p>

<!-- Label de formulario -->
<label class="text-[13px] font-medium text-[#666666] dark:text-neutral-300">
  Nombre
</label>
```

---

## Espaciado y Layout

### Padding
- Cards: `p-6` (24px) o `p-8` (32px)
- Botones: `px-4 py-3` (16px horizontal, 12px vertical)
- Inputs: `px-4 py-3`

### Gap entre elementos
- Stack vertical: `space-y-3` (12px) o `space-y-4` (16px)
- Horizontal: `gap-3` (12px)

### Márgenes
- Entre secciones: `mb-6` (24px) o `mb-8` (32px)
- Entre grupos: `mt-4` (16px)

---

## Efectos y Transiciones

### Backdrop Blur (Glassmorphism)

```css
backdrop-blur-md  /* Blur de 12px en el fondo */
```

Siempre usar con `bg-white/60` o similar para el efecto "vidrio".

### Sombras

```css
/* Sombra sutil para cards */
shadow-[0_8px_30px_rgba(0,0,0,0.12)]

/* Sombra para botones */
shadow-lg hover:shadow-xl
```

### Transiciones

```css
transition duration-200 ease-out
```

Aplicar a:
- Cambios de color/background
- Transformaciones (scale, translate)
- Sombras

### Hover Effects

```html
<!-- Botones interactivos -->
hover:bg-white/60
transform hover:scale-[0.98]

<!-- Cards clicables -->
hover:bg-white/10
transition duration-200 ease-out
```

---

## Bordes Redondeados

```css
rounded-2xl   → 16px (cards, botones, inputs) - ESTÁNDAR
rounded-full  → Completamente redondo (avatares, badges)
```

**Regla:** Todo debe tener esquinas redondeadas, el estándar es `rounded-2xl`.

---

## Estados de Elementos

### Disabled

```html
<button disabled
        class="opacity-50 cursor-not-allowed">
  Deshabilitado
</button>
```

### Loading

```html
<div class="text-[#22d3ee] dark:text-[#4da3ff] text-[15px]">
  Cargando...
</div>
```

### Error Messages

```html
<p class="mt-2 text-[13px] text-red-600 dark:text-red-400">
  Este campo es requerido
</p>
```

### Error Containers (Banners)

```html
<div class="bg-red-50/80 dark:bg-red-500/10
            backdrop-blur-md
            border-l-4 border-red-500
            p-4 rounded-2xl">
  <p class="text-[15px] font-semibold text-red-700 dark:text-red-300">
    Error principal
  </p>
  <p class="text-[13px] text-red-600 dark:text-red-400 mt-1">
    Descripción del error
  </p>
</div>
```

---

## Iconos y Gráficos

### Avatar Circle

```html
<div class="w-16 h-16
            bg-gradient-to-br from-[#22d3ee] to-[#22d3ee]
            dark:from-[#4da3ff] dark:to-[#22d3ee]
            rounded-full
            flex items-center justify-center
            shadow-lg">
  <span class="text-2xl font-bold text-white">A</span>
</div>
```

### Íconos SVG

Usar colores:
- Light: `text-[#666666]`
- Dark: `dark:text-neutral-400`

Tamaño estándar: `w-5 h-5` (20px)

---

## Layouts Responsivos

### Contenedor Central

```html
<div class="max-w-2xl mx-auto">
  <!-- Contenido -->
</div>
```

### Full Height Screen

```html
<div class="min-h-screen bg-[#f7f8fa] dark:bg-[#0b0d10]">
  <!-- Contenido -->
</div>
```

---

## Ejemplos Completos

### Card de Usuario

```html
<div class="bg-white/60 dark:bg-[rgba(26,29,36,0.6)]
            backdrop-blur-md rounded-2xl
            shadow-[0_8px_30px_rgba(0,0,0,0.12)]
            p-6 border border-white/30 dark:border-white/10">
  <h2 class="text-[13px] font-medium text-[#999999] dark:text-neutral-400
             uppercase tracking-wider mb-3">
    Usuario Actual
  </h2>
  <div class="flex items-center justify-between">
    <div>
      <p class="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">
        John Doe
      </p>
      <p class="text-[15px] text-[#666666] dark:text-neutral-400 mt-1">
        john@example.com
      </p>
    </div>
    <div class="w-16 h-16 bg-gradient-to-br from-[#22d3ee] to-[#22d3ee]
                dark:from-[#4da3ff] dark:to-[#22d3ee]
                rounded-full flex items-center justify-center shadow-lg">
      <span class="text-2xl font-bold text-white">J</span>
    </div>
  </div>
</div>
```

### Formulario Completo

```html
<form class="space-y-4">
  <div>
    <label class="block text-[13px] font-medium
                  text-[#666666] dark:text-neutral-300 mb-2">
      Nombre
    </label>
    <input type="text"
           class="w-full px-4 py-3
                  bg-white/40 dark:bg-white/5
                  backdrop-blur-md
                  border border-white/30 dark:border-white/20
                  rounded-2xl
                  text-[#1a1a1a] dark:text-white text-[15px]
                  placeholder-[#999999] dark:placeholder-neutral-500
                  focus:outline-none focus:ring-2
                  focus:ring-[#22d3ee] dark:focus:ring-[#4da3ff]
                  transition duration-200"
           placeholder="Tu nombre" />
  </div>

  <button type="submit"
          class="w-full px-4 py-3
                 bg-gradient-to-r from-[#22d3ee] to-[#22d3ee]
                 dark:from-[#4da3ff] dark:to-[#22d3ee]
                 rounded-2xl text-[15px] font-semibold text-white
                 shadow-lg hover:shadow-xl
                 transition duration-200 ease-out
                 transform hover:scale-[0.98]">
    Guardar
  </button>
</form>
```

---

## Checklist de Implementación

Al crear un nuevo componente, asegúrate de:

- [ ] Usa `bg-[#f7f8fa]` light y `dark:bg-[#0b0d10]` dark para fondos
- [ ] Cards con `bg-white/60` + `backdrop-blur-md` + `rounded-2xl`
- [ ] Colores de acento: `#22d3ee` (light) y `#4da3ff` (dark)
- [ ] Texto principal: `text-[#1a1a1a]` y `dark:text-white`
- [ ] Texto secundario: `text-[#666666]` y `dark:text-neutral-400`
- [ ] Transiciones: `transition duration-200 ease-out`
- [ ] Hover effects con `hover:scale-[0.98]` en botones
- [ ] Sombras suaves: `shadow-[0_8px_30px_rgba(0,0,0,0.12)]`
- [ ] Tamaño de texto base: `text-[15px]`
- [ ] Bordes: `border-white/30` light, `dark:border-white/10` dark

---

**Última actualización:** 11 de Noviembre, 2025
