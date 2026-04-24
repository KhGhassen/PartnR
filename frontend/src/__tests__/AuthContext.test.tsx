import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

function TestConsumer() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuth();
  return (
    <div>
      <p data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</p>
      <p data-testid="token">{token ?? 'null'}</p>
      <p data-testid="user">{user ? user.firstName : 'null'}</p>
      <button onClick={() => setAuth('tok123', { id: '1', firstName: 'Alice', email: 'a@b.com', avatarUrl: null, city: 'Paris', role: 'user' })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('setAuth stores token and user', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('login').click();
    });

    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('token').textContent).toBe('tok123');
    expect(screen.getByTestId('user').textContent).toBe('Alice');
    expect(localStorage.getItem('token')).toBe('tok123');
  });

  it('logout clears token and user', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('login').click();
    });
    expect(screen.getByTestId('auth').textContent).toBe('yes');

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('initializes from localStorage', () => {
    const user = { id: '1', firstName: 'Bob', email: 'b@b.com', avatarUrl: null, city: 'Lyon', role: 'user' };
    localStorage.setItem('token', 'stored-tok');
    localStorage.setItem('user', JSON.stringify(user));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('token').textContent).toBe('stored-tok');
    expect(screen.getByTestId('user').textContent).toBe('Bob');
  });
});
