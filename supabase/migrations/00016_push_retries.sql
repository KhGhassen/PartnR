-- Push dispatch used to mark PushSent = true unconditionally, so a passing
-- Expo outage lost cancellations and reminders for good; and the dispatcher
-- scanned the whole table every 30 s with no usable index.
ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS "PushAttempts" integer NOT NULL DEFAULT 0;
ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS "PushNextAttemptAt" timestamp with time zone NULL;

CREATE INDEX IF NOT EXISTS "IX_Notifications_PushPending"
    ON "Notifications" ("CreatedAt")
    WHERE NOT "PushSent";
