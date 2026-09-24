-- The J-1 reminder used a single flag per event: anyone who joined after the
-- pass never got one, and a rescheduled event never reminded again. The flag
-- now lives on each participation.
ALTER TABLE "EventParticipants" ADD COLUMN IF NOT EXISTS "ReminderSentAt" timestamp with time zone NULL;

-- Participants already reminded under the old event-level flag must not be
-- reminded a second time right after the deploy.
UPDATE "EventParticipants" ep
   SET "ReminderSentAt" = now()
  FROM "Events" e
 WHERE e."Id" = ep."EventId"
   AND e."ReminderSent"
   AND ep."ReminderSentAt" IS NULL;

CREATE INDEX IF NOT EXISTS "IX_EventParticipants_ReminderPending"
    ON "EventParticipants" ("EventId")
 WHERE "ReminderSentAt" IS NULL AND "Status" = 'Confirmed';

-- "Events"."ReminderSent" is no longer read by the API. It is deliberately
-- left in place so a rollback to the previous build still boots.
