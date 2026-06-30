-- Event cover photo (paste-URL, mirrors AspNetUsers.AvatarUrl)
ALTER TABLE "Events" ADD COLUMN IF NOT EXISTS "PhotoUrl" character varying(500);

-- After-event photo gallery (paste-URL, no file storage)
CREATE TABLE IF NOT EXISTS "EventPhotos" (
    "Id" uuid NOT NULL,
    "EventId" uuid NOT NULL,
    "UploaderId" uuid NOT NULL,
    "Url" character varying(500) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_EventPhotos" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_EventPhotos_Events_EventId" FOREIGN KEY ("EventId") REFERENCES "Events" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_EventPhotos_AspNetUsers_UploaderId" FOREIGN KEY ("UploaderId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_EventPhotos_EventId" ON "EventPhotos" ("EventId");
