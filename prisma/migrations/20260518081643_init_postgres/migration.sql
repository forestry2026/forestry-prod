-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VENDOR',
    "permissions" TEXT DEFAULT '{}',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "onboardingState" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeLicense" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'UAE',
    "website" TEXT,
    "notes" TEXT,
    "documents" TEXT DEFAULT '[]',
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT,
    "tradeLicense" TEXT,
    "documents" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "basePrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "specifications" TEXT DEFAULT '[]',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFile" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSizeEnquiry" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "dimensions" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSizeEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryBasket" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryBasket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryBasketItem" (
    "id" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "productId" TEXT,
    "productSku" TEXT,
    "productName" TEXT NOT NULL,
    "variantName" TEXT,
    "colorName" TEXT,
    "textureName" TEXT,
    "finishName" TEXT,
    "dimensionId" TEXT,
    "colorId" TEXT,
    "textureId" TEXT,
    "finishId" TEXT,
    "customWidth" DOUBLE PRECISION,
    "customHeight" DOUBLE PRECISION,
    "customDepth" DOUBLE PRECISION,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryBasketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dimension" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "label" TEXT NOT NULL,
    "priceModifier" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hexCode" TEXT,
    "ralCode" TEXT,
    "priceModifier" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Texture" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceModifier" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Texture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceModifier" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDimension" (
    "productId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,

    CONSTRAINT "ProductDimension_pkey" PRIMARY KEY ("productId","dimensionId")
);

-- CreateTable
CREATE TABLE "ProductColor" (
    "productId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,

    CONSTRAINT "ProductColor_pkey" PRIMARY KEY ("productId","colorId")
);

-- CreateTable
CREATE TABLE "ProductTexture" (
    "productId" TEXT NOT NULL,
    "textureId" TEXT NOT NULL,

    CONSTRAINT "ProductTexture_pkey" PRIMARY KEY ("productId","textureId")
);

