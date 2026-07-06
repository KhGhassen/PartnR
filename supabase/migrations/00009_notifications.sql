-- In-app notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "Type" character varying(50) NOT NULL,
    "Message" character varying(500) NOT NULL,
    "EventId" uuid NULL,
    "IsRead" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_CreatedAt" ON "Notifications" ("UserId", "CreatedAt");
