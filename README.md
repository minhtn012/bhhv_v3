# BHHV V3 - Vehicle Insurance Contract Management System

**BHHV V3** (Bảo Hiểm Hợp Thực Vụ) is a modern web-based platform for managing vehicle insurance contracts. Designed for insurance agents and administrators, it streamlines contract creation, validation, and submission to the BHV (Bảo Hiểm Việt) insurance platform with real-time premium calculation and automated document generation.

## Features

- **Contract Management**: Multi-step wizard for contract creation with real-time validation
- **Real-Time Premium Calculation**: Instant insurance premium calculation based on vehicle and coverage selection
- **BHV Integration**: Direct submission to the BHV insurance platform with automated policy generation
- **Document Export**: Generate Word documents ready for customer signature
- **User Management**: Role-based access (admin/user) with secure authentication
- **Dashboard Analytics**: Personal and system-wide contract statistics
- **Comprehensive Logging**: System logs, BHV integration logs, and error tracking
- **Vietnamese Localization**: Full support for Vietnamese language and location hierarchy

## Technology Stack

- **Frontend**: Next.js 15 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS v4
- **Backend**: Next.js API routes, Node.js 18+
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation, bcryptjs for passwords
- **Testing**: Jest, React Testing Library, MSW (Mock Service Worker)
- **Deployment**: Vercel-ready, serverless-compatible architecture

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- MongoDB (local or cloud instance)
- Environment variables configured (see `.env.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/minhtn012/bhhv_v3.git
   cd bhhv_v3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

   **Required variables**:
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for access tokens (32+ chars)
   - `REFRESH_SECRET`: Secret key for refresh tokens (32+ chars)
   - `ENCRYPTION_KEY`: Key for encrypting sensitive data (32 bytes hex)

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack hot reload

# Production
npm run build           # Build for production with Turbopack
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint checks

# Testing
npm test                # Run Jest test suite
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run test:ci        # Run tests for CI/CD (no watch)
```

### Code Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # REST API endpoints
│   ├── dashboard/      # User dashboard pages
│   ├── admin/          # Admin dashboard pages
│   └── layout.tsx      # Root layout
├── components/         # React components
├── hooks/             # Custom React hooks
├── lib/               # Business logic & services
├── models/            # Mongoose database models
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── __tests__/         # Test utilities & fixtures
```

See [docs/codebase-summary.md](docs/codebase-summary.md) for detailed architecture overview.

## Documentation

Complete documentation is available in the `/docs` directory:

- **[docs/project-overview-pdr.md](docs/project-overview-pdr.md)** - Project vision, features, business rules, and requirements
- **[docs/codebase-summary.md](docs/codebase-summary.md)** - Technical architecture, directory structure, and component overview
- **[docs/code-standards.md](docs/code-standards.md)** - Coding standards, conventions, and development patterns
- **[docs/system-architecture.md](docs/system-architecture.md)** - System design, database schema, API architecture, and deployment strategy
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidelines for development

## Database

### MongoDB Setup (Docker)

```bash
docker run -d \
  -p 27018:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=dev \
  -e MONGO_INITDB_ROOT_PASSWORD=dev123 \
  -e MONGO_INITDB_DATABASE=bhhv \
  --name bhhv_mongodb \
  mongo:latest
```

Connection string: `mongodb://dev:dev123@localhost:27018/bhhv?authSource=admin`

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode (for GitHub Actions)
npm run test:ci
```

### Coverage Requirements

- **Overall**: Minimum 80% (branches, functions, lines, statements)
- **`src/utils/insurance-calculator.ts`**: Minimum 90% (critical business logic)
- **`src/hooks/useFormValidation.ts`**: Minimum 85%

## Authentication

### Login

The system uses JWT-based authentication with refresh tokens:

1. **Login** with username/password → Get access token + refresh token
2. **Access token** (15 min) sent with each request in `Authorization: Bearer <token>` header
3. **Refresh token** (7 days) stored in HTTP-only cookie
4. **Token rotation** happens automatically on each refresh

### Role-Based Access

- **Admin**: Full system access (user management, logs, statistics)
- **User**: Personal contract management, BHV credential management

## BHV Integration

### Setting Up BHV Connection

1. Go to dashboard → Settings → BHV Credentials
2. Enter your BHV login credentials
3. System validates connection before saving
4. Credentials are encrypted and stored securely

### Submitting Contracts to BHV

1. Create contract through the multi-step wizard
2. Review calculated premium
3. Click "Submit to BHV" button
4. System submits contract and receives BHV contract number
5. Contract status changes to "ra_hop_dong" (policy generated)

## Contract Workflow

Contracts progress through the following states:

```
nhap (Entering)
    ↓
cho_duyet (Pending Review)
    ↓
khach_duyet (Customer Review)
    ↓
ra_hop_dong (Policy Generated) ← BHV Contract Number stored here

Or at any stage:
    → huy (Cancelled)
```

**Note**: Only contracts in `nhap` status can be edited. Once submitted for review, they become read-only.

## Environment Configuration

### Development vs Production

| Setting | Development | Production |
|---------|-------------|-----------|
| `NODE_ENV` | `development` | `production` |
| `LOG_LEVEL` | `debug` | `warn` or `error` |
| `LOG_HTTP_TO_CONSOLE` | `true` | `false` |
| Database | Local/Test | MongoDB Atlas |
| JWT_SECRET | Any 32+ char | Strong random key |

### Security Notes

- **Never commit `.env.local`** - Use `.env.example` template only
- **Rotate JWT secrets** periodically (requires re-login for users)
- **Use strong encryption keys** (32+ bytes for passwords, 32 byte hex for data)
- **HTTPS only** in production
- **Rate limiting** enabled on all public endpoints

## Deployment

### Vercel (Recommended)

```bash
# Connect repository to Vercel
# Set environment variables in Vercel dashboard
# Auto-deploys on push to main

npm run build  # Build locally to test
```

### AWS/Self-Hosted

```bash
npm run build
npm start
```

**Requirements**:
- Node.js 18+ runtime
- MongoDB connection
- Environment variables configured
- HTTPS certificate

## API Reference

### Authentication Endpoints

```
POST /api/auth/login           - Login with credentials
POST /api/auth/refresh         - Get new access token
POST /api/auth/logout          - Logout
GET /api/auth/me               - Get current user
```

### Contract Endpoints

```
GET /api/contracts             - List user's contracts
POST /api/contracts            - Create new contract
GET /api/contracts/[id]        - Get contract details
PUT /api/contracts/[id]        - Update contract (only in nhap state)
DELETE /api/contracts/[id]     - Delete contract
PUT /api/contracts/[id]/change-status - Update workflow status
POST /api/contracts/[id]/confirm - Submit to BHV
GET /api/contracts/[id]/word-export - Export to Word
```

### User Endpoints

```
GET /api/users                 - List all users (admin only)
POST /api/users                - Create user (admin only)
GET /api/users/[id]            - Get user profile
PUT /api/users/[id]            - Update user
DELETE /api/users/[id]         - Delete user (admin only)
POST /api/users/bhv-credentials - Set BHV login
POST /api/users/change-password - Change password
GET /api/users/dashboard-stats - Get user statistics
```

### Admin Endpoints

```
GET /api/admin/dashboard-stats  - System overview
GET /api/admin/logs             - System logs
GET /api/admin/bhv-logs         - BHV request logs
GET /api/admin/provinces        - List provinces
GET /api/admin/districts-wards  - List districts/wards
```

See [docs/system-architecture.md](docs/system-architecture.md) for complete API documentation.

## Troubleshooting

### MongoDB Connection Issues

```
Error: Cannot connect to MongoDB

Solutions:
1. Verify MONGODB_URI is correct
2. Check MongoDB server is running
3. Verify credentials and authSource
4. Check network connectivity
```

### Authentication Failures

```
Error: Token expired or invalid

Solutions:
1. Clear cookies and login again
2. Verify JWT_SECRET matches deployment
3. Check system clock synchronization
4. Verify token is in Authorization header
```

### BHV Integration Issues

Check the BHV logs in Admin Dashboard:
- Go to `/admin/bhv-logs`
- Review recent requests/responses
- Look for error messages or invalid data

## Contributing

### Development Workflow

1. Create feature branch from `main`
2. Follow coding standards in [docs/code-standards.md](docs/code-standards.md)
3. Write tests for new features (80%+ coverage)
4. Submit pull request with description
5. Code review and CI/CD checks
6. Merge to main

### Code Quality Standards

- ESLint: All checks must pass
- TypeScript: Strict mode, no `any` types
- Tests: 80% coverage minimum, 90% for critical code
- Documentation: Keep code comments and docs up-to-date

## Performance

### Optimization Features

- **Turbopack**: Fast builds and hot reload during development
- **Next.js Image Optimization**: Automatic image resizing and caching
- **Database Indexing**: Optimized queries for common operations
- **Connection Pooling**: MongoDB connection reuse
- **Async Operations**: Non-blocking I/O for logs and API calls

### Performance Targets

- Page Load: < 2 seconds (90th percentile)
- API Response: < 500ms (90th percentile)
- Premium Calculation: < 100ms
- Database Query: < 1 second

## Monitoring

### Available Logs

- **System Logs**: Application events, errors (`/admin/logs`)
- **BHV Logs**: Integration requests/responses (`/admin/bhv-logs`)
- **Console**: Development debugging (when `LOG_HTTP_TO_CONSOLE=true`)

### Key Metrics to Monitor

- API error rate (should be < 1%)
- BHV integration success rate (should be > 98%)
- Database response time (should be < 500ms)
- Premium calculation accuracy (should be 100%)

## Support & Issues

- **Bug Reports**: Open issue on GitHub
- **Documentation**: See `/docs` directory
- **Questions**: Check existing issues or create a discussion

## License

[Add your license here]

## Author

BHHV V3 Development Team

---

## Additional Resources

- [Project Overview & PDR](docs/project-overview-pdr.md) - Features, requirements, business rules
- [Codebase Summary](docs/codebase-summary.md) - Architecture and component overview
- [Code Standards](docs/code-standards.md) - Development guidelines and patterns
- [System Architecture](docs/system-architecture.md) - Technical design and deployment
- [CLAUDE.md](CLAUDE.md) - AI development guidelines

---

**Last Updated**: 2025-12-22
**Version**: 1.0.0
**Status**: Active Development
