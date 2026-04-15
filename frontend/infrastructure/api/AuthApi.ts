import type { LoginCredentials, AuthResponse } from '~/domain/auth/Auth.types';

export const AuthApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // We use $fetch here because this is triggered by a user action, not SSR setup
    return await $fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: credentials,
      credentials: 'include',
    });
  },

  async logout(): Promise<void> {
    // Optional: If your backend has a POST /auth/logout endpoint, call it here
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    return await $fetch<{ accessToken: string }>('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
  }
};