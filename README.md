# Forex Practice - Smart Money Concepts Trading

A web application for practicing forex trading using Smart Money Concepts. Learn to predict price direction using real market data with Fair Value Gap (FVG) analysis.

## Features

- **Multiple Currency Support** - Practice with EUR/USD and XAU/USD (Gold)
- **Difficulty Levels** - Choose between 50, 100, or 200 candles
- **Smart Money Concepts** - Fair Value Gap (FVG) visualization
- **Score Tracking** - Track your accuracy across different difficulty levels
- **Structure Analysis** - Get explanations after each prediction
- **Responsive Design** - Works on desktop and mobile

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Clerk credentials

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (optional - for future features)
DATABASE_URL=postgresql://...
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main practice page
│   ├── layout.tsx            # Root layout with metadata
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn components
│   ├── practice/
│   │   ├── chart.tsx         # Candlestick chart component
│   │   ├── practice-game.tsx  # Main game logic
│   │   ├── score-card.tsx    # Score display component
│   │   └── structure.ts       # Structure detection utilities
│   └── ...
├── db/
│   ├── EURUSD.json           # EUR/USD market data
│   └── XAUUSD.json           # XAU/USD market data
└── lib/
    └── utils.ts               # Utility functions
```

## Available Scripts

```bash
# Development
pnpm dev              # Start Next.js dev server

# Production
pnpm build           # Build for production
pnpm start           # Start production server

# Code Quality
pnpm lint            # Run ESLint
```

## How It Works

1. **Select Currency** - Choose EUR/USD or XAU/USD
2. **Choose Difficulty** - Select 50, 100, or 200 candles
3. **Analyze Price** - The yellow line marks the candle to predict from
4. **Predict Direction** - Choose LONG (price goes up) or SHORT (price goes down)
5. **Learn** - See the result with structure analysis explaining why

### Prediction Logic

- **LONG**: If the last visible candle's close is higher than the marked candle's close
- **SHORT**: If the last visible candle's close is lower than the marked candle's close

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React

## License

MIT License
