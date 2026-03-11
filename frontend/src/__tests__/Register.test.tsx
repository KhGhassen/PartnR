import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Register from '../pages/Register';

function renderRegister() {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </AuthProvider>
  );
}

describe('Register', () => {
  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByText('Inscription')).toBeInTheDocument();
    expect(screen.getByText('Prénom')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByText('Ville')).toBeInTheDocument();
  });

  it('shows password criteria hint by default', () => {
    renderRegister();
    expect(screen.getByText(/8 caractères/)).toBeInTheDocument();
  });

  it('shows real-time password validation when typing', async () => {
    renderRegister();
    const pwInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(pwInput, 'short');

    expect(screen.getByText(/8 caractères minimum/)).toBeInTheDocument();
    expect(screen.getByText(/1 majuscule/)).toBeInTheDocument();
    expect(screen.getByText(/1 chiffre/)).toBeInTheDocument();
  });

  it('disables submit button when password is invalid', async () => {
    renderRegister();
    const pwInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(pwInput, 'weak');

    const submitBtn = screen.getByRole('button', { name: /inscrire/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button when password meets all criteria', async () => {
    renderRegister();
    const pwInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(pwInput, 'StrongPass1');

    const submitBtn = screen.getByRole('button', { name: /inscrire/i });
    expect(submitBtn).not.toBeDisabled();
  });
});
