CREATE TABLE `fundIndicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fundSymbol` varchar(10) NOT NULL,
	`indicatorDate` date NOT NULL,
	`macdLine` decimal(10,6),
	`macdSignal` decimal(10,6),
	`macdHistogram` decimal(10,6),
	`momentum1Month` decimal(8,4),
	`momentum2Week` decimal(8,4),
	`momentum3Month` decimal(8,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fundIndicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fundPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fundSymbol` varchar(10) NOT NULL,
	`priceDate` date NOT NULL,
	`sharePrice` decimal(10,4) NOT NULL,
	`dailyPercentChange` decimal(8,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fundPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`darkMode` enum('light','dark','auto') NOT NULL DEFAULT 'auto',
	`selectedFunds` text NOT NULL DEFAULT ('G,C,S,I'),
	`lastDataUpdate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`)
);
