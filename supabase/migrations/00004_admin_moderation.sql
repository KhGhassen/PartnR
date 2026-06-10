-- Admin moderation: ban/unban users
ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "IsBanned" boolean NOT NULL DEFAULT false;
