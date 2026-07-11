-- AlterTable
ALTER TABLE `Order` ADD COLUMN `labelUrl` VARCHAR(191) NULL,
    ADD COLUMN `shippoRateId` VARCHAR(191) NULL,
    ADD COLUMN `trackingNumber` VARCHAR(191) NULL,
    ADD COLUMN `trackingUrl` VARCHAR(191) NULL;
