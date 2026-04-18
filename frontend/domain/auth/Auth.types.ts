export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'READER'
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}