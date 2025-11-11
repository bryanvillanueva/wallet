# Glassmorphism / Liquid Glass Design System

## 🎨 Concepto

Diseño basado en **Glassmorphism** (efecto de vidrio líquido) con alta transparencia, blur intenso, bordes luminosos y elementos flotantes con profundidad.

Inspirado en:
- iOS 26.01 Liquid Glass
- Diseños modernos con efecto de vidrio esmerilado
- Interfaces translúcidas con saturación de color

---

## 🌈 Fondos con Gradientes

### Light Mode
```css
bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#dbeafe]
```
Tonos: Azul cielo muy claro → Blanco azulado → Azul pálido

### Dark Mode
```css
dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0c4a6e]
```
Tonos: Azul marino profundo → Gris azulado → Azul oscuro

**Por qué gradientes:** El efecto de vidrio solo funciona si hay algo visual detrás. Los gradientes crean profundidad y hacen que el blur sea visible.

---

## 🪟 Elementos Glass

### Cards Principales (`.glass-card-light` / `.glass-card-dark`)

**Light Mode:**
```css
.glass-card-light {
  background: rgba(255, 255, 255, 0.25);  /* 25% opacidad */
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

**Dark Mode:**
```css
.glass-card-dark {
  background: rgba(15, 15, 20, 0.3);  /* 30% opacidad */
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
}
```

**Uso:**
```html
<div class="glass-card-light dark:glass-card-dark rounded-3xl p-8">
  <!-- Contenido -->
</div>
```

**Características clave:**
- ✨ **Alta transparencia** (25-30%)
- 🌫️ **Blur extremo** (30px)
- 🎨 **Saturación aumentada** (180-200%)
- 💎 **Bordes translúcidos brillantes**
- 🌊 **Sombras difusas grandes**

---

### Botones Glass (`.glass-button`)

```css
.glass-button {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease-out;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 24px 0 rgba(31, 38, 135, 0.2);
  transform: translateY(-2px);
}
```

**Uso:**
```html
<button class="glass-button rounded-2xl p-4
               transition-all duration-300
               hover:-translate-y-1">
  Botón
