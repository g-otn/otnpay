CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'withdrawal');--> statement-breakpoint
CREATE TABLE "accounts" (
	"account_id" integer,
	"balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_account_id_unique" UNIQUE("account_id"),
	CONSTRAINT "accounts_balance_non_negative" CHECK ("accounts"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"account_id" integer NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"type" "transaction_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_account_id_idx" ON "accounts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_timestamp_idx" ON "transactions" USING btree ("timestamp");