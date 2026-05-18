-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VENDOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VendorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeLicense" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'UAE',
    "website" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "rejectedAt" DATETIME,
    "rejectionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "tradeLicense" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "processedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "basePrice" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Dimension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "width" REAL,
    "height" REAL,
    "depth" REAL,
    "label" TEXT NOT NULL,
    "priceModifier" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hexCode" TEXT,
    "priceModifier" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Texture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceModifier" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Finish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceModifier" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProductDimension" (
    "productId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,

    PRIMARY KEY ("productId", "dimensionId")
);

-- CreateTable
CREATE TABLE "ProductColor" (
    "productId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,

    PRIMARY KEY ("productId", "colorId")
);

-- CreateTable
CREATE TABLE "ProductTexture" (
    "productId" TEXT NOT NULL,
    "textureId" TEXT NOT NULL,

    PRIMARY KEY ("productId", "textureId")
);

-- CreateTable
CREATE TABLE "ProductFinish" (
    "productId" TEXT NOT NULL,
    "finishId" TEXT NOT NULL,

    PRIMARY KEY ("productId", "finishId")
);

-- CreateTable
CREATE TABLE "Rfp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfpNumber" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "projectName" TEXT,
    "projectLocation" TEXT,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RfpItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfpId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dimensionId" TEXT,
    "colorId" TEXT,
    "textureId" TEXT,
    "finishId" TEXT,
    "customWidth" REAL,
    "customHeight" REAL,
    "customDepth" REAL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "unitPrice" REAL,
    "totalPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RfpQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfpId" TEXT NOT NULL,
    "quotedById" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "discount" REAL,
    "tax" REAL,
    "shipping" REAL,
    "total" REAL NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "terms" TEXT,
    "notes" TEXT,
    "sentAt" DATETIME,
    "viewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EnquiryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dimensionId" TEXT,
    "colorId" TEXT,
    "textureId" TEXT,
    "finishId" TEXT,
    "customWidth" REAL,
    "customHeight" REAL,
    "customDepth" REAL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_userId_key" ON "VendorProfile"("userId");

-- CreateIndex
CREATE INDEX "VendorProfile_status_idx" ON "VendorProfile"("status");

-- CreateIndex
CREATE INDEX "AccessRequest_status_idx" ON "AccessRequest"("status");

-- CreateIndex
CREATE INDEX "AccessRequest_email_idx" ON "AccessRequest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Rfp_rfpNumber_key" ON "Rfp"("rfpNumber");

-- CreateIndex
CREATE INDEX "Rfp_vendorProfileId_idx" ON "Rfp"("vendorProfileId");

-- CreateIndex
CREATE INDEX "Rfp_status_idx" ON "Rfp"("status");

-- CreateIndex
CREATE INDEX "Rfp_rfpNumber_idx" ON "Rfp"("rfpNumber");

-- CreateIndex
CREATE INDEX "RfpItem_rfpId_idx" ON "RfpItem"("rfpId");

-- CreateIndex
CREATE INDEX "RfpItem_productId_idx" ON "RfpItem"("productId");

-- CreateIndex
CREATE INDEX "RfpQuote_rfpId_idx" ON "RfpQuote"("rfpId");

-- CreateIndex
CREATE INDEX "EnquiryItem_userId_idx" ON "EnquiryItem"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
