# AGENTS.md - Agentic Coding Guidelines

## Build & Development Commands

```bash
# Development
pnpm run dev              # Start Next.js dev server

# Production
pnpm run build           # Build for production (includes prisma generate)
pnpm run start           # Start production server

# Code Quality
pnpm run lint            # Run ESLint (Next.js rules)

# Testing
pnpm run test            # Run all Vitest tests
pnpm run test -- src/__tests__/middleware.test.ts    # Run single test file
pnpm run test -- --reporter=verbose                  # Run with verbose output

# E2E Testing
pnpm run test:e2e        # Run Cypress E2E tests headlessly
pnpm run test:e2e:ui     # Open Cypress interactive mode

# PWA
pnpm run generate-pwa-assets   # Generate PWA icons from public/next.svg
```

## Project Overview

**Forex Trading Practice App** - A smart money concepts learning platform for traders to practice predicting price direction using real market data.

### Features
- EUR/USD and XAU/USD (Gold) currency support
- Multiple difficulty levels (50, 100, 200 candles)
- Smart Money Concepts visualization:
  - Fair Value Gap (FVG) detection and display
- Practice mode with score tracking
- Structure analysis explanations after predictions

### Data
- Market data stored in JSON format in `src/db/`
- Currently supported: EURUSD.json, XAUUSD.json

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x (strict mode enabled)
- **Styling**: Tailwind CSS 3.x + shadcn/ui
- **Auth**: Clerk
- **Database**: Prisma ORM (PostgreSQL/Neon)
- **Testing**: Vitest + @testing-library/react + jsdom + Cypress (E2E)
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives via shadcn

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
│   │   ├── chart.tsx        # Candlestick chart component
│   │   ├── practice-game.tsx # Main game logic
│   │   ├── score-card.tsx   # Score display component
│   │   └── structure.ts     # Structure detection utilities
│   └── ...
├── db/
│   ├── EURUSD.json          # EUR/USD market data
│   └── XAUUSD.json          # XAU/USD market data
└── lib/
    └── utils.ts              # Utility functions
```

## Code Style Guidelines

### Imports (Order Matters)
```typescript
// 1. React/Next core
import { useState } from "react";
import Link from "next/link";

// 2. Third-party libraries
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// 3. Local modules (use @/ aliases)
import { cn } from "@/lib/utils";
import { Candle, detectStructure } from "@/components/practice/structure";
```

### Component Patterns

#### Practice Components (in `src/components/practice/`)
```typescript
// Structure types
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  datetime: string;
}

interface FairValueGap {
  index: number;
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
}
```

#### Chart Component
```typescript
"use client";

import { Candle, StructureData } from "./structure";

interface ChartProps {
  candles: Candle[];
  visibleCount: number;
  revealCount: number;
  markIndex: number;
  structureData?: StructureData;
}

export default function Chart({ ... }: ChartProps) {
  // SVG-based candlestick chart
}
```

### Naming Conventions
- **Components**: PascalCase (e.g., `Chart`, `PracticeGame`, `ScoreCard`)
- **Files**: 
  - Components: PascalCase (e.g., `chart.tsx`, `practice-game.tsx`)
  - Utilities: kebab-case (e.g., `structure.ts`)
- **Functions**: camelCase (e.g., `detectStructure`, `parseCandles`)
- **Types/Interfaces**: PascalCase (e.g., `Candle`, `FairValueGap`)

### TypeScript Guidelines
- Always type function parameters and return types
- Use `interface` for object shapes, `type` for unions/complex types
- Prefer explicit types over `any`

### Styling with Tailwind
- Use shadcn/ui components as base
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Use semantic color tokens

## Testing Patterns

### Unit Tests
```typescript
import { describe, expect, it } from 'vitest';
import { detectStructure, parseCandles } from '@/components/practice/structure';

describe('detectStructure', () => {
  it('should detect fair value gaps', () => {
    // test implementation
  });
});
```

## Environment Variables

Required variables in `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
```

## Key Principles

1. **Prefer Server Components** - Use client components only when needed (interactivity, browser APIs)
2. **Modular Components** - Keep practice-related components in `src/components/practice/`
3. **Type Safety** - Use proper TypeScript types for all data structures
4. **Use Path Aliases** - Always use `@/` imports for local modules

## Git Commit Style

Use Conventional Commits with gitmoji:

### Common Types
- ✨ `feat:` - New feature
- 🐛 `fix:` - Bug fix
- 🎨 `style:` - Code style/formatting
- ♻️ `refactor:` - Code refactoring
- ✅ `test:` - Adding tests
- 🔧 `chore:` - Build process, dependencies

### Examples
```bash
✨ feat: add Fair Value Gap detection
🎨 style: make practice page responsive for mobile
♻️ refactor: separate components into reusable files
```
