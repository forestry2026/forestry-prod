/**
 * POST /api/admin/products/bulk-import
 *
 *   - Accepts .xlsx in `file` form field.
 *   - Row-per-variant layout: rows sharing the same SKU = same product.
 *     First row per SKU carries product-level fields; following rows only
 *     need variant fields.
 *   - `?dryRun=1` (or form field `dryRun=true`) → returns a preview only.
 *   - Otherwise → commits inside a Prisma transaction.
 *
 * Reference data (categories, colors, textures, finishes) is matched by name
 * (case-insensitive). Colors also match by RAL code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import { prisma }                     from '@/lib/prisma'
import { RAL_COLORS }                 from '@/lib/ral-colors'
import * as XLSX                      from 'xlsx'

export const runtime = 'nodejs'

type RowStatus = 'create' | 'update' | 'error'

/* Column order must match the template — 5 dropdown color slots replace the
   old single comma-separated Colors column. */
const COL = {
  sku:           0,
  name:          1,
  description:   2,
  isActive:      3,
  isFeatured:    4,
  categories:    5,
  color1:        6,
  color2:        7,
  color3:        8,
  color4:        9,
  color5:       10,
  textures:     11,
  finishes:     12,
  imageGroup:   13,
  variantName:  14,
  variantPrice: 15,
  topDia:       16, topDiaUnit:       17,
  bottomDia:    18, bottomDiaUnit:    19,
  height:       20, heightUnit:       21,
  width:        22, widthUnit:        23,
  length:       24, lengthUnit:       25,
  depth:        26, depthUnit:        27,
  wallThickness:28, wallThicknessUnit:29,
}

/* Dimensions presented in this order in the import — each tuple is [valueCol, unitCol, presetId, label]. */
const DIM_DEFS: Array<[number, number, string, string]> = [
  [COL.topDia,        COL.topDiaUnit,        'topDia',        'Top Diameter'],
  [COL.bottomDia,     COL.bottomDiaUnit,     'bottomDia',     'Bottom Diameter'],
  [COL.height,        COL.heightUnit,        'height',        'Height'],
  [COL.width,         COL.widthUnit,         'width',         'Width'],
  [COL.length,        COL.lengthUnit,        'length',        'Length'],
  [COL.depth,         COL.depthUnit,         'depth',         'Depth'],
  [COL.wallThickness, COL.wallThicknessUnit, 'wallThickness', 'Wall Thickness'],
]

interface VariantData {
  rowNumber: number
  name:      string
  price:     number | null
  specifications: Array<{ id: string; name: string; value: number | null; unit: string | null }>
  errors:    string[]
}

