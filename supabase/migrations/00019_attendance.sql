-- Who actually came. Marked by the organiser after the outing; feeds the
-- reliability shown on profiles and the waitlist order.
ALTER TABLE "EventParticipants"
    ADD COLUMN IF NOT EXISTS "Attendance" character varying(10) NOT NULL DEFAULT 'Unknown';

CREATE INDEX IF NOT EXISTS "IX_EventParticipants_UserId_Attendance"
    ON "EventParticipants" ("UserId", "Attendance")
 WHERE "Attendance" <> 'Unknown';
