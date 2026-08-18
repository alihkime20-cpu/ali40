CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`externalId` varchar(512) NOT NULL,
	`slug` varchar(300) NOT NULL,
	`title` varchar(500) NOT NULL,
	`summary` text,
	`content` text,
	`sourceName` varchar(160) NOT NULL,
	`sourceUrl` varchar(1000) NOT NULL,
	`imageUrl` varchar(1000),
	`category` enum('politics','economy','sports','technology','health','culture','world','science','lifestyle') NOT NULL DEFAULT 'world',
	`publishedAt` timestamp NOT NULL,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`isBreaking` boolean NOT NULL DEFAULT false,
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_source_external_idx` UNIQUE(`sourceId`,`externalId`),
	CONSTRAINT `news_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `news_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`feedUrl` varchar(500) NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'ar',
	`category` enum('politics','economy','sports','technology','health','culture','world','science','lifestyle') NOT NULL DEFAULT 'world',
	`isActive` boolean NOT NULL DEFAULT true,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_sources_feedUrl_unique` UNIQUE(`feedUrl`)
);
--> statement-breakpoint
CREATE INDEX `news_published_idx` ON `news` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `news_category_idx` ON `news` (`category`);--> statement-breakpoint
CREATE INDEX `news_sources_category_idx` ON `news_sources` (`category`);--> statement-breakpoint
CREATE INDEX `news_sources_schedule_uid_idx` ON `news_sources` (`scheduleCronTaskUid`);