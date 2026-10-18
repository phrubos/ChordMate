ALTER TABLE "songs" ADD COLUMN "status" text DEFAULT 'learning' NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "bpm" integer;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "song_key" text;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "capo" integer;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "tuning" text;