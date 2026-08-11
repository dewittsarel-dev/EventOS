ALTER TABLE "Resource"
ADD COLUMN "supplierAvailability" "SupplierProductAvailability",
ADD COLUMN "leadTimeDays" INTEGER,
ADD COLUMN "minimumOrderQuantity" DOUBLE PRECISION,
ADD COLUMN "deliveryAvailable" BOOLEAN,
ADD COLUMN "pickupAvailable" BOOLEAN,
ADD COLUMN "deliveryRadiusKm" DOUBLE PRECISION,
ADD COLUMN "deliveryFee" DOUBLE PRECISION;
