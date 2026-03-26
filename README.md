<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Ledger - Inteligencia Financiera

Aplicación de gestión financiera con autenticación y persistencia de datos en la nube.

## Características

- 🔐 **Autenticación de usuarios** con Supabase
- 💾 **Persistencia en la nube** - Tus datos se guardan y sincronizan
- 📊 **Panel de control** con métricas financieras
- 📝 **Gestión de facturas** - Registro y seguimiento de gastos
- 📈 **Análisis detallado** con gráficos y tendencias
- ⚙️ **Ajustes personalizables** - Empresa, impuestos y perfil

## Run Locally

**Prerequisites:** Node.js

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Go to SQL Editor and run the SQL from `supabase-schema.sql`
4. Enable Email/Password authentication:
   - Go to Authentication → Providers
   - Enable "Email" provider

### 3. Configure environment variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to Project Settings → API
   - Copy the **Project URL** to `VITE_SUPABASE_URL`
   - Copy the **anon/public key** to `VITE_SUPABASE_ANON_KEY`

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 4. Run the app

```bash
npm run dev
```

## Deployment

### Deploy with Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard

### Deploy with Netlify

1. Connect your repository to Netlify
2. Add environment variables in Netlify dashboard
3. Deploy

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Animations:** Motion
- **Charts:** Recharts
- **Backend & Auth:** Supabase
- **Icons:** Lucide React

## Project Structure

```
├── src/
│   ├── App.tsx              # Main application component
│   ├── LoginPage.tsx        # Login/Register page
│   ├── main.tsx             # Entry point
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   └── lib/
│       └── supabase.ts      # Supabase client
├── supabase-schema.sql      # Database schema
├── .env.example             # Environment variables template
└── package.json
```

## View in AI Studio

https://ai.studio/apps/5830a017-3178-4bce-945f-34e94d32ca06
