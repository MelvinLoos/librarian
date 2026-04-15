export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'READER'
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}