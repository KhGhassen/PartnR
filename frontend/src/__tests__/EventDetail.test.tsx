import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import EventDetail from '../pages/EventDetail';
import type { EventDetail as EventDetailType } from '../types';

vi.mock('../api/events', () => ({
  getEvent: vi.fn(),
  joinEvent: vi.fn(),
  leaveEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));
vi.mock('../api/analytics', () => ({ trackAction: vi.fn() }));
vi.mock('../lib/leafletIcons', () => ({}));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
}));
vi.mock('../components/EventChat', () => ({ default: () => <div data-testid="chat" /> }));
vi.mock('../components/EventGallery', () => ({ default: () => null }));
vi.mock('../components/EventComments', () => ({ default: () => null }));
vi.mock('../components/RatingForm', () => ({ default: () => null }));

import { getEvent } from '../api/events';

const baseEvent: EventDetailType = {
  id: 'e1',
  title: 'Apéro au bord du canal',
  description: 'On se retrouve au bord de l’eau.',
  city: 'Paris',
  location: null,
  locationHidden: true,
  date: '2026-11-14T18:30:00Z',
  maxParticipants: 8,
  status: 'Published',
  activityName: 'Café / Verre',
  activityIcon: '☕',
  creatorId: 'u-alice',
  creatorName: 'Alice',
  participantCount: 3,
  photoUrl: null,
  latitude: 48.88,
  longitude: 2.34,
  distanceKm: null,
  isRecurring: false,
  upcomingOccurrences: null,
  createdAt: '2026-10-01T00:00:00Z',
  participants: [],
  photos: [],
  occurrences: [],
};

function renderDetail() {
  return render(
    <AuthProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={['/events/e1']}>
          <Routes>
            <Route path="/events/:id" element={<EventDetail />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

function signIn(userId: string) {
  localStorage.setItem('token', 'jwt');
  localStorage.setItem('user', JSON.stringify({ id: userId, firstName: 'Bob', email: 'bob@test.com', city: 'Paris', role: 'user' }));
}

describe('EventDetail', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => localStorage.clear());

  it('anonymous visitor: withheld address, approximate map, sign-in call to action that returns here', async () => {
    vi.mocked(getEvent).mockResolvedValue(baseEvent);
    renderDetail();

    expect(await screen.findByText('Apéro au bord du canal')).toBeInTheDocument();
    expect(screen.getByText(/L'adresse exacte est communiquée aux participants/)).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByText(/5 places restantes — rejoignez PartnR/)).toBeInTheDocument();

    const login = screen.getByRole('link', { name: 'Se connecter pour rejoindre' });
    expect(decodeURIComponent(login.getAttribute('href') ?? '')).toContain('/events/e1');
    expect(screen.getByRole('link', { name: 'Créer un compte' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rejoindre/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
  });

  it('anonymous visitor on a full event: invited to sign up for the waitlist', async () => {
    vi.mocked(getEvent).mockResolvedValue({ ...baseEvent, participantCount: 8 });
    renderDetail();

    expect(await screen.findByText(/inscrivez-vous pour rejoindre la liste d'attente/)).toBeInTheDocument();
    expect(screen.getByText('Complet')).toBeInTheDocument();
  });

  it('signed-in outsider: sees the roster and a join button, still not the address', async () => {
    signIn('u-bob');
    vi.mocked(getEvent).mockResolvedValue({
      ...baseEvent,
      participants: [{ userId: 'u-alice', firstName: 'Alice', avatarUrl: null, status: 'Confirmed', joinedAt: '2026-10-01T00:00:00Z' }],
    });
    renderDetail();

    expect(await screen.findByRole('button', { name: 'Rejoindre 🎉' })).toBeInTheDocument();
    expect(screen.getByText(/L'adresse exacte est communiquée aux participants/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Se connecter pour rejoindre' })).not.toBeInTheDocument();
  });

  it('confirmed participant: exact meeting point and the group chat', async () => {
    signIn('u-bob');
    vi.mocked(getEvent).mockResolvedValue({
      ...baseEvent,
      location: 'Quai de Valmy',
      locationHidden: false,
      participants: [
        { userId: 'u-alice', firstName: 'Alice', avatarUrl: null, status: 'Confirmed', joinedAt: '2026-10-01T00:00:00Z' },
        { userId: 'u-bob', firstName: 'Bob', avatarUrl: null, status: 'Confirmed', joinedAt: '2026-10-02T00:00:00Z' },
      ],
    });
    renderDetail();

    expect(await screen.findByText('Quai de Valmy')).toBeInTheDocument();
    expect(screen.queryByText(/L'adresse exacte est communiquée/)).not.toBeInTheDocument();
    expect(screen.getByTestId('chat')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rejoindre 🎉' })).not.toBeInTheDocument();
  });
});
