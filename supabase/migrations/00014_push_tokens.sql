-- Expo push tokens + push dispatch tracking on notifications
CREATE TABLE IF NOT EXISTS "PushTokens" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "Token" text NOT NULL UNIQUE,
    "CreatedAt" timestamp with time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS "IX_PushTokens_UserId" ON "PushTokens" ("UserId");

ALTER TABLE "Notifications" ADD COLUMN IF NOT EXISTS "PushSent" boolean NOT NULL DEFAULT false;
