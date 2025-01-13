-- First, clear existing data
TRUNCATE "tool_calls", "messages", "threads" CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    "email" varchar(255) NOT NULL,
    "name" varchar(255),
    "google_id" varchar(255),
    "profile_picture" text,
    "refresh_token_version" integer DEFAULT 1 NOT NULL,
    "subscription_status" varchar(50) DEFAULT 'inactive',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "users_email_unique" UNIQUE("email"),
    CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);

-- Drop existing foreign key constraints
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_thread_id_threads_id_fk";
ALTER TABLE "tool_calls" DROP CONSTRAINT IF EXISTS "tool_calls_message_id_messages_id_fk";

-- Add new columns (with NOT NULL since we're starting fresh)
ALTER TABLE "threads" ADD COLUMN "user_id" uuid NOT NULL;
ALTER TABLE "messages" ADD COLUMN "user_id" uuid NOT NULL;
ALTER TABLE "threads" ADD COLUMN "title" varchar(255);

-- Update default timestamps
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "threads" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "threads" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "tool_calls" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "tool_calls" ALTER COLUMN "updated_at" SET DEFAULT now();

-- Add back the foreign key constraints
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" 
    FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_message_id_messages_id_fk" 
    FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE cascade ON UPDATE no action;