-- CreateTable
CREATE TABLE "ProductFinish" (
    "productId" TEXT NOT NULL,
    "finishId" TEXT NOT NULL,

    CONSTRAINT "ProductFinish_pkey" PRIMARY KEY ("productId","finishId")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "Rfp" (
    "id" TEXT NOT NULL,
    "rfpNumber" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "projectName" TEXT,
    "projectLocation" TEXT,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "source" TEXT NOT NULL DEFAULT 'VENDOR',
    "createdByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "quotationSentAt" TIMESTAMP(3),
    "quotationViewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "revisionRequest" TEXT,
    "productionStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "vendorDeleted" BOOLEAN NOT NULL DEFAULT false,
    "vendorDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpItem" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "productSku" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "dimensionId" TEXT,
    "colorId" TEXT,
    "textureId" TEXT,
    "finishId" TEXT,
    "customWidth" DOUBLE PRECISION,
    "customHeight" DOUBLE PRECISION,
    "customDepth" DOUBLE PRECISION,
    "variantName" TEXT,
    "variantPrice" DOUBLE PRECISION,
    "isCustomSize" BOOLEAN NOT NULL DEFAULT false,
    "customDimensions" TEXT,
    "customColorHex" TEXT,
    "customColorRal" TEXT,
    "customColorName" TEXT,
    "customTextureUrl" TEXT,
    "customFinishDesc" TEXT,
    "holesOption" TEXT,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfpItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpQuote" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "quotedById" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION,
    "tax" DOUBLE PRECISION,
    "shipping" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "terms" TEXT,
    "notes" TEXT,
    "productionDays" INTEGER,
    "deliveryDays" INTEGER,
    "deliveryCharges" DOUBLE PRECISION,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfpQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dimensionId" TEXT,
    "colorId" TEXT,
    "textureId" TEXT,
    "finishId" TEXT,
    "customWidth" DOUBLE PRECISION,
    "customHeight" DOUBLE PRECISION,
    "customDepth" DOUBLE PRECISION,
    "variantName" TEXT,
    "variantPrice" DOUBLE PRECISION,
    "isCustomSize" BOOLEAN NOT NULL DEFAULT false,
    "customDimensions" TEXT,
    "customColorHex" TEXT,
    "customColorRal" TEXT,
    "customColorName" TEXT,
    "customTextureUrl" TEXT,
    "customFinishDesc" TEXT,
    "holesOption" TEXT,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnquiryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfpNote" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfpNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "terms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "vendorResponse" TEXT,
    "vendorNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "rfpItemId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimatedDays" INTEGER,
    "startDate" TIMESTAMP(3),
    "estimatedCompletion" TIMESTAMP(3),
    "actualCompletion" TIMESTAMP(3),
    "managerApprovedBy" TEXT,
    "managerApprovedAt" TIMESTAMP(3),
    "managerNotes" TEXT,
    "currentStage" TEXT NOT NULL DEFAULT 'PENDING',
    "productionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionStatusLog" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "notes" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedByRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDesignRequest" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "colorId" TEXT,
    "textureId" TEXT,
    "finishId" TEXT,
    "customColorHex" TEXT,
    "customColorName" TEXT,
    "customColorRal" TEXT,
    "customTexture" TEXT,
    "customTextureUrl" TEXT,
    "dimensions" TEXT DEFAULT '[]',
    "holesOption" TEXT,
    "notes" TEXT,
    "referenceImages" TEXT DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDesignRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "HeroBanner" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subtext" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginSlide_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "ProductFile_productId_idx" ON "ProductFile"("productId");

-- CreateIndex
CREATE INDEX "CustomSizeEnquiry_productId_idx" ON "CustomSizeEnquiry"("productId");

-- CreateIndex
CREATE INDEX "CustomSizeEnquiry_status_idx" ON "CustomSizeEnquiry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnquiryBasket_vendorProfileId_key" ON "EnquiryBasket"("vendorProfileId");

-- CreateIndex
CREATE INDEX "EnquiryBasketItem_basketId_idx" ON "EnquiryBasketItem"("basketId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Rfp_rfpNumber_key" ON "Rfp"("rfpNumber");

-- CreateIndex
CREATE INDEX "Rfp_vendorProfileId_idx" ON "Rfp"("vendorProfileId");

-- CreateIndex
CREATE INDEX "Rfp_status_idx" ON "Rfp"("status");

-- CreateIndex
CREATE INDEX "Rfp_rfpNumber_idx" ON "Rfp"("rfpNumber");

-- CreateIndex
CREATE INDEX "Rfp_isArchived_idx" ON "Rfp"("isArchived");

-- CreateIndex
CREATE INDEX "RfpItem_rfpId_idx" ON "RfpItem"("rfpId");

-- CreateIndex
CREATE INDEX "RfpItem_productId_idx" ON "RfpItem"("productId");

-- CreateIndex
CREATE INDEX "RfpQuote_rfpId_idx" ON "RfpQuote"("rfpId");

-- CreateIndex
CREATE INDEX "EnquiryItem_userId_idx" ON "EnquiryItem"("userId");

-- CreateIndex
CREATE INDEX "RfpNote_rfpId_createdAt_idx" ON "RfpNote"("rfpId", "createdAt");

-- CreateIndex
CREATE INDEX "RfpNote_userId_idx" ON "RfpNote"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

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

-- CreateIndex
CREATE INDEX "CustomDesignRequest_vendorProfileId_idx" ON "CustomDesignRequest"("vendorProfileId");

-- CreateIndex
CREATE INDEX "CustomDesignRequest_status_idx" ON "CustomDesignRequest"("status");

-- CreateIndex
CREATE INDEX "HeroBanner_isActive_idx" ON "HeroBanner"("isActive");

-- CreateIndex
CREATE INDEX "HeroBanner_sortOrder_idx" ON "HeroBanner"("sortOrder");

-- CreateIndex
CREATE INDEX "LoginSlide_isActive_idx" ON "LoginSlide"("isActive");

-- CreateIndex
CREATE INDEX "LoginSlide_sortOrder_idx" ON "LoginSlide"("sortOrder");

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFile" ADD CONSTRAINT "ProductFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryBasket" ADD CONSTRAINT "EnquiryBasket_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryBasketItem" ADD CONSTRAINT "EnquiryBasketItem_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "EnquiryBasket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDimension" ADD CONSTRAINT "ProductDimension_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDimension" ADD CONSTRAINT "ProductDimension_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTexture" ADD CONSTRAINT "ProductTexture_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTexture" ADD CONSTRAINT "ProductTexture_textureId_fkey" FOREIGN KEY ("textureId") REFERENCES "Texture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFinish" ADD CONSTRAINT "ProductFinish_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFinish" ADD CONSTRAINT "ProductFinish_finishId_fkey" FOREIGN KEY ("finishId") REFERENCES "Finish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfp" ADD CONSTRAINT "Rfp_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpItem" ADD CONSTRAINT "RfpItem_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpItem" ADD CONSTRAINT "RfpItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpItem" ADD CONSTRAINT "RfpItem_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpItem" ADD CONSTRAINT "RfpItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpItem" ADD CONSTRAINT "RfpItem_textureId_fkey" FOREIGN KEY ("textureId") REFERENCES "Texture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpItem" ADD CONSTRAINT "RfpItem_finishId_fkey" FOREIGN KEY ("finishId") REFERENCES "Finish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpQuote" ADD CONSTRAINT "RfpQuote_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpQuote" ADD CONSTRAINT "RfpQuote_quotedById_fkey" FOREIGN KEY ("quotedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpNote" ADD CONSTRAINT "RfpNote_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfpNote" ADD CONSTRAINT "RfpNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "Rfp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_managerApprovedBy_fkey" FOREIGN KEY ("managerApprovedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStatusLog" ADD CONSTRAINT "ProductionStatusLog_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStatusLog" ADD CONSTRAINT "ProductionStatusLog_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDesignRequest" ADD CONSTRAINT "CustomDesignRequest_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
