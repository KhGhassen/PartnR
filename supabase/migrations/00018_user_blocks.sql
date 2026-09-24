-- Blocking: the blocker and the blocked no longer see each other's events,
-- cannot join each other's events, and their chat messages are hidden from
-- one another. Rows go with either account.
CREATE TABLE IF NOT EXISTS "UserBlocks" (
    "Id" uuid PRIMARY KEY,
    "BlockerId" uuid NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "BlockedId" uuid NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserBlocks_BlockerId_BlockedId" ON "UserBlocks" ("BlockerId", "BlockedId");
CREATE INDEX IF NOT EXISTS "IX_UserBlocks_BlockedId" ON "UserBlocks" ("BlockedId");
