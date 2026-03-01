const fs = require('fs')
const path = require('path')
const sourcePath = path.resolve(__dirname, '../src/assets/riskless_data_all_years.json')
const outputPath = path.resolve(__dirname, '../src/assets/range_part_index.json')

const rows = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const dimensions = ['ageGroup', 'bmiGroup', 'bpGroup', 'lipidGroup', 'diabetesLabel']
const rowIdsByDimension = Object.fromEntries(dimensions.map((dim) => [dim, {}]))

rows.forEach((row, index) => {
  dimensions.forEach((dim) => {
    const value = row.displayGroups?.[dim]
    if (!value) return
    if (!rowIdsByDimension[dim][value]) rowIdsByDimension[dim][value] = []
    rowIdsByDimension[dim][value].push(index)
  })
})

const payload = {
  totalRows: rows.length,
  allRowIds: Array.from({ length: rows.length }, (_, idx) => idx),
  rowIdsByDimension
}

fs.writeFileSync(outputPath, JSON.stringify(payload))
console.log(`wrote ${outputPath}`)
