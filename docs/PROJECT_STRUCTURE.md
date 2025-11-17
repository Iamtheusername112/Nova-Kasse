# Project Structure Guide

This document explains the folder architecture and organization of the Nova Kasse banking app.

## Directory Overview

### `/app` - Next.js App Directory
Contains all pages and routes using Next.js 13+ App Router.

- **`page.js`** - Home page (Your Budgets)
- **`layout.js`** - Root layout with providers
- **`globals.css`** - Global styles and Tailwind configuration
- **`/[feature]/page.js`** - Feature-specific pages

### `/components` - React Components

Organized by purpose:

#### `/components/ui` - Shadcn UI Components
Reusable UI primitives from Shadcn UI library:
- `button.jsx` - Button component
- `card.jsx` - Card component
- `tabs.jsx` - Tabs component

#### `/components/layout` - Layout Components
Components used across multiple pages:
- `Header.jsx` - Page header with title and actions
- `BottomNavigation.jsx` - Bottom navigation bar

#### `/components/auth` - Authentication Components
Components related to authentication:
- `ProtectedRoute.jsx` - Route protection wrapper

### `/contexts` - React Contexts
Global state management:
- `AuthContext.jsx` - Authentication state and methods

### `/lib` - Utility Libraries

#### `/lib/utils` - Utility Functions
- `index.js` - Common utilities (e.g., `cn()` for className merging)

#### `/lib/supabase` - Supabase Configuration
- `client.js` - Supabase client initialization
- `setup.sql` - Database schema and setup scripts
- `index.js` - Re-exports for convenience

#### `/lib/hooks` - Custom React Hooks
Placeholder for future custom hooks (e.g., `useProfile`, `useTransactions`)

### `/docs` - Documentation
Project documentation:
- `ENV_SETUP.md` - Environment variables setup
- `SUPABASE_SETUP.md` - Supabase configuration guide
- `SUPABASE_DATA_STORAGE.md` - Data storage documentation
- `PROJECT_STRUCTURE.md` - This file

### `/public` - Static Assets
Static files served at the root:
- Images, icons, fonts, etc.

## Import Paths

The project uses path aliases configured in `jsconfig.json`:

- `@/components/*` → `/components/*`
- `@/lib/*` → `/lib/*`
- `@/contexts/*` → `/contexts/*`
- `@/app/*` → `/app/*`

### Examples

```javascript
// Layout components
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";

// UI components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Auth components
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Utilities
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

// Contexts
import { useAuth } from "@/contexts/AuthContext";
```

## Adding New Features

### Adding a New Page
1. Create `app/[feature-name]/page.js`
2. Use layout components from `@/components/layout`
3. Protect with `ProtectedRoute` if needed

### Adding a New Component
1. Determine category:
   - **UI component** → `/components/ui/[ComponentName].jsx`
   - **Layout component** → `/components/layout/[ComponentName].jsx`
   - **Feature-specific** → `/components/[feature]/[ComponentName].jsx`

### Adding a New Utility
1. Add to `/lib/utils/index.js` or create new file
2. Export from appropriate location
3. Import using `@/lib/utils`

### Adding a New Context
1. Create file in `/contexts/[ContextName].jsx`
2. Export hook (e.g., `useContextName`)
3. Add provider to `app/layout.js`

## Best Practices

1. **Keep components focused** - One responsibility per component
2. **Use consistent naming** - PascalCase for components, camelCase for utilities
3. **Organize by feature** - Group related components together
4. **Document complex logic** - Add comments for non-obvious code
5. **Follow the structure** - Don't create files in root unless necessary

## Future Structure Additions

As the app grows, consider adding:

- `/components/features/` - Feature-specific components
  - `/components/features/transactions/`
  - `/components/features/budgets/`
  - `/components/features/wallet/`

- `/lib/services/` - API service functions
  - `transactions.js`
  - `budgets.js`
  - `users.js`

- `/lib/constants/` - App constants
  - `routes.js`
  - `config.js`

- `/lib/validations/` - Form validation schemas

