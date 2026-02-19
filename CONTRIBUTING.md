# Contributing to MappingBitcoin

Thank you for your interest in contributing to MappingBitcoin! This document provides guidelines and information for contributors.

## Table of Contents

1. [Ways to Contribute](#ways-to-contribute)
2. [Development Setup](#development-setup)
3. [Code Guidelines](#code-guidelines)
4. [Pull Request Process](#pull-request-process)
5. [Adding Venues](#adding-venues)
6. [Reporting Issues](#reporting-issues)
7. [Community Guidelines](#community-guidelines)

---

## Ways to Contribute

### No Code Required

- **Add venues** — Help map Bitcoin-accepting businesses in your area
- **Write reviews** — Share your experiences at Bitcoin-friendly places
- **Translations** — Help translate the platform to new languages
- **Documentation** — Improve guides and explanations
- **Report bugs** — Let us know about issues you encounter
- **Spread the word** — Share MappingBitcoin with your community

### Code Contributions

- **Features** — Implement new functionality
- **Bug fixes** — Fix reported issues
- **Performance** — Optimize slow code paths
- **Tests** — Improve test coverage
- **Refactoring** — Clean up and improve code quality

---

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14+
- npm (comes with Node.js)
- Git

### Installation

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/mappingbitcoin.git
cd mappingbitcoin

# 3. Add upstream remote
git remote add upstream https://github.com/ArcadeLabsInc/mappingbitcoin.git

# 4. Install dependencies
npm install

# 5. Set up environment
cp .env.example .env
# Edit .env with your configuration (see below)

# 6. Set up database
createdb mappingbitcoin  # or use your preferred method
npx prisma migrate deploy
npx prisma generate

# 7. Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with at minimum:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/mappingbitcoin"

# NextAuth (generate a random secret)
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: For full functionality
HETZNER_STORAGE_ENDPOINT=...
HETZNER_STORAGE_BUCKET=...
HETZNER_STORAGE_ACCESS_KEY=...
HETZNER_STORAGE_SECRET_KEY=...
RESEND_API_KEY=...
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts

# Run with coverage
npm run test:coverage
```

### Useful Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier
npm run prisma:studio    # Open Prisma Studio (DB viewer)
npm run listen:reviews   # Start review indexer
npm run maps:update      # Sync OSM venue data
```

---

## Code Guidelines

### General Principles

- **Keep it simple** — Prefer readable code over clever code
- **DRY** — Don't Repeat Yourself, but don't over-abstract
- **YAGNI** — You Aren't Gonna Need It; build what's needed now
- **Test** — Write tests for new functionality

### TypeScript

- Use TypeScript strictly; avoid `any` types
- Define interfaces for data structures
- Use meaningful variable and function names

```typescript
// Good
interface VenueReview {
    id: string;
    rating: number;
    content: string | null;
    authorPubkey: string;
}

async function getReviewsByVenue(venueId: string): Promise<VenueReview[]> {
    // ...
}

// Avoid
async function getReviews(id: any): Promise<any> {
    // ...
}
```

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Use meaningful prop types

```tsx
// Good
interface ReviewCardProps {
    review: ReviewWithTrust;
    onReply?: (reviewId: string) => void;
}

export default function ReviewCard({ review, onReply }: ReviewCardProps) {
    // ...
}
```

### File Organization

```
components/
├── ComponentName/
│   ├── index.tsx        # Main component
│   ├── SubComponent.tsx # Sub-components (if needed)
│   └── types.ts         # Types (if complex)
```

### Styling

- Use Tailwind CSS classes
- Follow existing color conventions (`bg-surface`, `text-text-light`, etc.)
- Prefer utility classes over custom CSS

### Commits

Write clear, descriptive commit messages:

```
feat: add Web of Trust badge to review cards

- Display WoT distance next to reviewer name
- Color-code by trust level
- Add tooltip with explanation
```

Use conventional commit prefixes:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Code style (formatting, etc.)
- `refactor:` — Code refactoring
- `test:` — Adding tests
- `chore:` — Maintenance tasks

---

## Pull Request Process

### Before You Start

1. Check existing issues and PRs to avoid duplicates
2. For significant changes, open an issue first to discuss
3. Ensure your fork is up to date:

```bash
git fetch upstream
git checkout master
git merge upstream/master
```

### Creating a PR

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear commits

3. Ensure code quality:
   ```bash
   npm run lint
   npm run build
   npm test
   ```

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request on GitHub

### PR Requirements

- **Title**: Clear, concise description of the change
- **Description**: Explain what, why, and how
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include for UI changes

### PR Template

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How was this tested?

## Screenshots (if applicable)
```

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge

---

## Adding Venues

### Via the Website (Easiest)

1. Go to [mappingbitcoin.com/map](https://mappingbitcoin.com/map)
2. Click "Add Place"
3. You'll be redirected to OpenStreetMap to add the venue
4. Add the required tags for Bitcoin acceptance
5. The venue will appear on MappingBitcoin after the next sync

### Required OSM Tags

```
currency:XBT = yes
payment:lightning = yes       # If accepting Lightning
payment:lightning_contactless = yes  # If accepting NFC Lightning
```

### Optional Tags

```
name = Business Name
amenity = cafe|restaurant|bar|etc
cuisine = ...
opening_hours = ...
website = ...
phone = ...
```

---

## Reporting Issues

### Bug Reports

Include:
- **Description**: What happened vs what you expected
- **Steps to reproduce**: Numbered steps to recreate the issue
- **Environment**: Browser, OS, relevant configuration
- **Screenshots/logs**: If applicable

### Feature Requests

Include:
- **Problem**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives**: Other approaches you considered
- **Context**: Why is this important?

### Security Issues

For security vulnerabilities, please email security concerns privately rather than opening a public issue. See [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for our security practices.

---

## Community Guidelines

### Be Respectful

- Treat everyone with respect
- Be constructive in feedback
- Welcome newcomers

### Be Patient

- Maintainers are volunteers
- Reviews may take time
- Ask questions if unclear

### Be Bitcoin

- We're building for Bitcoiners
- Focus on practical utility
- Embrace decentralization and self-sovereignty

---

## Nostr Event Kinds

If you're working on Nostr-related features, here are our custom event kinds:

| Kind | Purpose | Notes |
|------|---------|-------|
| 38381 | Venue Reviews | Rating (1-5), optional text/images |
| 38382 | Review Replies | Only from verified venue owners |
| 38383 | Venue Claims | Business ownership verification |

See [REVIEWS_SYSTEM.md](docs/REVIEWS_SYSTEM.md) for detailed documentation.

---

## Questions?

- Open an issue for questions about contributing
- Check existing documentation in the `docs/` folder
- Review the codebase structure in `README.md`

---

Thank you for contributing to MappingBitcoin! Together we're building the map of the Bitcoin ecosystem.
