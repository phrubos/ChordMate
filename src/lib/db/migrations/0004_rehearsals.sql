CREATE TABLE "rehearsal_attendance" (
	"rehearsal_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"answer" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rehearsal_attendance_rehearsal_id_user_id_pk" PRIMARY KEY("rehearsal_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rehearsals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"band_id" uuid,
	"date" date NOT NULL,
	"start_time" text,
	"end_time" text,
	"place" text,
	"goal" text,
	"notes" text,
	"kind" text DEFAULT 'rehearsal' NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recordings" ADD COLUMN "song_id" uuid;--> statement-breakpoint
ALTER TABLE "rehearsal_attendance" ADD CONSTRAINT "rehearsal_attendance_rehearsal_id_rehearsals_id_fk" FOREIGN KEY ("rehearsal_id") REFERENCES "public"."rehearsals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsal_attendance" ADD CONSTRAINT "rehearsal_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsals" ADD CONSTRAINT "rehearsals_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsals" ADD CONSTRAINT "rehearsals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rehearsals_band_date_idx" ON "rehearsals" USING btree ("band_id","date");--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;