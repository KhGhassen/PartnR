-- Stored images for photo uploads (served via /api/uploads/{id})
CREATE TABLE IF NOT EXISTS "StoredImages" (
    "Id" uuid PRIMARY KEY,
    "UploaderId" uuid NOT NULL,
    "Data" bytea NOT NULL,
    "ContentType" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "IX_StoredImages_UploaderId" ON "StoredImages" ("UploaderId");