interface ParsedProduct {
  sku:           string
  name:          string
  description:   string | null
  isActive:      boolean
  isFeatured:    boolean
  categoryIds:   string[]
  colorIds:      string[]
  textureIds:    string[]
  finishIds:     string[]
  imageUrls:     string[]
  variants:      VariantData[]
  // Result fields
  firstRow:      number
  status:        RowStatus
  errors:        string[]
  existingId?:   string | null
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}
function asYesNo(v: unknown, defaultValue: boolean): boolean {
  const s = asString(v).toLowerCase()
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return true
  if (s === 'no'  || s === 'n' || s === 'false'|| s === '0') return false
  return defaultValue
}
function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}
function splitList(v: unknown): string[] {
  return asString(v).split(',').map(s => s.trim()).filter(Boolean)
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `id-${Date.now()}`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  let dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dryRun') === 'true'

  let file: File | null = null
  let imageMap: Record<string, string> = {}
  try {
    const form = await req.formData()
    file = form.get('file') as File | null
    if (!dryRun) {
      const dr = form.get('dryRun')
      if (dr === '1' || dr === 'true') dryRun = true
    }
    const raw = form.get('imageMap')
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string' && v) imageMap[k.toLowerCase()] = v
          }
        }
      } catch { /* ignore malformed map */ }
    }
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  /* Index uploaded filenames by (group, suffix) for naming-convention lookups.
     Filename pattern: <group><letter(s)>.<ext>  e.g. 1a.jpg, 2b.png, pot-a.webp */
  const IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif)$/i
  type ImageEntry = { group: string; suffix: string; url: string }
  const imageIndex: ImageEntry[] = []
  for (const [filename, url] of Object.entries(imageMap)) {
    if (!IMAGE_EXTS.test(filename)) continue
    const base = filename.replace(IMAGE_EXTS, '')
    // Suffix = trailing letters (a, b, c, … or aa, ab). Group = everything before.
    const m = base.match(/^(.*?)([a-z]+)$/i)
    if (!m) continue
    const group  = m[1].toLowerCase().replace(/[-_\s]+$/, '')
    const suffix = m[2].toLowerCase()
    if (!group) continue
    imageIndex.push({ group, suffix, url })
  }
  function resolveImagesForGroup(token: string): string[] {
    const key = token.toLowerCase().replace(/[-_\s]+$/, '')
    const matches = imageIndex.filter(e => e.group === key)
    matches.sort((a, b) => a.suffix.localeCompare(b.suffix)) // 'a' before 'b'
    return matches.map(m => m.url)
  }

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  let wb: XLSX.WorkBook
  try { wb = XLSX.read(buf, { type: 'buffer' }) }
  catch { return NextResponse.json({ error: 'Could not read Excel file' }, { status: 400 }) }

  const sheet = wb.Sheets['Products'] ?? wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return NextResponse.json({ error: 'No Products sheet found' }, { status: 400 })

  const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

  const [categories, colors, textures, finishes, existingProducts] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.color.findMany({    select: { id: true, name: true, ralCode: true } }),
    prisma.texture.findMany({  select: { id: true, name: true } }),
    prisma.finish.findMany({   select: { id: true, name: true } }),
    prisma.product.findMany({  select: { id: true, sku: true } }),
  ])

  const byName = <T extends { id: string; name: string }>(arr: T[]) =>
    new Map(arr.map(x => [x.name.toLowerCase(), x.id]))
  const catMap = byName(categories)
  const txtMap = byName(textures)
  const finMap = byName(finishes)
  const colNameMap = byName(colors)
  const colRalMap  = new Map(colors.filter(c => c.ralCode).map(c => [c.ralCode!.toLowerCase().replace(/\s+/g, ''), c.id]))
  const ralCanonical = new Map(RAL_COLORS.map(r => [r.code.toLowerCase().replace(/\s+/g, ''), r]))

  /* Auto-provision a Color row for a canonical RAL entry that isn't yet in the
     DB. Called lazily during preview (no-op write in dry-run) and during commit. */
  async function ensureRalColor(ralKey: string): Promise<string | null> {
    const canon = ralCanonical.get(ralKey)
    if (!canon) return null
    const existing = await prisma.color.findFirst({ where: { ralCode: canon.code }, select: { id: true } })
    if (existing) {
      colRalMap.set(ralKey, existing.id)
      colNameMap.set(canon.name.toLowerCase(), existing.id)
      return existing.id
    }
    const created = await prisma.color.create({
      data: { name: canon.name, hexCode: canon.hex, ralCode: canon.code, isActive: true },
      select: { id: true },
    })
    colRalMap.set(ralKey, created.id)
    colNameMap.set(canon.name.toLowerCase(), created.id)
    return created.id
  }
  const existingBySku = new Map(existingProducts.map(p => [p.sku.toLowerCase(), p.id]))

  /* ── Group rows by SKU into products ──────────────────────────── */
  const products = new Map<string, ParsedProduct>()

  for (let i = 2; i < aoa.length; i++) { // skip header (0) + hints (1)
    const r = aoa[i]
    if (!r || r.every(v => asString(v) === '')) continue

    const sku = asString(r[COL.sku])
    if (!sku) continue // skip rows with no SKU silently

    const skuKey = sku.toLowerCase()
    let product = products.get(skuKey)

    if (!product) {
      // First row for this SKU — build product-level fields.
      product = {
        sku,
        name:        asString(r[COL.name]),
        description: asString(r[COL.description]) || null,
        isActive:    asYesNo(r[COL.isActive],   true),
        isFeatured:  asYesNo(r[COL.isFeatured], false),
        categoryIds: [],
        colorIds:    [],
        textureIds:  [],
        finishIds:   [],
        imageUrls:   [],
        variants:    [],
        firstRow:    i + 1,
        status:      'create',
        errors:      [],
      }

      // Resolve joins
      for (const cn of splitList(r[COL.categories])) {
        const id = catMap.get(cn.toLowerCase())
        if (id) product.categoryIds.push(id)
        else    product.errors.push(`Unknown category "${cn}"`)
      }
      // Up to 5 color dropdown slots — each cell carries "RAL XXXX — Name".
      for (const slot of ['color1','color2','color3','color4','color5'] as const) {
        const raw = asString(r[COL[slot]])
        if (!raw) continue
        // Picker label is "RAL XXXX — Name"; either side resolves.
        const ralPart  = raw.split('—')[0]?.trim() ?? raw
        const namePart = raw.split('—')[1]?.trim() ?? raw
        const ralKey = ralPart.toLowerCase().replace(/\s+/g, '')
        let id: string | undefined =
          colRalMap.get(ralKey) ??
          colNameMap.get(namePart.toLowerCase()) ??
          colNameMap.get(raw.toLowerCase())
        // Not in DB but is a canonical RAL? Auto-provision the Color row.
        if (!id && ralCanonical.has(ralKey)) {
          if (dryRun) {
            // Dry-run: don't write, but accept the pick — commit phase will create it.
            id = `ral-pending:${ralKey}`
          } else {
            const newId = await ensureRalColor(ralKey)
            if (newId) id = newId
          }
        }
        if (id) {
          if (!product.colorIds.includes(id)) product.colorIds.push(id)
        } else {
          product.errors.push(`Unknown color "${raw}"`)
        }
      }
      for (const tn of splitList(r[COL.textures])) {
        const id = txtMap.get(tn.toLowerCase())
        if (id) product.textureIds.push(id)
        else    product.errors.push(`Unknown texture "${tn}"`)
      }
      for (const fn of splitList(r[COL.finishes])) {
        const id = finMap.get(fn.toLowerCase())
        if (id) product.finishIds.push(id)
        else    product.errors.push(`Unknown finish "${fn}"`)
      }

      // Image Group: either a full https URL (single image) or a filename prefix
      // resolved against uploaded files (1a.jpg, 1b.jpg, …).
      const groupRaw = asString(r[COL.imageGroup])
      if (groupRaw) {
        if (/^https?:\/\//i.test(groupRaw)) {
          product.imageUrls.push(groupRaw)
        } else {
          const urls = resolveImagesForGroup(groupRaw)
          if (urls.length === 0) {
            product.errors.push(`No uploaded images match group "${groupRaw}" — expected files like "${groupRaw}a.jpg", "${groupRaw}b.jpg".`)
          } else {
            product.imageUrls.push(...urls)
          }
        }
      }

      // Validate required product-level fields exist on the first row.
      if (!product.name) product.errors.push('Product Name required on first row of each SKU')

      const existingId = existingBySku.get(skuKey)
      if (existingId) product.existingId = existingId

      products.set(skuKey, product)
    }

    /* Variant — every row contributes one variant. */
    const variantName  = asString(r[COL.variantName])
    const variantPrice = asNumber(r[COL.variantPrice])
    const variant: VariantData = {
      rowNumber: i + 1,
      name:      variantName,
      price:     variantPrice,
      specifications: [],
      errors:    [],
    }

    if (!variantName)  variant.errors.push(`Row ${i + 1}: Variant Name required`)
    if (variantPrice === null) variant.errors.push(`Row ${i + 1}: Price required (number)`)

    for (const [valCol, unitCol, presetId, label] of DIM_DEFS) {
      const value = asNumber(r[valCol])
      const unit  = asString(r[unitCol])
      if (value === null && !unit) continue // skip if both empty
      if (value === null) {
        variant.errors.push(`Row ${i + 1}: ${label} unit set but value empty`)
        continue
      }
      variant.specifications.push({
        id:    presetId,
        name:  label,
        value,
        unit:  unit || 'cm',
      })
    }

    product.variants.push(variant)
    // Surface variant errors into product errors for preview.
    product.errors.push(...variant.errors)
  }

  /* ── Finalize statuses ────────────────────────────────────────── */
  const productList: ParsedProduct[] = []
  let rowsCreated = 0, rowsUpdated = 0, rowsError = 0

  for (const product of products.values()) {
    if (product.variants.length === 0) {
      product.errors.push('No variants — every SKU needs at least one variant row')
    }
    if (product.errors.length > 0) {
      product.status = 'error'; rowsError++
    } else if (product.existingId) {
      product.status = 'update'; rowsUpdated++
    } else {
      product.status = 'create'; rowsCreated++
    }
    productList.push(product)
  }

  const summary = { total: productList.length, create: rowsCreated, update: rowsUpdated, error: rowsError }

  /* Shape products for the UI preview (lightweight projection). */
  const previewRows = productList.map(p => ({
    rowNumber:   p.firstRow,
    sku:         p.sku,
    name:        p.name,
    status:      p.status,
    errors:      p.errors,
    categoryIds: p.categoryIds,
    colorIds:    p.colorIds,
    textureIds:  p.textureIds,
    finishIds:   p.finishIds,
    imageUrls:   p.imageUrls,
    variantCount: p.variants.length,
  }))

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun: true, summary, rows: previewRows })
  }

  const writable = productList.filter(p => p.status !== 'error')
  if (writable.length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid products to import.', summary, rows: previewRows }, { status: 400 })
  }

  /* ── Commit transaction ───────────────────────────────────────── */
  let imported = 0
  await prisma.$transaction(async (tx) => {
    for (const p of writable) {
      // Compose the variants JSON identical to what DimensionSpecifications writes.
      const variantsJson = p.variants.map(v => ({
        id:    `v-${slugify(v.name)}`,
        name:  v.name,
        price: v.price,
        specifications: v.specifications,
      }))

      const productData = {
        sku:            p.sku,
        name:           p.name,
        description:    p.description,
        // Single basePrice from first variant for convenience (legacy field).
        basePrice:      p.variants[0]?.price ?? null,
        isActive:       p.isActive,
        isFeatured:     p.isFeatured,
        specifications: JSON.stringify(variantsJson),
      }

      let productId: string
      if (p.existingId) {
        await tx.product.update({ where: { id: p.existingId }, data: productData })
        productId = p.existingId
        await tx.productCategory.deleteMany({ where: { productId } })
        await tx.productColor.deleteMany({    where: { productId } })
        await tx.productTexture.deleteMany({  where: { productId } })
        await tx.productFinish.deleteMany({   where: { productId } })
      } else {
        const created = await tx.product.create({ data: productData })
        productId = created.id
      }

      if (p.categoryIds.length) await tx.productCategory.createMany({ data: p.categoryIds.map(categoryId => ({ productId, categoryId })) })
      if (p.colorIds.length)    await tx.productColor.createMany({    data: p.colorIds.map(colorId => ({ productId, colorId })) })
      if (p.textureIds.length)  await tx.productTexture.createMany({  data: p.textureIds.map(textureId => ({ productId, textureId })) })
      if (p.finishIds.length)   await tx.productFinish.createMany({   data: p.finishIds.map(finishId => ({ productId, finishId })) })

      if (p.imageUrls.length) {
        await tx.productImage.deleteMany({ where: { productId } })
        await tx.productImage.createMany({
          data: p.imageUrls.map((url, idx) => ({
            productId, url, isPrimary: idx === 0, sortOrder: idx,
          })),
        })
      }

      imported++
    }
  })

  return NextResponse.json({ ok: true, dryRun: false, summary, imported, skipped: rowsError, rows: previewRows })
}
