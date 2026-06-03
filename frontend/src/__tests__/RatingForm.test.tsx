import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingForm from '../components/RatingForm';

vi.mock('../api/ratings', () => ({
  createRating: vi.fn(),
}));

import { createRating } from '../api/ratings';

describe('RatingForm', () => {
  const defaultProps = {
    eventId: 'event-1',
    ratedUserId: 'user-2',
    ratedUserName: 'Alice',
    onRated: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with user name', () => {
    render(<RatingForm {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Commentaire (optionnel)')).toBeInTheDocument();
  });

  it('shows 5 star buttons', () => {
    render(<RatingForm {...defaultProps} />);
    const stars = screen.getAllByRole('button', { name: /étoile/ });
    expect(stars).toHaveLength(5);
  });

  it('disables submit when no score selected', () => {
    render(<RatingForm {...defaultProps} />);
    const submitBtn = screen.getByText('Envoyer');
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit after selecting a score', async () => {
    render(<RatingForm {...defaultProps} />);
    const stars = screen.getAllByRole('button', { name: /étoile/ });
    await userEvent.click(stars[2]);
    const submitBtn = screen.getByText('Envoyer');
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls createRating on valid submit', async () => {
    const onRated = vi.fn();
    vi.mocked(createRating).mockResolvedValueOnce({ id: '1', score: 4 });

    render(<RatingForm {...defaultProps} onRated={onRated} />);

    const stars = screen.getAllByRole('button', { name: /étoile/ });
    await userEvent.click(stars[3]);
    await userEvent.click(screen.getByText('Envoyer'));

    await waitFor(() => {
      expect(createRating).toHaveBeenCalledWith('event-1', {
        ratedUserId: 'user-2',
        score: 4,
        comment: undefined,
      });
      expect(onRated).toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(<RatingForm {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('sends comment when provided', async () => {
    vi.mocked(createRating).mockResolvedValueOnce({ id: '1', score: 5 });

    render(<RatingForm {...defaultProps} />);

    const stars = screen.getAllByRole('button', { name: /étoile/ });
    await userEvent.click(stars[4]);

    const textarea = screen.getByPlaceholderText('Commentaire (optionnel)');
    await userEvent.type(textarea, 'Super partenaire !');

    await userEvent.click(screen.getByText('Envoyer'));

    await waitFor(() => {
      expect(createRating).toHaveBeenCalledWith('event-1', {
        ratedUserId: 'user-2',
        score: 5,
        comment: 'Super partenaire !',
      });
    });
  });
});
