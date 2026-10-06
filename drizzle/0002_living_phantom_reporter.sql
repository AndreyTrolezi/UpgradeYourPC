CREATE TABLE `pc_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`build_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pc_history_user_created` ON `pc_history` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `revision` text DEFAULT '' NOT NULL;