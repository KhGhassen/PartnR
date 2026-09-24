-- Widens the catalogue from 10 sport-only activities to 22 across 6 categories.
-- The home page promised "resto, concert, expo" while nothing outside sport could
-- be created: ActivityId is required and there was no free-text fallback.
--
-- Ids are fixed and mirror AppDbContext.HasData exactly — EnsureCreated() seeds
-- only a brand-new database, so production relies on this file alone.

ALTER TABLE "Activities" ADD COLUMN IF NOT EXISTS "Category" character varying(30) NOT NULL DEFAULT 'Sport';

-- "Running" becomes French like every other entry. FavoriteActivities stores
-- NAMES, not ids, so the rename has to be mirrored there or favourites and the
-- "Pour vous" matching silently break.
UPDATE "Activities" SET "Name" = 'Course à pied'
 WHERE "Id" = 'a1000000-0000-0000-0000-000000000001' AND "Name" = 'Running';
UPDATE "AspNetUsers"
   SET "FavoriteActivities" = array_replace("FavoriteActivities", 'Running', 'Course à pied')
 WHERE 'Running' = ANY("FavoriteActivities");

UPDATE "Activities" SET "Category" = 'Jeux'
 WHERE "Id" = 'a1000000-0000-0000-0000-000000000004';

INSERT INTO "Activities" ("Id", "Name", "Slug", "Icon", "Category", "CreatedAt") VALUES
  ('a1000000-0000-0000-0000-000000000011', 'Café / Verre',     'cafe-verre',       '☕',  'Boire & manger', now()),
  ('a1000000-0000-0000-0000-000000000012', 'Restaurant',       'restaurant',       '🍽️', 'Boire & manger', now()),
  ('a1000000-0000-0000-0000-000000000013', 'Brunch',           'brunch',           '🥐',  'Boire & manger', now()),
  ('a1000000-0000-0000-0000-000000000014', 'Cours de cuisine', 'cours-de-cuisine', '🍳',  'Boire & manger', now()),
  ('a1000000-0000-0000-0000-000000000015', 'Cinéma',           'cinema',           '🎬',  'Culture',        now()),
  ('a1000000-0000-0000-0000-000000000016', 'Concert',          'concert',          '🎵',  'Culture',        now()),
  ('a1000000-0000-0000-0000-000000000017', 'Musée / Expo',     'musee-expo',       '🖼️', 'Culture',        now()),
  ('a1000000-0000-0000-0000-000000000018', 'Théâtre',          'theatre',          '🎭',  'Culture',        now()),
  ('a1000000-0000-0000-0000-000000000019', 'Balade urbaine',   'balade-urbaine',   '🚶',  'Balades',        now()),
  ('a1000000-0000-0000-0000-000000000020', 'Marché',           'marche',           '🧺',  'Balades',        now()),
  ('a1000000-0000-0000-0000-000000000021', 'Jeux vidéo',       'jeux-video',       '🎮',  'Jeux',           now()),
  ('a1000000-0000-0000-0000-000000000022', 'Bénévolat',        'benevolat',        '🤝',  'Engagement',     now())
ON CONFLICT ("Id") DO NOTHING;
