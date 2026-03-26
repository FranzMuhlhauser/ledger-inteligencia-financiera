# Guía de Configuración - Ledger Inteligencia Financiera

## 🚀 Configuración Rápida

### Paso 1: Crear proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta
2. Haz clic en **"New Project"**
3. Completa la información:
   - **Name**: ledger-financiero (o el que prefieras)
   - **Database Password**: Guarda esta contraseña en un lugar seguro
   - **Region**: Elige la más cercana a tu ubicación
4. Haz clic en **"Create new project"**

### Paso 2: Configurar la base de datos

1. Una vez creado el proyecto, ve a **"SQL Editor"** en el menú lateral
2. Haz clic en **"New query"**
3. Copia y pega el contenido del archivo `supabase-schema.sql`
4. Haz clic en **"Run"** para ejecutar el script

Esto creará:
- ✅ La tabla `invoices` para almacenar tus facturas
- ✅ Índices para consultas rápidas
- ✅ Políticas de seguridad (RLS) para que cada usuario solo vea sus datos

### Paso 3: Configurar autenticación

1. Ve a **"Authentication"** → **"Providers"**
2. Asegúrate de que **"Email"** esté habilitado
3. **Importante - Email de confirmación**:
   - Por defecto, Supabase requiere confirmar el email
   - Para desarrollo local, puedes desactivarlo:
     - Ve a **Authentication** → **Settings** → **Email Auth**
     - Desactiva **"Confirm email"** (solo para desarrollo)
   - **Para producción**: Déjalo activado y configura el template del email
4. (Opcional) Configura otros providers como Google, GitHub, etc.

### Paso 4: Obtener credenciales

1. Ve a **"Project Settings"** (engranaje abajo a la izquierda)
2. Haz clic en **"API"**
3. Copia los siguientes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (clave larga que empieza con "eyJ")

### Paso 5: Configurar variables de entorno

1. En la carpeta del proyecto, crea un archivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y pega tus credenciales:
   ```env
   VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
   VITE_SUPABASE_ANON_KEY="tu-clave-anon"
   ```

### Paso 6: Instalar y ejecutar

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

¡Listo! Ahora puedes:
- 📝 **Registrarte** con tu email y contraseña
- 🔐 **Iniciar sesión** con tus credenciales
- 💾 **Guardar facturas** que se almacenarán en la nube
- 📊 **Ver tus datos** desde cualquier dispositivo

---

## 📝 Notas Importantes

### Seguridad

- Las políticas RLS aseguran que cada usuario solo pueda ver/editar sus propias facturas
- Nunca compartas tu `SUPABASE_ANON_KEY` en repositorios públicos
- El archivo `.env.local` está en `.gitignore`, así que no se subirá a GitHub

### Respaldo de datos

- Tus datos están almacenados en Supabase (PostgreSQL)
- Puedes exportarlos desde el Dashboard de Supabase
- Los datos de localStorage ya no se usan, todo está en la nube

### Solución de problemas

**Error: "Missing Supabase environment variables"**
- Verifica que el archivo `.env.local` exista
- Asegúrate de que las variables se llamen `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- Reinicia el servidor de desarrollo después de cambiar las variables

**Error: "Invalid API key"**
- Verifica que copiaste correctamente la clave `anon/public` (no la `service_role`)
- Asegúrate de que no haya espacios extra al copiar

**Las facturas no se guardan**
- Verifica que ejecutaste el script SQL en Supabase
- Revisa la consola del navegador para ver errores
- Asegúrate de haber iniciado sesión en la aplicación

---

## 🎯 Siguientes pasos

1. **Personaliza tu perfil**: Ve a Ajustes y sube tu logo y foto
2. **Configura tu empresa**: Actualiza el nombre y rol
3. **Ajusta el IVA**: Configura la tasa de impuesto de tu país
4. **Registra tu primera factura**: ¡Comienza a gestionar tus finanzas!

---

## 📞 Soporte

Si tienes problemas, revisa:
- La consola del navegador (F12) para ver errores
- El Dashboard de Supabase para verificar que las tablas se crearon
- Que tu conexión a internet esté funcionando (Supabase requiere conexión)
