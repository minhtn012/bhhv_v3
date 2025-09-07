// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
process.env.MONGODB_URI = 'mongodb://localhost:27017/bhhv_test'

// Global test utilities - allow console.log for debugging
// global.console = {
//   ...console,
//   // Suppress console.log during tests unless needed
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// }

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      reload: jest.fn(),
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Setup for testing async functions
beforeAll(() => {
  // Extend Jest timeout for database operations
  jest.setTimeout(30000)
})

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
})