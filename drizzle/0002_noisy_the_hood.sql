ALTER TABLE `fundIndicators` ADD CONSTRAINT `fundIndicators_symbol_date_unique` UNIQUE(`fundSymbol`,`indicatorDate`);--> statement-breakpoint
ALTER TABLE `fundPrices` ADD CONSTRAINT `fundPrices_symbol_date_unique` UNIQUE(`fundSymbol`,`priceDate`);--> statement-breakpoint
ALTER TABLE `userSettings` ADD CONSTRAINT `userSettings_user_id_unique` UNIQUE(`userId`);