ALTER TABLE "user" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "account_id" TO "id";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
DROP INDEX "user_email_idx";--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");