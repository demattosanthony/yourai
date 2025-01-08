PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`content_type` text NOT NULL,
	`content` text NOT NULL,
	`name` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "thread_id", "role", "content_type", "content", "name", "created_at") SELECT "id", "thread_id", "role", "content_type", "content", "name", "created_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;