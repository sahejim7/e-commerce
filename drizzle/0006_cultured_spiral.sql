ALTER TABLE "collections" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "is_featured";