-- User/event reports feeding the admin moderation flow
CREATE TABLE IF NOT EXISTS "Reports" (
    "Id" uuid PRIMARY KEY,
    "ReporterId" uuid NOT NULL,
    "TargetType" character varying(10) NOT NULL,
    "TargetId" uuid NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "Status" character varying(10) NOT NULL DEFAULT 'Pending',
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "IX_Reports_Status_CreatedAt" ON "Reports" ("Status", "CreatedAt");
