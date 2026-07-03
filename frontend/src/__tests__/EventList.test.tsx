import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventList from '../pages/EventList';

vi.mock('../api/events', () => ({
  listEvents: vi.fn(),
}));

vi.mock('../api/activities', () => ({
  listActivities: vi.fn(),
}));

vi.mock('../api/cities', () => ({
  listCities: vi.fn(),
}));

import { listEvents } from '../api/events';
import { listActivities } from '../api/activities';
import { listCities } from '../api/cities';

const mockPaginatedResult = {
  items: [
    {
      id: '1',
      title: 'Morning Run',
      description: 'A nice run',
      city: 'Paris',
      location: 'Parc Monceau',
      date: '2026-04-15T08:00:00Z',
      maxParticipants: 10,
      status: 'Published',
      activityName: 'Running',
      activityIcon: '🏃',
      creatorId: 'u1',
      creatorName: 'Alice',
      participantCount: 3,
      photoUrl: null,
      latitude: null,
      longitude: null,
      distanceKm: null,
      createdAt: '2026-03-01T00:00:00Z',
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  hasNextPage: false,
};

describe('EventList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listActivities).mockResolvedValue([]);
    vi.mocked(listCities).mockResolvedValue(['Paris', 'Lyon']);
  });

  it('renders loading state initially', () => {
    vi.mocked(listEvents).mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders events after fetch', async () => {
    vi.mocked(listEvents).mockResolvedValue(mockPaginatedResult);

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });
    expect(screen.getByText('par Alice')).toBeInTheDocument();
    expect(screen.getByText(/7 places/)).toBeInTheDocument();
  });

  it('shows error with retry button on fetch failure', async () => {
    vi.mocked(listEvents).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Réessayer')).toBeInTheDocument();
    });
  });

  it('shows empty state when no events', async () => {
    vi.mocked(listEvents).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNextPage: false,
    });

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Aucun événement trouvé.')).toBeInTheDocument();
    });
  });

  it('calls listEvents with filter params when a city is selected', async () => {
    vi.mocked(listEvents).mockResolvedValue(mockPaginatedResult);

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listEvents).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Lyon')).toBeInTheDocument();
    });
    const citySelect = screen.getByText('Toutes les villes').closest('select')!;
    await userEvent.selectOptions(citySelect, 'Lyon');

    await waitFor(() => {
      expect(listEvents).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Lyon', page: 1, pageSize: 20 })
      );
    });
  });
});
