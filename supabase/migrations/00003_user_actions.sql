-- Analytics: user actions tracking table
CREATE TABLE IF NOT EXISTS "UserActions" (
    "Id"         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "UserId"     UUID        NULL,
    "Action"     VARCHAR(50) NOT NULL,
    "EntityType" VARCHAR(50) NULL,
    "EntityId"   UUID        NULL,
    "Metadata"   VARCHAR(500) NULL,
    "CreatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IX_UserActions_UserId_CreatedAt" ON "UserActions" ("UserId", "CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_UserActions_Action"           ON "UserActions" ("Action");
