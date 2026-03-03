CREATE TABLE "users" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"owner_name" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");