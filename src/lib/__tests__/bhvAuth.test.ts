import { BhvApiClient } from '../bhvApiClient';

describe('BhvApiClient Authentication', () => {
  let bhvClient: BhvApiClient;

  beforeEach(() => {
    bhvClient = new BhvApiClient();
  });

  describe('Cookie management', () => {
    it('should initialize with no session cookies', () => {
      expect(bhvClient.getSessionCookies()).toBeNull();
    });

    it('should set and get session cookies', () => {
      const testCookies = 'sessionId=abc123; userId=456';
      bhvClient.setSessionCookies(testCookies);
      expect(bhvClient.getSessionCookies()).toBe(testCookies);
    });

    it('should clear session cookies', () => {
      bhvClient.setSessionCookies('test=value');
      bhvClient.clearSession();
      expect(bhvClient.getSessionCookies()).toBeNull();
    });
  });

  describe('Authentication method', () => {
    it('should have authenticate method', () => {
      expect(typeof bhvClient.authenticate).toBe('function');
    });

    it('should return proper structure for authentication response', async () => {
      // Mock fetch to avoid actual API calls in tests
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'set-cookie': 'sessionId=test123; Path=/; HttpOnly'
        }),
        json: async () => ({
          status_code: 200,
          message: 'Login successful'
        })
      });

      const result = await bhvClient.authenticate('testuser', 'testpass');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('cookies');
      expect(result).toHaveProperty('rawResponse');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle authentication failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          status_code: 401,
          message: 'Invalid credentials'
        })
      });

      const result = await bhvClient.authenticate('baduser', 'badpass');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await bhvClient.authenticate('testuser', 'testpass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});