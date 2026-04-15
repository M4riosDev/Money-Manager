# Money Manager

Money Manager is a clean, modern web app for tracking your monthly budget and expenses with zero setup friction.

Set your budget, log expenses by category, and instantly see how much you have left.

Built for speed, clarity, and everyday use.

## Features

- Supabase email/password authentication
- Protected dashboard route (login required)
- Finance data stored in Supabase Postgres with RLS
- Set and update a monthly budget
- Add expenses with name, category, and amount
- Remove expenses instantly
- Live budget breakdown: Budget, Spent, Left
- Category totals overview
- Browser persistence via local storage
- Responsive UI for desktop and mobile

## How It Works

The app uses Next.js with Supabase authentication and stores finance data in Supabase Postgres.

- Authentication is handled by Supabase Auth
- User session is managed with secure cookies
- Budget and expenses are stored per user in Supabase
- Supabase row-level security ensures only the signed-in user can access their vault row

## Quick Start

```bash
npm install
npm run dev
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Open http://localhost:3000

To create the database table and security policies, run the SQL in [supabase/finance_vault.sql](supabase/finance_vault.sql) in the Supabase SQL editor.

## App Routes

- /: landing page
- /login: login and signup page
- /dashboard: budget and expense tracker

## Local Development

If you want to modify or extend the project:

1. Clone the repository
2. Run npm install
3. Run npm run dev
4. Open http://localhost:3000

## Data & Privacy

- Login uses Supabase Auth for identity and session management
- Data is stored in Supabase Postgres, protected by RLS
- Logging out ends the authenticated session
- Data does not sync across devices unless you sign in to the same account

## Contributing

Pull requests are welcome for meaningful improvements such as:

- UI/UX enhancements
- New budgeting features
- Performance and code quality improvements
- Better mobile experience

For very small text-only changes, open an issue first.
