-- Links weekly occurrences of a recurring event together
ALTER TABLE "Events" ADD COLUMN IF NOT EXISTS "RecurrenceGroupId" uuid NULL;
CREATE INDEX IF NOT EXISTS "IX_Events_RecurrenceGroupId" ON "Events" ("RecurrenceGroupId") WHERE "RecurrenceGroupId" IS NOT NULL;
