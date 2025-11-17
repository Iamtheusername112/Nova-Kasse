# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get Supabase Credentials

1. **Create a Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up or log in

2. **Create a New Project**
   - Click "New Project"
   - Fill in your project details (name, database password, region)
   - Wait for the project to be created (takes a few minutes)

3. **Get Your Credentials**
   - Go to your project dashboard
   - Click on "Settings" (gear icon) in the left sidebar
   - Click on "API" under Project Settings
   - You'll find:
     - **Project URL** → Use this for `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → Use this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Add to .env.local**
   - Create a file named `.env.local` in the root directory
   - Copy the example above and replace the placeholder values with your actual credentials
   - Example:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example
     ```

## Important Notes

- **Never commit `.env.local` to git** - It's already in `.gitignore`
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose these variables to the browser
- Restart your dev server after creating/updating `.env.local`
- For production, add these same variables to your hosting platform's environment variables settings

## Current Usage

These environment variables are used in:
- `lib/supabase/client.js` - Supabase client initialization
- Future authentication and database operations

## Optional: Without Supabase

If you want to run the app without Supabase initially (for UI development only), you can leave the values empty or use placeholder values. However, authentication and data persistence features won't work until Supabase is properly configured.

