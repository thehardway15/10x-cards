import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupTokenRefresh } from '../token-refresh';
import { apiClient } from '../../api.utils';
import { createToken } from '../jwt';
import type { User } from '@supabase/supabase-js';

describe('Token Refresh Mechanism', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
    updated_at: '',
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock timer functions
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not attempt refresh if no token exists', async () => {
    const apiSpy = vi.spyOn(apiClient, 'get');
    
    setupTokenRefresh();
    await vi.advanceTimersByTimeAsync(60 * 1000); // Advance 1 minute
    
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it('should not refresh token if expiration is not near', async () => {
    // Create token with 30 minutes expiration
    const token = await createToken(mockUser);
    localStorage.setItem('auth_token', token);

    const apiSpy = vi.spyOn(apiClient, 'get');
    
    setupTokenRefresh();
    await vi.advanceTimersByTimeAsync(60 * 1000); // Advance 1 minute
    
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it('should refresh token when expiration is near', async () => {
    // Override JWT_SECRET to create a token with different secret
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';

    // Create token that will be considered expired
    const token = await createToken(mockUser);
    localStorage.setItem('auth_token', token);

    // Restore original secret
    process.env.JWT_SECRET = originalSecret;

    // Mock API response
    const apiSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ user: mockUser });
    
    setupTokenRefresh();
    await vi.advanceTimersByTimeAsync(60 * 1000); // Advance 1 minute
    
    expect(apiSpy).toHaveBeenCalledWith('/api/auth/me');
    expect(localStorage.getItem('auth_token')).not.toBe(token);
  });

  it('should handle refresh failure gracefully', async () => {
    // Override JWT_SECRET to create a token with different secret
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';

    // Create token that will be considered expired
    const token = await createToken(mockUser);
    localStorage.setItem('auth_token', token);

    // Restore original secret
    process.env.JWT_SECRET = originalSecret;

    // Mock API error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));
    
    setupTokenRefresh();
    await vi.advanceTimersByTimeAsync(60 * 1000); // Advance 1 minute
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh token:', expect.any(Error));
    expect(localStorage.getItem('auth_token')).toBe(token); // Original token should remain
  });

  it('should continue checking after a refresh failure', async () => {
    // Override JWT_SECRET to create a token with different secret
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';

    // Create token that will be considered expired
    const token = await createToken(mockUser);
    localStorage.setItem('auth_token', token);

    // Restore original secret
    process.env.JWT_SECRET = originalSecret;

    const apiSpy = vi.spyOn(apiClient, 'get')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ user: mockUser });
    
    setupTokenRefresh();
    
    // First check fails
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(apiSpy).toHaveBeenCalledTimes(1);
    
    // Second check succeeds
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(apiSpy).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('auth_token')).not.toBe(token);
  });
});