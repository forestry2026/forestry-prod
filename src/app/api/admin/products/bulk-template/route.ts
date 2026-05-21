/**
 * GET /api/admin/products/bulk-template
 *
 * Generates a bulk-upload Excel template with row-per-variant layout + native
 * Excel dropdowns for unit columns + reference sheets for categories, colors,
 * textures, finishes.
 *
 * Layout — one product spans one OR MORE rows; rows with the same SKU are
 * grouped as variants. Product-level fields (Name, Description, Categories,
 * Colors, etc.) only need to be filled on the FIRST row of each SKU.
 */

import { NextResponse }      from 'next/server'
import { getServerSession }  from 'next-auth'
import { authOptions }       from '@/lib/auth'
import { prisma }            from '@/lib/prisma'
import { RAL_COLORS }        from '@/lib/ral-colors'
import ExcelJS               from 'exceljs'

export const runtime = 'nodejs'

const UNITS = ['cm', 'mm', 'm', 'inches', 'feet']
const YES_NO = ['yes', 'no']

/* Column layout — order matters; import API uses these same column indices. */
interface Col { key: string; header: string; width: number; hint: string; validation?: string[] }

const COLUMNS: Col[] = [
  // Product-level (fill on first row per SKU; leave blank on continuation rows)
  { key: 'sku',           header: 'SKU *',              width: 16, hint: 'Required. Same SKU on multiple rows = multiple variants of one product.' },
  { key: 'name',          header: 'Product Name *',     width: 28, hint: 'Required on first row per SKU.' },
  { key: 'description',   header: 'Description',        width: 40, hint: 'Optional. First row per SKU.' },
  { key: 'isActive',      header: 'Active',             width: 10, hint: 'yes / no — default yes', validation: YES_NO },
  { key: 'isFeatured',    header: 'Featured',           width: 11, hint: 'yes / no — default no',  validation: YES_NO },
  { key: 'categories',    header: 'Categories',         width: 24, hint: 'Comma-separated. See Categories sheet.' },
  // Up to 5 color slots — each cell has a dropdown sourced from the Colors sheet.
  { key: 'color1',        header: 'Color 1',            width: 26, hint: 'Pick from dropdown' },
  { key: 'color2',        header: 'Color 2',            width: 26, hint: 'Pick from dropdown' },
  { key: 'color3',        header: 'Color 3',            width: 26, hint: 'Pick from dropdown' },
  { key: 'color4',        header: 'Color 4',            width: 26, hint: 'Pick from dropdown' },
  { key: 'color5',        header: 'Color 5',            width: 26, hint: 'Pick from dropdown' },
  { key: 'textures',      header: 'Textures',           width: 22, hint: 'Comma-separated. See Textures sheet.' },
  { key: 'finishes',      header: 'Finishes',           width: 22, hint: 'Comma-separated. See Finishes sheet.' },
  { key: 'imageGroup',    header: 'Image Group',        width: 18, hint: 'Image filename prefix. Upload "1a.jpg" (primary), "1b.jpg", "1c.jpg" etc., then enter "1" here. Or paste a full https URL for a single image.' },

  // Variant-level (one row = one variant)
  { key: 'variantName',   header: 'Variant Name *',     width: 16, hint: 'Required. e.g. Small, Medium, Large.' },
  { key: 'variantPrice',  header: 'Price (AED) *',      width: 12, hint: 'Required. Number per variant.' },

  // Dimensions — value column followed by unit column. Unit columns get dropdowns.
  { key: 'topDia',        header: 'Top Diameter',       width: 10, hint: 'Number' },
  { key: 'topDiaUnit',    header: 'Unit',               width: 8,  hint: 'Pick from dropdown', validation: UNITS },
  { key: 'bottomDia',     header: 'Bottom Diameter',    width: 12, hint: 'Number' },
  { key: 'bottomDiaUnit', header: 'Unit',               width: 8,  hint: 'Pick from dropdown', validation: UNITS },
  { key: 'height',        header: 'Height',             width: 10, hint: 'Number' },
  { key: 'heightUnit',    header: 'Unit',               width: 8,  hint: 'Pick from dropdown', validation: UNITS },
  { key: 'width',         header: 'Width',              width: 10, hint: 'Number' },
  { key: 'widthUnit',     header: 'Unit',               width: 8,  hint: 'Pick from dropdown', validation: UNITS },
  { key: 'length',        header: 'Length',             width: 10, hint: 'Number' },
  { key: 'lengthUnit',    header: 'Unit',               width: 8,  hint: 'Pick from dropdown', validation: UNITS },
  { key: 'depth',         header: 'Depth',              width: 10, hint: 'Number' },
  { key: 'depthUnit',     header: 'Unit',               width: 8,  hint: 'Pick from dropdown', validation: UNITS },
  { key: 'wallThickness', header: 'Wall Thickness',     width: 12, hint: 'Number' },
  { key: 'wallThicknessUnit', header: 'Unit',           width: 8,  hint: 'Pick from dropdown', validation: UNITS },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [categories, dbColors, textures, finishes] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { name: true } }),
    prisma.color.findMany({    where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { name: true, hexCode: true, ralCode: true } }),
    prisma.texture.findMany({  where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { name: true } }),
    prisma.finish.findMany({   where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { name: true } }),
  ])

  /* Merge: canonical 224-color RAL palette is the source of truth for the
     dropdown; DB rows for the same RAL code override name/hex (admin edits win).
     Any DB-only colors without a RAL code are appended afterwards.            */
  const dbByRal = new Map<string, { name: string; hex: string | null }>()
  const dbNoRal: Array<{ label: string; ralCode: string; hex: string }> = []
  for (const c of dbColors) {
    const key = (c.ralCode ?? '').toLowerCase().replace(/\s+/g, '')
    if (key) dbByRal.set(key, { name: c.name, hex: c.hexCode ?? null })
    else     dbNoRal.push({ label: c.name, ralCode: '', hex: c.hexCode ?? '' })
  }
  const colors = [
    ...RAL_COLORS.map(r => {
      const override = dbByRal.get(r.code.toLowerCase().replace(/\s+/g, ''))
      return {
        label:   `${r.code} — ${override?.name ?? r.name}`,
        ralCode: r.code,
        hex:     (override?.hex ?? r.hex).replace('#', '').toUpperCase(),
        group:   r.group,
      }
    }),
    ...dbNoRal.map(d => ({ label: d.label, ralCode: d.ralCode, hex: (d.hex || '').replace('#', '').toUpperCase(), group: 'Custom' })),
  ]

  const wb = new ExcelJS.Workbook()
  wb.creator       = 'Forestry'
  wb.lastModifiedBy = 'Forestry'
  wb.created       = new Date()

  // Pre-compute the Colors range string — referenced by every Color N dropdown.
  const colorsRange = `Colors!$A$2:$A$${Math.max(colors.length + 1, 2)}`

  /* ── Sheet 1: Products ───────────────────────────────────────── */
  const ws = wb.addWorksheet('Products', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }], // freeze SKU + Name cols, header + hint rows
  })

  // Row 1: headers
  ws.addRow(COLUMNS.map(c => c.header))
  // Row 2: hints
  ws.addRow(COLUMNS.map(c => c.hint))

  // Set column widths
  COLUMNS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width })

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.height = 24
  headerRow.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2926' } }
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    cell.border    = { bottom: { style: 'thin', color: { argb: 'FFC96B4A' } } }
  })

  // Style hint row
  const hintRow = ws.getRow(2)
  hintRow.height = 36
  hintRow.eachCell(cell => {
    cell.font      = { italic: true, color: { argb: 'FF8C8378' }, size: 9 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF7F1' } }
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  })

  // Sample rows — 2 variants of one product
  const sampleRows: Record<string, any>[] = [
    {
      sku: 'FP-PLT-001', name: 'Classic Terra Pot', description: 'Round pot, made-to-order in any RAL color.',
      isActive: 'yes', isFeatured: 'yes',
      categories: 'Planters, Indoor',
      color1: 'RAL 1006 — Maize yellow',
      color2: 'RAL 9005 — Jet black',
      textures: 'Smooth, Brushed', finishes: 'Matte, Gloss',
      imageGroup: '1',
      variantName: 'Small', variantPrice: 320,
      topDia: 40, topDiaUnit: 'cm', height: 35, heightUnit: 'cm',
    },
    {
      sku: 'FP-PLT-001', // same SKU = continuation row, only variant fields needed
      name: '', description: '', isActive: '', isFeatured: '',
      categories: '',
      color1: '', color2: '', color3: '', color4: '', color5: '',
      textures: '', finishes: '',
      imageGroup: '',
      variantName: 'Large', variantPrice: 580,
      topDia: 60, topDiaUnit: 'cm', height: 55, heightUnit: 'cm',
    },
    {
      sku: 'FP-PLT-002', name: 'Square Modern Planter', description: '',
      isActive: 'yes', isFeatured: 'no',
      categories: 'Planters, Outdoor',
      color1: 'RAL 9005 — Jet black',
      textures: '', finishes: 'Matte',
      imageGroup: '2',
      variantName: 'Medium', variantPrice: 420,
      width: 35, widthUnit: 'cm', length: 35, lengthUnit: 'cm', height: 40, heightUnit: 'cm',
    },
  ]

  for (const row of sampleRows) {
    ws.addRow(COLUMNS.map(c => (row as any)[c.key] ?? ''))
  }

  // Add data-validation dropdowns to validated columns + the 5 Color N columns.
  const DATA_START_ROW = 3
  const DATA_END_ROW   = 1003
  COLUMNS.forEach((c, idx) => {
    const colLetter = ws.getColumn(idx + 1).letter
    const isColorPicker = /^color[1-5]$/.test(c.key)
    const hasInlineList = c.validation && c.validation.length > 0
    if (!isColorPicker && !hasInlineList) return

    for (let r = DATA_START_ROW; r <= DATA_END_ROW; r++) {
      const cellAddr = `${colLetter}${r}`
      if (isColorPicker) {
        // RAL color picker — list sourced from the Colors reference sheet.
        ws.getCell(cellAddr).dataValidation = {
          type:       'list',
          allowBlank: true,
          formulae:   [colorsRange],
          showErrorMessage: true,
          errorStyle: 'warning',
          errorTitle: 'Pick a RAL color',
          error:      'Use the Colors sheet picker labels (RAL XXXX — Name).',
        }
      } else if (hasInlineList) {
        ws.getCell(cellAddr).dataValidation = {
          type:       'list',
          allowBlank: true,
          formulae:   [`"${c.validation!.join(',')}"`],
          showErrorMessage: true,
          errorStyle: 'warning',
          errorTitle: 'Pick from dropdown',
          error:      `Must be one of: ${c.validation!.join(', ')}`,
        }
      }
    }
  })

  /* ── Sheet 2: Categories ─────────────────────────────────────── */
  const catWs = wb.addWorksheet('Categories')
  catWs.columns = [{ header: 'Available Categories', key: 'name', width: 30 }]
  catWs.getRow(1).font = { bold: true }
  if (categories.length === 0) catWs.addRow({ name: '(none — create in Admin → Attributes → Categories)' })
  else categories.forEach(c => catWs.addRow({ name: c.name }))

  /* ── Sheet 3: Colors (used as dropdown source for Color N columns) ─ */
  // Column A holds the canonical "Picker Label" — "RAL XXXX — Name". The product
  // sheet's Color N dropdowns reference this column. Other columns give context:
  // Swatch (cell filled with the hex), Hex code, Group, plus the raw RAL code.
  const colWs = wb.addWorksheet('Colors')
  colWs.columns = [
    { header: 'Picker Label (use this in the Products sheet)', key: 'label',   width: 38 },
    { header: 'Swatch',                                          key: 'swatch',  width: 10 },
    { header: 'Hex',                                            key: 'hex',     width: 12 },
    { header: 'Group',                                          key: 'group',   width: 14 },
    { header: 'RAL Code',                                       key: 'ralCode', width: 12 },
  ]
  const colHeader = colWs.getRow(1)
  colHeader.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  colHeader.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2926' } }
  colHeader.alignment = { vertical: 'middle', horizontal: 'left' }
  colHeader.height    = 22

  // Compute readable text colour from hex (luminance-based).
  function textOn(hex: string): string {
    const m = hex.match(/^([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i)
    if (!m) return 'FF2D2926'
    const [r, g, b] = [m[1], m[2], m[3]].map(c => parseInt(c, 16))
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.6 ? 'FF2D2926' : 'FFFFFFFF'
  }

  colors.forEach((c, idx) => {
    const row = colWs.addRow({
      label:   c.label,
      swatch:  '',
      hex:     c.hex ? `#${c.hex}` : '',
      group:   c.group ?? '',
      ralCode: c.ralCode ?? '',
    })
    if (c.hex && /^[0-9A-F]{6}$/i.test(c.hex)) {
      // Fill the Swatch cell with the hex colour.
      const swatchCell = row.getCell(2)
      swatchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${c.hex}` } }
      // Tint the Label cell lightly for visual scanning too.
      const labelCell = row.getCell(1)
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${c.hex}` } }
      labelCell.font = { color: { argb: textOn(c.hex) }, bold: false }
    }
    row.height = 18
    if (idx % 2 === 1 && !c.hex) {
      // Zebra background only when no swatch fill is set.
      colWs.getRow(idx + 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF7F1' } }
    }
  })
  colWs.views = [{ state: 'frozen', ySplit: 1 }]
  colWs.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } }

  /* ── Sheet 4: Textures ───────────────────────────────────────── */
  const texWs = wb.addWorksheet('Textures')
  texWs.columns = [{ header: 'Texture Name', key: 'name', width: 30 }]
  texWs.getRow(1).font = { bold: true }
  textures.forEach(t => texWs.addRow({ name: t.name }))

  /* ── Sheet 5: Finishes ───────────────────────────────────────── */
  const finWs = wb.addWorksheet('Finishes')
  finWs.columns = [{ header: 'Finish Name', key: 'name', width: 30 }]
  finWs.getRow(1).font = { bold: true }
  finishes.forEach(f => finWs.addRow({ name: f.name }))

  /* ── Sheet 6: Instructions ───────────────────────────────────── */
  const insWs = wb.addWorksheet('Instructions')
  insWs.getColumn(1).width = 120
  const lines = [
    'Forestry — Bulk Product Upload Template',
    '',
    'STRUCTURE',
    '• Each row in the Products sheet represents ONE variant of a product.',
    '• To add multiple variants (e.g. Small / Medium / Large), use multiple rows with the SAME SKU.',
    '• On the FIRST row of each SKU, fill in: SKU, Product Name, Description, Active, Featured, Categories, Colors, Textures, Finishes, Images.',
    '• On CONTINUATION rows for the same SKU, leave the product-level columns blank — only fill the variant columns (Variant Name, Price, Dimensions).',
    '',
    'REQUIRED COLUMNS',
    '• SKU — unique product code',
    '• Product Name — required on first row per SKU',
    '• Variant Name — every row needs one (e.g. "Small", "Standard")',
    '• Price (AED) — every row needs a numeric price',
    '',
    'DROPDOWNS',
    '• Active / Featured → yes or no',
    '• All Unit columns (cm, mm, m, inches, feet) → click the cell, dropdown arrow appears',
    '',
    'REFERENCE SHEETS',
    '• Categories, Colors, Textures, Finishes sheets list the exact names you can use.',
    '• For Colors you may use the RAL code instead of the name (e.g. "RAL 1006").',
    '• For multi-value cells, separate values with commas — e.g. "Planters, Indoor".',
    '',
    'IMAGES — NAMING CONVENTION',
    '• Upload your product photos in Step 2 of the bulk-import page (or paste URLs directly).',
    '• Name files as <group><letter>.<ext> — e.g. 1a.jpg, 1b.jpg, 1c.jpg for product group 1.',
    '• The "a" image becomes the PRIMARY image. "b", "c", "d" … become secondary images in order.',
    '• Allowed extensions: jpg, jpeg, png, webp, gif. Letters are case-insensitive.',
    '• Examples: 1a.jpg + 1b.jpg + 1c.jpg → enter "1" in Image Group. 2a.png + 2b.png → enter "2".',
    '• You can also use product-specific prefixes: pot-a.jpg, pot-b.jpg → enter "pot" in Image Group.',
    '• Alternatively paste a full https URL into Image Group for a single image (no upload needed).',
    '',
    'DIMENSIONS',
    '• Fill only the columns you need — leave others blank.',
    '• Common pairs: Top Diameter + Height (round pots), Width + Length + Height (square pots).',
    '',
    'IMPORT BEHAVIOUR',
    '• Existing SKUs → product is updated, variants replaced from spreadsheet.',
    '• New SKUs → created.',
    '• Rows with errors are skipped; preview shows exactly why before commit.',
    '',
    'Questions? vendors@forestry.ae',
  ]
  lines.forEach((t, i) => {
    const r = insWs.addRow([t])
    if (i === 0) r.font = { bold: true, size: 14, color: { argb: 'FFC96B4A' } }
    if (/^[A-Z][A-Z ]+$/.test(t)) r.font = { bold: true, color: { argb: 'FF2D2926' } }
  })

  /* Buffer + response */
  const buf = await wb.xlsx.writeBuffer()
  const body = new Uint8Array(buf)

  const filename = `forestry-bulk-products-template-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
