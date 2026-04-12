# Money Manager

Money Manager is a clean, modern web app for tracking your monthly budget and expenses with zero setup friction.

Set your budget, log expenses by category, and instantly see how much you have left.

Built for speed, clarity, and everyday use.

## Features

- Local-first by design (no account required)
- Set and update a monthly budget
- Add expenses with name, category, and amount
- Remove expenses instantly
- Live budget breakdown: Budget, Spent, Left
- Category totals overview
- Browser persistence via local storage
- Responsive UI for desktop and mobile

## How It Works

The app runs entirely in your browser using Next.js frontend pages.

- No backend server logic is required for data storage
- No external database is used
- Your budget and expenses are saved in browser local storage

This means your data stays on your own device and is not uploaded to a remote database.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## App Routes

- /: landing page
- /dashboard: budget and expense tracker

## Local Development

If you want to modify or extend the project:

1. Clone the repository
2. Run npm install
3. Run npm run dev
4. Open http://localhost:3000

## Data & Privacy

- Data is stored in local storage on the current browser/device only
- Clearing browser storage will remove saved budget and expenses
- Data does not sync across devices

## Contributing

Pull requests are welcome for meaningful improvements such as:

- UI/UX enhancements
- New budgeting features
- Performance and code quality improvements
- Better mobile experience

For very small text-only changes, open an issue first.
