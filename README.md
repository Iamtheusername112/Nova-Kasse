# Nova Kasse - Banking App

A modern banking application built with Next.js, Tailwind CSS, Shadcn UI, and Supabase.

## Features

- **Profile Management**: View and edit user profile, achievements, and settings
- **Expense Tracking**: Monitor card balance, income, expenses, and spending breakdown
- **Budget Management**: Track budgets with visual progress indicators
- **Wallet**: View credit card details and manage transactions
- **Onboarding**: User-friendly onboarding flow

## Tech Stack

- **Next.js 16** - React framework
- **JavaScript** - No TypeScript
- **Tailwind CSS 4** - Styling
- **Shadcn UI** - UI components
- **Supabase** - Backend and authentication
- **Lucide React** - Icons
- **Sonner** - Notifications

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See [docs/ENV_SETUP.md](./docs/ENV_SETUP.md) for detailed instructions on getting your Supabase credentials.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

- `/` - Home (Your Budgets)
- `/profile` - User Profile
- `/expenses` - Expenses Tracking
- `/wallet` - Wallet & Credit Card
- `/onboarding` - Onboarding Screen
- `/login` - Login Page
- `/signup` - Sign Up Page
- `/add` - Add Transaction

## Project Structure

```
├── app/                      # Next.js app directory (pages & routes)
│   ├── page.js              # Home page
│   ├── profile/             # Profile page
│   ├── expenses/            # Expenses page
│   ├── wallet/              # Wallet page
│   ├── onboarding/          # Onboarding page
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── add/                 # Add transaction page
│   ├── layout.js            # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Shadcn UI components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   └── tabs.jsx
│   ├── layout/              # Layout components
│   │   ├── Header.jsx
│   │   └── BottomNavigation.jsx
│   └── auth/                # Authentication components
│       └── ProtectedRoute.jsx
├── contexts/                # React contexts
│   └── AuthContext.jsx      # Authentication context
├── lib/                     # Utility libraries
│   ├── utils/               # Utility functions
│   │   └── index.js         # cn() helper for className merging
│   ├── supabase/            # Supabase configuration
│   │   ├── client.js        # Supabase client instance
│   │   ├── setup.sql        # Database setup SQL
│   │   └── index.js         # Re-exports
│   └── hooks/               # Custom React hooks (future)
├── docs/                    # Documentation
│   ├── ENV_SETUP.md         # Environment setup guide
│   ├── SUPABASE_SETUP.md    # Supabase configuration guide
│   └── SUPABASE_DATA_STORAGE.md  # Data storage documentation
├── public/                  # Static assets
└── package.json             # Dependencies
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Add them to your `.env.local` file
4. Set up your database schema as needed

## License

MIT
# Nova-Kasse
