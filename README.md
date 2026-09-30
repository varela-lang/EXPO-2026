# 🚀 Expo Investment

Mercado de inversión virtual y validación de clientes (*Customer Tokens*) diseñado específicamente para **Expos de Logros y Ferias Científicas / Universitarias**.

Permite que cada visitante reciba **$10,000 de capital virtual** para invertir en los stands estudiantiles y entregar **Customer Tokens** a los proyectos que compraría o utilizaría en la vida real. Incluye un **Tablero en Vivo para la Gran Pantalla del Escenario** con actualizaciones en tiempo real mediante **Supabase Realtime**.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, Vite, JavaScript / JSX, React Router, Tailwind CSS, Lucide React, qrcode.react, canvas-confetti.
- **Backend & Base de Datos**: Supabase (PostgreSQL, Supabase Auth, Supabase Realtime, Row Level Security, RPC Functions).

---

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm o pnpm
- Una cuenta gratuita en [Supabase](https://supabase.com) (para conexión en la nube)

---

## 🚀 Instalación y Ejecución Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

> **Nota:** La aplicación incluye un modo demostración local totalmente interactivo que permite probar todas las inversiones, tokens, panel de administración y pantalla de escenario de forma inmediata incluso antes de configurar Supabase.

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto llamado `Expo Investment`.
2. Dirígete a **Project Settings** -> **API** y copia:
   - **Project URL**
   - **anon / public key**

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key-aqui
```

*Alternativa directa desde la UI:* También puedes pulsar el botón **"Modo Demo / Supabase"** en la barra superior de la app e ingresar las credenciales directamente en el navegador.

---

## 📜 Cómo Ejecutar el SQL en Supabase

En tu panel de Supabase, ve a la sección **SQL Editor** y ejecuta los scripts en el siguiente orden:

1. **`supabase/schema.sql`**:
   - Crea las tablas `profiles`, `projects`, `investments`, `customer_tokens` y `transactions`.
   - Activa Row Level Security (RLS) y sus políticas de seguridad.
   - Crea las vistas `project_stats` y `expo_stats`.
   - Crea el trigger automático que otorga los **$10,000 iniciales** a cada nuevo visitante registrado.

2. **`supabase/functions.sql`**:
   - Crea la función atómica PostgreSQL RPC `make_investment(project_id, amount)`.
   - Crea la función atómica PostgreSQL RPC `give_customer_token(project_id)`.
   - Habilita las tablas en la publicación `supabase_realtime` para el tablero en vivo.

3. **`supabase/seed.sql`**:
   - Inserta los proyectos iniciales de prueba (EcoTech, RoboSmart, GreenApp, SmartHome, AgroVision, BioHealth).

---

## 🛡️ Cómo Crear el Primer Administrador

1. Regístrate normalmente desde `/registro` con tu correo y contraseña.
2. Abre el **Table Editor** en Supabase, selecciona la tabla `profiles` y busca tu fila.
3. Cambia el campo `role` de `'visitor'` a `'admin'`.
4. ¡Listo! Al recargar la app tendrás acceso total a `/admin`.

---

## 🏷️ Cómo Crear Proyectos y Generar Códigos QR

1. Ingresa a `/admin`.
2. Pulsa en **"Nuevo Proyecto"**, completa el nombre, equipo, categoría y descripción.
3. En la pestaña **"Generador de Códigos QR"**:
   - **QR de Entrada General (`/registro`):** Imprímelo en gran tamaño para la entrada de la Expo. Los asistentes lo escanean al llegar para obtener sus $10,000.
   - **QR de Stands (`/proyecto/{id}`):** Descarga el PNG o imprime la tarjeta para colocarla en la mesa de cada equipo participante.

---

## 📺 Cómo Abrir el Dashboard en la Pantalla del Escenario

1. Abre la ruta `/dashboard`.
2. Haz clic en el botón **"Pantalla Completa"** o presiona `F11`.
3. El tablero se actualizará al instante con cada inversión o Customer Token recibido, reproduciendo animaciones emergentes y resaltando el stand beneficiado.

---

## 📦 Despliegue en Producción

Compila el frontend para producción:
```bash
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/`, listos para desplegar en Vercel, Netlify, Cloud Run o Supabase Hosting.
