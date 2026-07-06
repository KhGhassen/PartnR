-- Tracks whether the day-before reminder was sent for an event
ALTER TABLE "Events" ADD COLUMN IF NOT EXISTS "ReminderSent" boolean NOT NULL DEFAULT false;
