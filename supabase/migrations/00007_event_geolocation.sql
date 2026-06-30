-- Event geolocation, for the "near me" map feature
ALTER TABLE "Events" ADD COLUMN IF NOT EXISTS "Latitude" double precision;
ALTER TABLE "Events" ADD COLUMN IF NOT EXISTS "Longitude" double precision;
