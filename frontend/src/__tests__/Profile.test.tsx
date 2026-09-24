import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import Profile from '../pages/Profile';
import type { Profile as ProfileType } from '../types';

vi.mock('../api/profiles', () => ({
  getProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  getRatingsForUser: vi.fn(),
  deleteMyAccount: vi.fn(),
}));
vi.mock('../api/activities', () => ({ listActivities: vi.fn() }));
vi.mock('../api/blocks', () => ({
  listBlockedUsers: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
}));
vi.mock('../components/ChangePasswordForm', () => ({ default: () => null }));
vi.mock('../components/PhotoInput', () => ({ default: () => null }));

import { getProfile, getRatingsForUser } from '../api/profiles';
import { listActivities } from '../api/activities';
import { listBlockedUsers, blockUser, unblockUser } from '../api/blocks';

const alice: ProfileType = {
  id: 'u-alice',
  firstName: 'Alice',
  city: 'Paris',
  bio: 'Toujours partante.',
  avatarUrl: null,
  favoriteActivities: [],
  profileType: null,
  ratingAvg: 0,
  ratingCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
};

function renderProfile(id: string) {
  return render(
    <AuthProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/profile/${id}`]}>
          <Routes>
            <Route path="/profile/:id" element={<Profile />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

function signInAsBob() {
  localStorage.setItem('token', 'jwt');
  localStorage.setItem('user', JSON.stringify({ id: 'u-bob', firstName: 'Bob', email: 'bob@test.com', city: 'Paris', role: 'user' }));
}

describe('Profile — blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRatingsForUser).mockResolvedValue([]);
    vi.mocked(listActivities).mockResolvedValue([]);
    vi.mocked(listBlockedUsers).mockResolvedValue([]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('someone else’s profile: block after confirmation, then offer to unblock', async () => {
    signInAsBob();
    vi.mocked(getProfile).mockResolvedValue(alice);
    vi.mocked(blockUser).mockResolvedValue(undefined as never);
    vi.mocked(listBlockedUsers)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'u-alice', firstName: 'Alice', avatarUrl: null, blockedAt: '2026-09-24T08:00:00Z' }]);
    renderProfile('u-alice');

    await userEvent.click(await screen.findByRole('button', { name: /Bloquer/ }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Bloquer Alice'));
    expect(blockUser).toHaveBeenCalledWith('u-alice');
    expect(await screen.findByRole('button', { name: /Débloquer/ })).toBeInTheDocument();
    expect(screen.getByText(/Vous avez bloqué Alice/)).toBeInTheDocument();
  });

  it('declining the confirmation blocks nobody', async () => {
    signInAsBob();
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.mocked(getProfile).mockResolvedValue(alice);
    renderProfile('u-alice');

    await userEvent.click(await screen.findByRole('button', { name: /Bloquer/ }));

    expect(blockUser).not.toHaveBeenCalled();
  });

  it('own profile: lists blocked people and unblocks them', async () => {
    signInAsBob();
    vi.mocked(getProfile).mockResolvedValue({ ...alice, id: 'u-bob', firstName: 'Bob' });
    vi.mocked(listBlockedUsers).mockResolvedValue([
      { id: 'u-alice', firstName: 'Alice', avatarUrl: null, blockedAt: '2026-09-24T08:00:00Z' },
    ]);
    vi.mocked(unblockUser).mockResolvedValue(undefined as never);
    renderProfile('u-bob');

    expect(await screen.findByText('Personnes bloquées')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^⛔ Bloquer/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Débloquer' }));

    expect(unblockUser).toHaveBeenCalledWith('u-alice');
    await waitFor(() => expect(screen.getByText("Personne pour l'instant.")).toBeInTheDocument());
  });

  it('anonymous visitor: no block button at all', async () => {
    vi.mocked(getProfile).mockResolvedValue(alice);
    renderProfile('u-alice');

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(listBlockedUsers).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Bloquer/ })).not.toBeInTheDocument();
  });
});
