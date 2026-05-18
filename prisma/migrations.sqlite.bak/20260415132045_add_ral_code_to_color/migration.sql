-- AlterTable
ALTER TABLE "Color" ADD COLUMN "ralCode" TEXT;

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfpId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL,
    "total" REAL NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "terms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" DATETIME,
    "respondedAt" DATETIME,
    "vendorResponse" TEXT,
    "vendorNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "rfpItemId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimatedDays" INTEGER,
    "startDate" DATETIME,
    "estimatedCompletion" DATETIME,
    "actualCompletion" DATETIME,
    "managerApprovedBy" TEXT,
    "managerApprovedAt" DATETIME,
    "managerNotes" TEXT,
    "currentStage" TEXT NOT NULL DEFAULT 'PENDING',
    "productionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductionStatusLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productionOrderId" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "notes" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedByRole" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_rfpId_key" ON "Quotation"("rfpId");

-- CreateIndex
CREATE INDEX "Quotation_rfpId_idx" ON "Quotation"("rfpId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_createdBy_idx" ON "Quotation"("createdBy");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationItem_rfpItemId_idx" ON "QuotationItem"("rfpItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_quotationId_key" ON "ProductionOrder"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_orderNumber_key" ON "ProductionOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "ProductionOrder_quotationId_idx" ON "ProductionOrder"("quotationId");

-- CreateIndex
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");

-- CreateIndex
CREATE INDEX "ProductionOrder_orderNumber_idx" ON "ProductionOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "ProductionOrder_priority_idx" ON "ProductionOrder"("priority");

-- CreateIndex
CREATE INDEX "ProductionStatusLog_productionOrderId_idx" ON "ProductionStatusLog"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionStatusLog_updatedBy_idx" ON "ProductionStatusLog"("updatedBy");

-- CreateIndex
CREATE INDEX "ProductionStatusLog_createdAt_idx" ON "ProductionStatusLog"("createdAt");