</button>
```

**Efectos hover:**
- 📈 Aumenta opacidad del fondo
- 💡 Bordes más brillantes
- ⬆️ Levita (`translateY(-2px)` o `translateY(-1px)`)
- ✨ Sombra más visible

---

### Inputs Glass (`.glass-input`)

```css
.glass-input {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.5);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}
```

**Uso:**
```html
<input type="text"
       class="glass-input w-full px-4 py-3 rounded-2xl
              text-[#1a1a1a] dark:text-white
              placeholder-[#999] dark:placeholder-neutral-400
              focus:outline-none transition-all duration-300" />
```

**Focus state:**
- 🎯 Borde con color acento + glow
- 💫 Sombra luminosa del color acento
- 🔆 Fondo ligeramente más opaco

---

## 🎨 Paleta de Colores

### Acentos

```css
--color-accent-light: #22d3ee;  /* Cyan brillante */
--color-accent-dark: #4da3ff;   /* Azul vivo */
```

### Botones Primarios

**Light Mode:**
```css
bg-gradient-to-r from-[#22d3ee] to-[#06b6d4]
shadow-[0_8px_30px_rgba(34,211,238,0.4)]
hover:shadow-[0_12px_40px_rgba(34,211,238,0.6)]
```

**Dark Mode:**
```css
dark:from-[#4da3ff] dark:to-[#3b82f6]
dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)]
dark:hover:shadow-[0_12px_40px_rgba(77,163,255,0.6)]
```

### Avatares/Círculos

```html
<div class="w-16 h-16
            bg-gradient-to-br from-[#22d3ee] to-[#06b6d4]
            dark:from-[#4da3ff] dark:to-[#3b82f6]
            rounded-full
            shadow-[0_8px_30px_rgba(34,211,238,0.5)]
            dark:shadow-[0_8px_30px_rgba(77,163,255,0.5)]">
</div>
```

---

## 📐 Bordes y Radios

```css
rounded-2xl   /* 16px - Estándar para botones/inputs */
rounded-3xl   /* 24px - Cards grandes */
rounded-full  /* Círculos completos */
```

**Regla:** Usar radios generosos para mantener el look suave y fluido.

---

## ✨ Efectos y Transiciones

### Backdrop Filter (Clave del Glassmorphism)

```css
backdrop-filter: blur(30px) saturate(200%);
-webkit-backdrop-filter: blur(30px) saturate(200%); /* Safari */
```

- **`blur(30px)`**: Desenfoque intenso del fondo
- **`saturate(200%)`**: Aumenta saturación de colores detrás del vidrio
- Siempre incluir prefijo `-webkit-` para compatibilidad Safari

### Sombras Difusas

```css
/* Cards */
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);

/* Botones hover */
box-shadow: 0 8px 24px 0 rgba(31, 38, 135, 0.2);

/* Elementos con glow */
shadow-[0_8px_30px_rgba(34,211,238,0.4)]
```

**Características:**
- Desplazamiento Y grande (8px+)
- Blur muy grande (24-32px)
- Opacidad baja (0.1-0.4)
- Colores según elemento

### Transiciones Suaves

```css
transition: all 0.3s ease-out;
transition-all duration-300 ease-out
```

- Duración: 300ms (más lento que normal para efecto flotante)
- Easing: `ease-out` (natural y suave)
- Aplicar a: background, border, transform, box-shadow

### Hover Effects

```css
/* Levitar */
hover:-translate-y-1      /* Sube 4px */
hover:-translate-y-2      /* Sube 8px */

/* Escalar (menos común en glass) */
hover:scale-[1.02]
```

---

## 📋 Componentes Ejemplo

### Card de Usuario

```html
<div class="glass-card-light dark:glass-card-dark rounded-3xl p-6">
  <h2 class="text-[13px] font-medium text-[#666] dark:text-neutral-400
             uppercase tracking-wider mb-4">
    Usuario Actual
  </h2>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">
        John Doe
      </p>
      <p class="text-[15px] text-[#666] dark:text-neutral-300 mt-1">
        john@example.com
      </p>
    </div>

    <div class="w-16 h-16
                bg-gradient-to-br from-[#22d3ee] to-[#06b6d4]
                dark:from-[#4da3ff] dark:to-[#3b82f6]
                rounded-full flex items-center justify-center
                shadow-[0_8px_30px_rgba(34,211,238,0.5)]
                dark:shadow-[0_8px_30px_rgba(77,163,255,0.5)]">
      <span class="text-2xl font-bold text-white">J</span>
    </div>
  </div>
</div>
```

### Botón Interactivo

```html
<button class="glass-button rounded-2xl p-4
               text-left flex items-center justify-between
               transition-all duration-300 ease-out
               hover:-translate-y-1">
  <span class="text-[15px] font-medium text-[#1a1a1a] dark:text-white">
    Cambiar de usuario
  </span>
  <svg class="w-5 h-5 text-[#666] dark:text-neutral-400">
    <!-- Icon -->
  </svg>
</button>
```

### Input con Glass Effect

```html
<div>
  <label class="block text-[13px] font-medium
                text-[#555] dark:text-neutral-300 mb-2">
    Nombre
  </label>
  <input type="text"
         class="glass-input w-full px-4 py-3 rounded-2xl
                text-[#1a1a1a] dark:text-white text-[15px]
                placeholder-[#999] dark:placeholder-neutral-400
                focus:outline-none transition-all duration-300"
         placeholder="Tu nombre" />
</div>
```

### Botón Primario con Glow

```html
<button class="px-4 py-3
               bg-gradient-to-r from-[#22d3ee] to-[#06b6d4]
               dark:from-[#4da3ff] dark:to-[#3b82f6]
               rounded-2xl text-[15px] font-semibold text-white
               shadow-[0_8px_30px_rgba(34,211,238,0.4)]
               dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)]
               hover:shadow-[0_12px_40px_rgba(34,211,238,0.6)]
               dark:hover:shadow-[0_12px_40px_rgba(77,163,255,0.6)]
               transition-all duration-300 ease-out
               hover:-translate-y-1">
  Crear usuario
</button>
```

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

- ✨ Usa fondos con **gradientes ricos** para que el blur sea visible
- 🪟 **Alta transparencia** (10-30%) en elementos glass
- 🌫️ **Blur intenso** (20-30px) para el efecto de vidrio
- 💎 **Bordes translúcidos brillantes** (rgba blanco 0.2-0.5)
- ⬆️ **Hover con levitación** (-translate-y)
- ✨ **Sombras con glow** en botones primarios
- 🎨 **Saturación aumentada** en backdrop-filter
- 🔄 **Transiciones lentas** (300ms) para sensación flotante

### ❌ DON'T (No hacer)

- ❌ Fondos planos o sólidos (el glass no se ve)
- ❌ Opacidad muy alta (>50%) - pierde efecto vidrio
- ❌ Blur pequeño (<15px) - no parece vidrio
- ❌ Bordes opacos o muy gruesos
- ❌ Transiciones rápidas (<200ms) - pierde fluidez
- ❌ Scale en hover (preferir translate)
- ❌ Colores muy saturados en backgrounds glass

---

## 🔧 Troubleshooting

### El efecto glass no se ve

**Problema:** Fondo muy claro o sin contraste
**Solución:** Usar gradientes con varios tonos, añadir imágenes de fondo

### Blur no funciona en Safari

**Problema:** Falta prefijo `-webkit-`
**Solución:** Siempre incluir:
```css
backdrop-filter: blur(30px);
-webkit-backdrop-filter: blur(30px);
```

### Bordes se ven muy marcados

**Problema:** Opacidad del borde muy alta
**Solución:** Usar `rgba(255, 255, 255, 0.2)` o menos

### Elementos se ven planos

**Problema:** Falta sombra o profundidad
**Solución:** Añadir `box-shadow` grande y difusa

---

## 📱 Responsividad

Los efectos glass funcionan igual en todos los tamaños, pero considera:

```css
/* Mobile: Blur más sutil */
@media (max-width: 640px) {
  .glass-card {
    backdrop-filter: blur(20px);
  }
}

/* Desktop: Blur más intenso */
@media (min-width: 1024px) {
  .glass-card {
    backdrop-filter: blur(35px);
  }
}
```

---

## 🎨 Inspiración Visual

El diseño está inspirado en:
1. **Interfaces iOS modernas** - Control Center, Widgets
2. **Windows 11 Acrylic** - Materiales translúcidos
3. **macOS Big Sur+** - Efectos de profundidad
4. **Diseños de Behance/Dribbble** - Liquid glass concepts

---

**Actualizado:** 11 de Noviembre, 2025
**Versión:** 2.0 (Glassmorphism)
