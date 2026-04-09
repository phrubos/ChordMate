CREATE TABLE "spotify_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"band_id" uuid,
	"spotify_playlist_id" text NOT NULL,
	"spotify_playlist_url" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "unique_song_date";--> statement-breakpoint
ALTER TABLE "bands" ADD COLUMN "logo_data" text;--> statement-breakpoint
ALTER TABLE "bands" ADD COLUMN "background_data" text;--> statement-breakpoint
ALTER TABLE "spotify_playlists" ADD CONSTRAINT "spotify_playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_playlists" ADD CONSTRAINT "spotify_playlists_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "spotify_playlists_user_band_idx" ON "spotify_playlists" USING btree ("user_id","band_id");