-- Public questions/comments on events (visible before joining)
CREATE TABLE IF NOT EXISTS "EventComments" (
    "Id" uuid PRIMARY KEY,
    "EventId" uuid NOT NULL REFERENCES "Events" ("Id") ON DELETE CASCADE,
    "UserId" uuid NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "Content" character varying(500) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "IX_EventComments_EventId_CreatedAt" ON "EventComments" ("EventId", "CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_EventComments_UserId" ON "EventComments" ("UserId");
