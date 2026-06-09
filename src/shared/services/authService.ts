import type { User } from '../types';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthProvider {
  login(credentials: AuthCredentials): Promise<User | null>;
  logout(): Promise<void>;
}

class DemoAuthProvider implements AuthProvider {
  async login({ username, password }: AuthCredentials): Promise<User | null> {
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password.trim()) {
      return null;
    }

    return {
      id: 1,
      username: normalizedUsername,
      role: 'superadmin',
    };
  }

  async logout(): Promise<void> {
    return undefined;
  }
}

export const AuthService: AuthProvider = new DemoAuthProvider();
