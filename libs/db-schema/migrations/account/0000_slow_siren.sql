CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'withdrawal');--> statement-breakpoint
CREATE TABLE "accounts" (
	"balance" numeric(13, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer,
	CONSTRAINT "accounts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "accounts_balance_non_negative" CHECK ("accounts"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"amount" numeric(13, 2) NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"type" "transaction_type" NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_accounts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."accounts"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_timestamp_idx" ON "transactions" USING btree ("timestamp");