-- Profile categories: Aventurier, Social, Detente, Sportif, Creatif, Calme
ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "ProfileType" character varying(20);
