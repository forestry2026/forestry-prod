import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin User ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_SETUP_PASSWORD || 'Admin123!',
    12
  )

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_SETUP_EMAIL || 'admin@forestry.ae' },
    update: {},
    create: {
      email:        process.env.ADMIN_SETUP_EMAIL || 'admin@forestry.ae',
      name:         process.env.ADMIN_SETUP_NAME  || 'System Admin',
      passwordHash: adminPassword,
      role:         'ADMIN',
      isActive:     true,
    },
  })
  console.log('✅ Admin user:', admin.email)

  // ── Dimensions ──────────────────────────────────────────────
  const dimensions = [
    { name: 'Small',       width: 20, height: 20, depth: 25, label: '20cm × 20cm × 25cm', sortOrder: 1 },
    { name: 'Medium',      width: 30, height: 30, depth: 35, label: '30cm × 30cm × 35cm', sortOrder: 2 },
    { name: 'Large',       width: 40, height: 40, depth: 50, label: '40cm × 40cm × 50cm', sortOrder: 3 },
    { name: 'Extra Large', width: 60, height: 60, depth: 70, label: '60cm × 60cm × 70cm', sortOrder: 4 },
    { name: 'Custom',      width: null, height: null, depth: null, label: 'Custom Dimensions', sortOrder: 5 },
  ]

  for (const dim of dimensions) {
    await prisma.dimension.upsert({
      where:  { id: dim.name.toLowerCase().replace(' ', '-') },
      update: {},
      create: { id: dim.name.toLowerCase().replace(' ', '-'), ...dim, isActive: true },
    })
  }
  console.log('✅ Dimensions seeded')

  // ── Colors ──────────────────────────────────────────────────
  const colors = [
    { name: 'Terracotta',    hexCode: '#B35C2A', sortOrder: 1 },
    { name: 'Slate Grey',    hexCode: '#4A5568', sortOrder: 2 },
    { name: 'Charcoal Black',hexCode: '#1A202C', sortOrder: 3 },
    { name: 'Natural White', hexCode: '#F7FAFC', sortOrder: 4 },
    { name: 'Sand Beige',    hexCode: '#D4A574', sortOrder: 5 },
    { name: 'Forest Green',  hexCode: '#2D5016', sortOrder: 6 },
    { name: 'Ocean Blue',    hexCode: '#2B6CB0', sortOrder: 7 },
    { name: 'Rust Orange',   hexCode: '#C05621', sortOrder: 8 },
  ]

  for (const color of colors) {
    await prisma.color.upsert({
      where:  { id: color.name.toLowerCase().replace(/ /g, '-') },
      update: {},
      create: { id: color.name.toLowerCase().replace(/ /g, '-'), ...color, isActive: true },
    })
  }
  console.log('✅ Colors seeded')

  // ── Textures ────────────────────────────────────────────────
  const textures = [
    { name: 'Smooth',   description: 'Clean, polished surface',     sortOrder: 1 },
    { name: 'Ribbed',   description: 'Horizontal ribbed pattern',    sortOrder: 2 },
    { name: 'Hammered', description: 'Hand-hammered texture',        sortOrder: 3 },
    { name: 'Brushed',  description: 'Subtle brushed lines',        sortOrder: 4 },
    { name: 'Rustic',   description: 'Natural rough texture',        sortOrder: 5 },
    { name: 'Woven',    description: 'Basket weave pattern',         sortOrder: 6 },
  ]

  for (const texture of textures) {
    await prisma.texture.upsert({
      where:  { id: texture.name.toLowerCase() },
      update: {},
      create: { id: texture.name.toLowerCase(), ...texture, isActive: true },
    })
  }
  console.log('✅ Textures seeded')

  // ── Finishes ────────────────────────────────────────────────
  const finishes = [
    { name: 'Matte',     description: 'Non-reflective finish',      sortOrder: 1 },
    { name: 'Satin',     description: 'Subtle sheen',               sortOrder: 2 },
    { name: 'Glossy',    description: 'High shine reflective',      sortOrder: 3 },
    { name: 'Weathered', description: 'Aged patina look',           sortOrder: 4 },
    { name: 'Natural',   description: 'Raw unfinished look',        sortOrder: 5 },
  ]

  for (const finish of finishes) {
    await prisma.finish.upsert({
      where:  { id: finish.name.toLowerCase() },
      update: {},
      create: { id: finish.name.toLowerCase(), ...finish, isActive: true },
    })
  }
  console.log('✅ Finishes seeded')

  // ── Products ─────────────────────────────────────────────────
  const products = [
    { sku: 'FP-CYL-001', name: 'Classic Cylinder Pot', description: 'Timeless cylindrical design perfect for indoor plants and small trees. Hand-crafted with precision for residential and commercial use.', category: 'Cylinder', basePrice: 250, isActive: true, isFeatured: true },
    { sku: 'FP-SQR-001', name: 'Modern Square Planter', description: 'Contemporary square design ideal for modern interiors and commercial spaces. Perfect for corner installations and linear arrangements.', category: 'Square', basePrice: 280, isActive: true, isFeatured: true },
    { sku: 'FP-RND-001', name: 'Round Bowl Pot', description: 'Elegant bowl-shaped pot for succulents and low-growing plants. Shallow depth makes it ideal for office and retail displays.', category: 'Bowl', basePrice: 220, isActive: true, isFeatured: true },
    { sku: 'FP-RCT-001', name: 'Rectangular Trough', description: 'Long rectangular planter perfect for hedges and linear arrangements. Ideal for commercial landscaping and modern garden designs.', category: 'Trough', basePrice: 320, isActive: true, isFeatured: true },
    { sku: 'FP-CON-001', name: 'Conical Tapered Pot', description: 'Elegant tapered design with wider top for statement plants. Makes a striking visual impact in any setting.', category: 'Conical', basePrice: 290, isActive: true, isFeatured: true },
    { sku: 'FP-HEX-001', name: 'Hexagonal Planter', description: 'Modern geometric hexagonal design that clusters beautifully in commercial installations. Perfect for creating visual patterns.', category: 'Geometric', basePrice: 310, isActive: true, isFeatured: true },
    { sku: 'FP-OVA-001', name: 'Oval Elegance Pot', description: 'Sophisticated oval shape that adds architectural interest to any space. Premium hand-finished ceramic construction.', category: 'Oval', basePrice: 270, isActive: true, isFeatured: true },
    { sku: 'FP-TAP-001', name: 'Tapered Cylinder XL', description: 'Extra-large tapered cylinder for statement installations. Perfect for lobbies, atriums, and large commercial spaces.', category: 'Cylinder', basePrice: 420, isActive: true, isFeatured: true },
  ]

  const createdProducts = []
  for (const product of products) {
    const createdProduct = await prisma.product.upsert({
      where:  { sku: product.sku },
      update: {},
      create: product,
    })
    createdProducts.push(createdProduct)
  }
  console.log('✅ Products seeded')

  // ── Product Images ──────────────────────────────────────────
  const productImages = [
    { sku: 'FP-CYL-001', images: [
      { url: '/images/products/cylinder-front.jpg', alt: 'Classic Cylinder Pot - Front View', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/cylinder-side.jpg', alt: 'Classic Cylinder Pot - Side View', isPrimary: false, sortOrder: 2 },
      { url: '/images/products/cylinder-detail.jpg', alt: 'Classic Cylinder Pot - Detail', isPrimary: false, sortOrder: 3 },
    ]},
    { sku: 'FP-SQR-001', images: [
      { url: '/images/products/square-front.jpg', alt: 'Modern Square Planter - Front View', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/square-corner.jpg', alt: 'Modern Square Planter - Corner View', isPrimary: false, sortOrder: 2 },
      { url: '/images/products/square-interior.jpg', alt: 'Modern Square Planter - Interior', isPrimary: false, sortOrder: 3 },
    ]},
    { sku: 'FP-RND-001', images: [
      { url: '/images/products/bowl-top.jpg', alt: 'Round Bowl Pot - Top View', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/bowl-side.jpg', alt: 'Round Bowl Pot - Side View', isPrimary: false, sortOrder: 2 },
    ]},
    { sku: 'FP-RCT-001', images: [
      { url: '/images/products/trough-front.jpg', alt: 'Rectangular Trough - Front View', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/trough-perspective.jpg', alt: 'Rectangular Trough - Perspective', isPrimary: false, sortOrder: 2 },
      { url: '/images/products/trough-group.jpg', alt: 'Rectangular Trough - Group Installation', isPrimary: false, sortOrder: 3 },
    ]},
    { sku: 'FP-CON-001', images: [
      { url: '/images/products/conical-front.jpg', alt: 'Conical Tapered Pot - Front View', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/conical-detail.jpg', alt: 'Conical Tapered Pot - Detail', isPrimary: false, sortOrder: 2 },
    ]},
    { sku: 'FP-HEX-001', images: [
      { url: '/images/products/hex-single.jpg', alt: 'Hexagonal Planter - Single', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/hex-cluster.jpg', alt: 'Hexagonal Planter - Clustered', isPrimary: false, sortOrder: 2 },
    ]},
    { sku: 'FP-OVA-001', images: [
      { url: '/images/products/oval-front.jpg', alt: 'Oval Elegance Pot - Front', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/oval-side.jpg', alt: 'Oval Elegance Pot - Side', isPrimary: false, sortOrder: 2 },
    ]},
    { sku: 'FP-TAP-001', images: [
      { url: '/images/products/taper-xl-front.jpg', alt: 'Tapered Cylinder XL - Front', isPrimary: true, sortOrder: 1 },
      { url: '/images/products/taper-xl-lobby.jpg', alt: 'Tapered Cylinder XL - Lobby Installation', isPrimary: false, sortOrder: 2 },
    ]},
  ]

  for (const productImageSet of productImages) {
    const product = createdProducts.find(p => p.sku === productImageSet.sku)
    if (product) {
      for (const img of productImageSet.images) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          },
        })
      }
    }
  }
  console.log('✅ Product images seeded')

  // ── Fetch all attributes for linking ─────────────────────────
  const fetchedDimensions = await prisma.dimension.findMany()
  const fetchedColors = await prisma.color.findMany()
  const fetchedTextures = await prisma.texture.findMany()
  const fetchedFinishes = await prisma.finish.findMany()

  // ── Link Products to Dimensions ──────────────────────────────
  const dimensionLinks = []
  for (const product of createdProducts) {
    for (const dimension of fetchedDimensions) {
      dimensionLinks.push({
        productId: product.id,
        dimensionId: dimension.id,
      })
    }
  }
  try {
    await prisma.productDimension.createMany({
      data: dimensionLinks,
    })
  } catch (e) {
    // Ignore duplicates
  }
  console.log('✅ Product-Dimension links seeded')

  // ── Link Products to Colors ──────────────────────────────────
  const colorLinks = []
  for (const product of createdProducts) {
    for (const color of fetchedColors) {
      colorLinks.push({
        productId: product.id,
        colorId: color.id,
      })
    }
  }
  try {
    await prisma.productColor.createMany({
      data: colorLinks,
    })
  } catch (e) {
    // Ignore duplicates
  }
  console.log('✅ Product-Color links seeded')

  // ── Link Products to Textures ────────────────────────────────
  const textureLinks = []
  for (const product of createdProducts) {
    for (const texture of fetchedTextures) {
      textureLinks.push({
        productId: product.id,
        textureId: texture.id,
      })
    }
  }
  try {
    await prisma.productTexture.createMany({
      data: textureLinks,
    })
  } catch (e) {
    // Ignore duplicates
  }
  console.log('✅ Product-Texture links seeded')

  // ── Link Products to Finishes ────────────────────────────────
  const finishLinks = []
  for (const product of createdProducts) {
    for (const finish of fetchedFinishes) {
      finishLinks.push({
        productId: product.id,
        finishId: finish.id,
      })
    }
  }
  try {
    await prisma.productFinish.createMany({
      data: finishLinks,
    })
  } catch (e) {
    // Ignore duplicates
  }
  console.log('✅ Product-Finish links seeded')

  // ── Vendor Users & Profiles ─────────────────────────────────────────────
  const vendorUsers = [
    { email: 'contact@aljazeera.ae', name: 'Ahmed Al Mansouri', phone: '+971-4-123-4567' },
    { email: 'sales@emiratespottery.ae', name: 'Fatima Al Maktoum', phone: '+971-4-234-5678' },
    { email: 'info@gulfclay.ae', name: 'Mohammed Al Zaabi', phone: '+971-4-345-6789' },
  ]

  const vendorProfiles = []
  for (const vendorUser of vendorUsers) {
    const vendorPasswordHash = await bcrypt.hash('Vendor123!', 12)

    const user = await prisma.user.upsert({
      where: { email: vendorUser.email },
      update: {},
      create: {
        email: vendorUser.email,
        name: vendorUser.name,
        phone: vendorUser.phone,
        passwordHash: vendorPasswordHash,
        role: 'VENDOR',
        isActive: true,
      },
    })

    const vendorProfile = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: vendorUser.email.split('@')[0].replace(/[.-]/g, ' ').toUpperCase(),
        tradeLicense: `TL-${Math.random().toString(36).substring(7).toUpperCase()}`,
        status: ['APPROVED', 'PENDING'][Math.floor(Math.random() * 2)] as 'APPROVED' | 'PENDING',
        approvedAt: Math.random() > 0.5 ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
      },
    })
    vendorProfiles.push(vendorProfile)
  }
  console.log('✅ Vendor profiles seeded')

  // ── RFPs ────────────────────────────────────────────────────────────────
  const rfps = []
  for (let i = 0; i < 4; i++) {
    const vendor = vendorProfiles[i % vendorProfiles.length]
    const rfpNumber = `RFP-2026-${String(i + 1).padStart(4, '0')}`

    try {
      const rfp = await prisma.rfp.upsert({
        where: { rfpNumber },
        update: {},
        create: {
          rfpNumber,
          vendorProfileId: vendor.id,
          projectName: ['Spring Collection Upgrade', 'Summer Project', 'Commercial Installation', 'Residential Design'][i],
          projectLocation: ['Dubai Marina', 'Abu Dhabi Downtown', 'Sharjah Creek', 'Ajman Waterfront'][i],
          deliveryAddress: [`Dubai, UAE`, `Abu Dhabi, UAE`, `Sharjah, UAE`, `Ajman, UAE`][i],
          status: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'QUOTED'][i] as any,
          notes: 'Request for custom ceramic pots with specific dimensions and finishes',
          submittedAt: new Date(Date.now() - (4 - i) * 7 * 24 * 60 * 60 * 1000),
        },
      })
      rfps.push(rfp)
    } catch (e) {
      // Skip if already exists
    }
  }
  console.log('✅ RFPs seeded')

  // ── RFP Items ───────────────────────────────────────────────────────────
  const allProducts = await prisma.product.findMany()
  const allDimensions = await prisma.dimension.findMany()
  const allColors = await prisma.color.findMany()
  const allTextures = await prisma.texture.findMany()
  const allFinishes = await prisma.finish.findMany()

  for (let rfpIndex = 0; rfpIndex < rfps.length; rfpIndex++) {
    const rfp = rfps[rfpIndex]
    const itemCount = 2 + rfpIndex

    for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
      const product = allProducts[itemIndex % allProducts.length]
      const dimension = allDimensions[itemIndex % allDimensions.length]
      const color = allColors[itemIndex % allColors.length]
      const texture = allTextures[itemIndex % allTextures.length]
      const finish = allFinishes[itemIndex % allFinishes.length]

      await prisma.rfpItem.create({
        data: {
          rfpId: rfp.id,
          productId: product.id,
          dimensionId: dimension.id !== 'custom' ? dimension.id : null,
          colorId: color.id,
          textureId: texture.id,
          finishId: finish.id,
          quantity: 10 + Math.floor(Math.random() * 40),
          notes: `Custom specification for ${product.name}`,
          customWidth: dimension.id === 'custom' ? 50 + Math.random() * 30 : null,
          customHeight: dimension.id === 'custom' ? 50 + Math.random() * 30 : null,
          customDepth: dimension.id === 'custom' ? 50 + Math.random() * 30 : null,
        },
      })
    }
  }
  console.log('✅ RFP items seeded')

  console.log('\n🎉 Database seeding complete!')
  console.log(`\n📋 Admin credentials:`)
  console.log(`   Email:    ${admin.email}`)
  console.log(`   Password: ${process.env.ADMIN_SETUP_PASSWORD || 'Admin123!'}`)
  console.log(`\n⚠️  Change the admin password immediately after first login!`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
