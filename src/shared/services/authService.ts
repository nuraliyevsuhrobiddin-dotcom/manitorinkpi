import type { User } from '../types';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthProvider {
  getCurrentUser(): User | null;
  login(credentials: AuthCredentials): Promise<User | null>;
  logout(): Promise<void>;
}

const AUTH_STORAGE_KEY = 'kpi_demo_auth_user';

class DemoAuthProvider implements AuthProvider {
  getCurrentUser(): User | null {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      return storedUser ? (JSON.parse(storedUser) as User) : null;
    } catch {
      return null;
    }
  }

  async login({ username, password }: AuthCredentials): Promise<User | null> {
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password.trim()) {
      return null;
    }

    const user: User = {
      id: 1,
      username: normalizedUsername,
      role: 'superadmin',
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return undefined;
  }
}

export const AuthService: AuthProvider = new DemoAuthProvider();
