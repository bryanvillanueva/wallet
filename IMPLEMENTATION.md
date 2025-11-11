# Wallet App - Implementación Fase 0 y 1

## Resumen

Se han implementado exitosamente la **Fase 0 (Health & Infra)** y **Fase 1 (Users)** del frontend de la Wallet App, siguiendo el roadmap técnico proporcionado.

## Estructura del Proyecto

```
src/
├── lib/
│   └── api.ts              # API layer con endpoints tipados (Fase 0 y 1)
├── stores/
│   └── useAuthStore.ts     # Zustand store para autenticación
├── components/
│   └── HealthBanner.tsx    # Banner de estado del backend
├── screens/
│   ├── Onboarding.tsx      # Pantalla de creación/selección de usuario
│   └── Settings.tsx        # Pantalla de configuración
├── App.tsx                 # Router principal
└── main.tsx
```

## Dependencias Instaladas

- `zustand` - State management con persistencia en localStorage
- `zod` - Validación de schemas (API inputs/outputs)
- `react-hook-form` - Manejo de formularios
- `@hookform/resolvers` - Integración zod + react-hook-form

## Implementación Detallada

### Fase 0: Health & Infra

**API Endpoints ([src/lib/api.ts](src/lib/api.ts)):**

- `GET /api/health` - Verifica que el backend está vivo
- `GET /api/db-ping` - Valida conexión con MySQL

**Componentes:**

- **HealthBanner** ([src/components/HealthBanner.tsx](src/components/HealthBanner.tsx))
  - Verifica el estado del backend cada 30 segundos
  - Muestra un banner rojo si el backend no responde
  - Se oculta automáticamente cuando todo funciona bien

### Fase 1: Users

**API Endpoints ([src/lib/api.ts](src/lib/api.ts)):**

- `POST /api/users` - Crea un nuevo usuario
- `GET /api/users/:id` - Obtiene un usuario por ID
- `GET /api/users` - Lista todos los usuarios (opcional)

**Schemas de Validación:**

```typescript
// Input para crear usuario
CreateUserInputSchema = {
  name: string (min 2 caracteres)
  email?: string | null (email válido)
}

// Response de creación
CreateUserResponseSchema = {
  id: number
}

// Usuario completo
UserSchema = {
  id: number
  name: string
  email?: string | null
  created_at?: string
}
```

**State Management:**

- **useAuthStore** ([src/stores/useAuthStore.ts](src/stores/useAuthStore.ts))
  - `activeUserId: number | null` - ID del usuario activo
  - `setActiveUserId(userId)` - Establece el usuario activo
  - `clearActiveUser()` - Cierra sesión
  - Persistencia automática en `localStorage`

**Pantallas:**

1. **Onboarding** ([src/screens/Onboarding.tsx](src/screens/Onboarding.tsx))
   - Lista de usuarios existentes (si hay)
   - Formulario para crear nuevo usuario
   - Validación con Zod + React Hook Form
   - Selección de usuario activo
   - Design iOS Liquid con gradientes y blur

2. **Settings** ([src/screens/Settings.tsx](src/screens/Settings.tsx))
   - Muestra información del usuario actual
   - Avatar con inicial del nombre
   - Botón para cambiar de usuario (cierra sesión)
   - Placeholders para Export/Import (fases futuras)

## Design System: iOS 26.01 Liquid

### Principios Aplicados

- **Superficies fluidas**: `bg-white/10 backdrop-blur-md`
- **Bordes suaves**: `rounded-2xl`
- **Gradientes**: `bg-gradient-to-b from-[#0b0d10] to-[#1a1d24]`
- **Acento**: `#4da3ff` (azul líquido) y `#22d3ee` (cian)
- **Sombras**: `shadow-lg` con profundidad sutil
- **Tipografía**: `text-[15px]` base, títulos con `font-semibold`
- **Transiciones**: `duration-200 ease-out` + `hover:scale-[0.98]`

### Ejemplos de Estilos

```css
/* Card principal */
bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20

/* Botón primario */
bg-gradient-to-r from-[#4da3ff] to-[#22d3ee] rounded-2xl shadow-lg

/* Input */
bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl focus:ring-2 focus:ring-[#4da3ff]
```

## Flujo de Usuario

1. **Primera vez (sin usuario)**
   - Muestra pantalla de Onboarding
   - Usuario crea su cuenta con nombre (requerido) y email (opcional)
   - Al crear, se establece como `activeUserId` y se persiste
   - Redirige automáticamente a Settings

2. **Usuario existente**
   - Si hay `activeUserId` en localStorage, muestra Settings
   - HealthBanner verifica el backend en segundo plano
   - Puede cambiar de usuario desde Settings (vuelve a Onboarding)

3. **Seleccionar usuario existente**
   - Desde Onboarding, lista todos los usuarios
   - Click en un usuario lo establece como activo
   - Redirige a Settings

## Configuración de Entorno

Crear un archivo `.env` en la raíz (ver [.env.example](.env.example)):

```env
# Producción (default)
VITE_API_BASE=https://wallet-api-production-2e8a.up.railway.app/api

# Desarrollo local (descomentar si tienes backend local)
# VITE_API_BASE=http://localhost:4000/api
```

## Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Lint
npm run lint
```

## Estado Actual

### ✅ Completado

- [x] Fase 0: Health & Infra
  - [x] API endpoints (`/health`, `/db-ping`)
  - [x] HealthBanner component
  - [x] Wrapper de fetch con manejo de errores

- [x] Fase 1: Users
  - [x] API endpoints (`POST /users`, `GET /users/:id`, `GET /users`)
  - [x] Schemas Zod para validación
  - [x] useAuthStore con Zustand + persistencia
  - [x] Pantalla Onboarding (crear/seleccionar usuario)
  - [x] Pantalla Settings (info usuario + logout)
  - [x] Design System iOS Liquid implementado

### 🔄 Próximas Fases

- [ ] Fase 2: Accounts (cuentas)
- [ ] Fase 3: Categories (categorías)
- [ ] Fase 4: Pay Periods (quincenas)
- [ ] Fase 5: Transactions (transacciones)
- [ ] Fase 6: Planned Payments (pagos planificados)
- [ ] Fase 7: Savings (ahorros)
- [ ] Fase 8: Saving Goals (metas)
- [ ] Fase 9: Summary (resumen)
- [ ] Fase 10: Export/Import

## Notas Técnicas

### Manejo de Errores

- Todos los endpoints validan respuestas con Zod
- `ApiError` custom con status code y data
- Formularios muestran errores específicos por campo
- Mensajes de error amigables en español

### Performance

- Validación de salud cada 30 segundos (no bloquea UI)
- Estado persistido en localStorage (carga instantánea)
- Lazy loading preparado para rutas futuras

### Accesibilidad

- Labels semánticos en formularios
- Estados disabled claros
- Mensajes de error asociados a inputs
- Contraste de color adecuado (dark mode)

---

**Implementado el:** 11 de Noviembre, 2025
**Versión:** 0.1.0
