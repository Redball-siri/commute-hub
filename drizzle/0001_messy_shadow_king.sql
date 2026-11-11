CREATE TABLE `app_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`expires_at` text NOT NULL
);
