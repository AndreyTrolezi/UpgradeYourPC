CREATE TABLE `extension_installs` (
	`user_id` text NOT NULL,
	`plugin_id` text NOT NULL,
	`manifest_json` text NOT NULL,
	`enabled` text DEFAULT '1' NOT NULL,
	`installed_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `plugin_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_extension_installs_user` ON `extension_installs` (`user_id`);--> statement-breakpoint
CREATE TABLE `saved_builds` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`build_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_saved_builds_user_updated` ON `saved_builds` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`profile_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
