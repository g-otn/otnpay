CREATE TABLE "user" (
	"account_id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"owner_name" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_owner_name_unique" UNIQUE("owner_name")
);
--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");