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

import { listEvents } from '../api/events';
import { listActivities } from '../api/activities';

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
    (listActivities as any).mockResolvedValue([]);
  });

  it('renders loading state initially', () => {
    (listEvents as any).mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders events after fetch', async () => {
    (listEvents as any).mockResolvedValue(mockPaginatedResult);

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });
    expect(screen.getByText('Par Alice')).toBeInTheDocument();
    expect(screen.getByText(/3\/10 participants/)).toBeInTheDocument();
  });

  it('shows error with retry button on fetch failure', async () => {
    (listEvents as any).mockRejectedValue(new Error('Network error'));

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
    (listEvents as any).mockResolvedValue({
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

  it('calls listEvents with filter params on submit', async () => {
    (listEvents as any).mockResolvedValue(mockPaginatedResult);

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listEvents).toHaveBeenCalledTimes(1);
    });

    const cityInput = screen.getByPlaceholderText('Ville...');
    await userEvent.type(cityInput, 'Lyon');
    await userEvent.click(screen.getByText('Filtrer'));

    await waitFor(() => {
      expect(listEvents).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Lyon', page: 1, pageSize: 20 })
      );
    });
  });
});
