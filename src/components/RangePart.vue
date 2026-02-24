<template>
  <div class="range-wrapper">
    <div ref="chartRef" class="range-chart" />

    <div class="control-row">
      <div class="row-meta">
        <span class="selection-state" :class="{ active: hasAnyLeftSelection }" :title="selectionSummaryText">
          {{ selectionSummaryText }}
        </span>
        <span class="row-link" :class="{ disabled: !hasExpandedRows }" @click="collapseAllExpanded">Collapse Expanded</span>
        <span class="row-divider">·</span>
        <span class="row-link" :class="{ disabled: !hasAnyLeftSelection }" @click="clearLeftSelection">Clear Left Filters</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  rawGroupData: {
    type: Array,
    required: true
  },
  contextFilters: {
    type: Object,
    default: () => ({
      ageGroup: [],
      bmiGroup: [],
      bpGroup: [],
      lipidGroup: [],
      diabetesLabel: []
    })
  },
  clearSignal: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['updateFilters'])

const chartDimensions = [
  { key: 'ageGroup', label: 'Age', rawKey: 'age' },
  { key: 'bmiGroup', label: 'BMI', rawKey: 'bmi' },
  { key: 'bpGroup', label: 'SBP', rawKey: 'bp' },
  { key: 'lipidGroup', label: 'CHOL', rawKey: 'lipids' },
  { key: 'diabetesLabel', label: 'DIABETES', rawKey: 'diabetes' }
]
const allDimensions = [...chartDimensions]

const groupOrder = {
  ageGroup: ['Young Adult', 'Middle-Aged', 'Senior', 'Elderly'],
  bmiGroup: ['Underweight', 'Healthy', 'Overweight', 'Obese I', 'Severe Obesity'],
  bpGroup: ['Low', 'Normal', 'Elevated', 'Stage 1', 'Stage 2', 'Crisis'],
  lipidGroup: ['Desirable', 'Borderline', 'High', 'Extreme'],
  diabetesLabel: ['Non-Diabetic', 'Diabetic']
}

const shortLabelMap = {
  'Young Adult': 'Young',
  'Middle-Aged': 'Middle',
  'Severe Obesity': 'Severe',
  Elevated: 'Elev.',
  Borderline: 'Border',
  Desirable: 'Desir.',
  Underweight: 'Under',
  Overweight: 'Over',
  'Stage 1': 'S1',
  'Stage 2': 'S2',
  'Non-Diabetic': 'Non-DM',
  Diabetic: 'DM'
}

const totalGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#e9edf4' },
  { offset: 1, color: '#d3dbe7' }
])
const noCvdGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#79a8ff' },
  { offset: 1, color: '#4f84f2' }
])
const cvdGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#8dd31b' },
  { offset: 1, color: '#5ea60f' }
])

const mutedOpacity = 0.12
const activeOpacity = 0.96

const chartRef = ref(null)
let chart = null
let suppressBrushEvent = false

const createFilterMap = () => ({
  ageGroup: [],
  bmiGroup: [],
  bpGroup: [],
  lipidGroup: [],
  diabetesLabel: []
})

const createChartOnlyMap = () => ({
  ...Object.fromEntries(chartDimensions.map(dim => [dim.key, []]))
})

const createBarSelectionMap = () => ({
  ...Object.fromEntries(chartDimensions.map(dim => [dim.key, []]))
})

const createSpanMap = () => ({
  ...Object.fromEntries(chartDimensions.map(dim => [dim.key, null]))
})

const baseCategoriesByDim = ref(createFilterMap())
const rowDataByDim = ref({})
const selectedByDim = ref(createFilterMap())
const expandedByDim = ref(createChartOnlyMap())
const selectedBarIdsByDim = ref(createBarSelectionMap())
const brushSpanByDim = ref(createSpanMap())
const lastEmittedFilters = ref(createFilterMap())

const dedupe = (arr = []) => [...new Set(arr)]
const shortLabel = (name) => shortLabelMap[name] || name
const dimensionLabelMap = {
  ageGroup: 'Age',
  bmiGroup: 'BMI',
  bpGroup: 'SBP',
  lipidGroup: 'CHOL',
  diabetesLabel: 'DIABETES'
}

const getLiveRangeFilters = () => {
  const result = createFilterMap()
  allDimensions.forEach(dim => {
    result[dim.key] = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])
  })
  return result
}

const hasExpandedRows = computed(() =>
  chartDimensions.some(dim => (expandedByDim.value[dim.key] || []).length > 0)
)

const hasAnyLeftSelection = computed(() => {
  const filters = getLiveRangeFilters()
  const hasDimSelection = Object.values(filters).some(arr => arr.length > 0)
  const hasBarSelection = chartDimensions.some(dim => (selectedBarIdsByDim.value[dim.key] || []).length > 0)
  const hasBrushSpan = chartDimensions.some(dim => !!brushSpanByDim.value[dim.key])
  return hasDimSelection || hasBarSelection || hasBrushSpan
})

const selectionSummaryText = computed(() => {
  const filters = getLiveRangeFilters()
  const tokens = ['ageGroup', 'bmiGroup', 'bpGroup', 'lipidGroup', 'diabetesLabel']
    .map((dimKey) => {
      const selected = filters[dimKey] || []
      if (!selected.length) return ''
      const valueText = selected.map(shortLabel).join(', ')
      return `${dimensionLabelMap[dimKey]}: ${valueText}`
    })
    .filter(Boolean)

  if (tokens.length) {
    return `Active filters: ${tokens.join(' | ')}`
  }

  const hasBarSelection = chartDimensions.some(dim => (selectedBarIdsByDim.value[dim.key] || []).length > 0)
  if (hasBarSelection) {
    return 'Selection covers all groups in this row (equivalent to no filter)'
  }

  return 'Drag to brush or click bars to filter'
})

const sameArray = (a = [], b = []) => {
  if (a.length !== b.length) return false
  return a.every((item, idx) => item === b[idx])
}

const sameFilterMap = (left, right) => {
  const keys = ['ageGroup', 'bmiGroup', 'bpGroup', 'lipidGroup', 'diabetesLabel']
  return keys.every(key => sameArray(left[key] || [], right[key] || []))
}

const setMapValue = (mapRef, key, value) => {
  mapRef.value = {
    ...mapRef.value,
    [key]: value
  }
}

const normalizeSelection = (dimKey, values) => {
  const allCats = baseCategoriesByDim.value[dimKey] || []
  const cleaned = dedupe(values).filter(v => allCats.includes(v))
  if (allCats.length && cleaned.length === allCats.length) return []
  return cleaned
}

const getRangeFilters = () => {
  return getLiveRangeFilters()
}

const emitAllFilters = (force = false) => {
  const next = getRangeFilters()
  if (!force && sameFilterMap(next, lastEmittedFilters.value)) return
  lastEmittedFilters.value = {
    ageGroup: [...next.ageGroup],
    bmiGroup: [...next.bmiGroup],
    bpGroup: [...next.bpGroup],
    lipidGroup: [...next.lipidGroup],
    diabetesLabel: [...next.diabetesLabel]
  }
  emit('updateFilters', next)
}

const contextSelectionFor = (dimKey) => {
  const incoming = props.contextFilters?.[dimKey] || []
  const allCats = baseCategoriesByDim.value[dimKey] || []
  return dedupe(incoming).filter(v => allCats.includes(v))
}

const matchesRowWithCombinedFilters = (row, skipDimKey) => {
  return allDimensions.every(dim => {
    if (dim.key === skipDimKey) return true

    const value = row.displayGroups?.[dim.key]
    if (!value) return false

    const context = contextSelectionFor(dim.key)
    const selected = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])

    if (context.length && selected.length) {
      return context.includes(value) && selected.includes(value)
    }
    if (context.length) return context.includes(value)
    if (selected.length) return selected.includes(value)
    return true
  })
}

const rebuildBaseCategories = () => {
  const next = createFilterMap()

  allDimensions.forEach(dim => {
    const preferred = groupOrder[dim.key] || []
    const found = new Set()
    props.rawGroupData.forEach(row => {
      const value = row.displayGroups?.[dim.key]
      if (value) found.add(value)
    })
    const extras = [...found].filter(v => !preferred.includes(v)).sort()
    next[dim.key] = [...preferred, ...extras]
  })

  baseCategoriesByDim.value = next
}

const buildUniformEdges = (count, bins) => {
  if (count <= 0 || bins <= 1) return [0, count]
  const edges = [0]
  for (let i = 1; i < bins; i += 1) {
    edges.push(Math.round((count * i) / bins))
  }
  edges.push(count)
  for (let i = 1; i < edges.length; i += 1) {
    if (edges[i] <= edges[i - 1]) edges[i] = edges[i - 1] + 1
  }
  edges[edges.length - 1] = count
  return edges
}

const niceAxisMax = (value) => {
  const padded = Math.max(8, value * 1.15)
  if (padded <= 10) return 10
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(padded)) - 1))
  return Math.ceil(padded / mag) * mag
}

const buildRowDataForDim = (dim) => {
  const categories = baseCategoriesByDim.value[dim.key] || []
  const expandedSet = new Set(expandedByDim.value[dim.key] || [])

  const filteredRows = props.rawGroupData
    .filter(row => matchesRowWithCombinedFilters(row, dim.key))

  const bars = []
  const labelByIndex = {}

  categories.forEach((category) => {
    const categoryRows = filteredRows
      .filter(row => row.displayGroups[dim.key] === category)
      .sort((a, b) => Number(a.rawValues[dim.rawKey] || 0) - Number(b.rawValues[dim.rawKey] || 0))

    const shouldExpand = expandedSet.has(category) && categoryRows.length > 3
    const start = bars.length

    if (shouldExpand) {
      const bins = Math.max(4, Math.min(12, Math.round(Math.sqrt(categoryRows.length))))
      const usedBins = Math.max(1, Math.min(bins, categoryRows.length))
      const edges = buildUniformEdges(categoryRows.length, usedBins)

      for (let i = 0; i < usedBins; i += 1) {
        const chunk = categoryRows.slice(edges[i], edges[i + 1])
        const total = chunk.length
        const cvd = chunk.reduce((acc, row) => acc + (row.rawValues.CVD === 1 ? 1 : 0), 0)
        const minRaw = total ? Number(chunk[0].rawValues[dim.rawKey]) : null
        const maxRaw = total ? Number(chunk[chunk.length - 1].rawValues[dim.rawKey]) : null

        bars.push({
          id: `${dim.key}|${category}|micro|${i}`,
          category,
          isGap: false,
          isMicro: true,
          total,
          cvd,
          noCvd: total - cvd,
          minRaw,
          maxRaw
        })
      }

      const end = bars.length - 1
      const center = Math.round((start + end) / 2)
      labelByIndex[center] = `${shortLabel(category)}*`
    } else {
      const total = categoryRows.length
      const cvd = categoryRows.reduce((acc, row) => acc + (row.rawValues.CVD === 1 ? 1 : 0), 0)

      bars.push({
        id: `${dim.key}|${category}|macro`,
        category,
        isGap: false,
        isMicro: false,
        total,
        cvd,
        noCvd: total - cvd,
        minRaw: null,
        maxRaw: null
      })

      labelByIndex[bars.length - 1] = shortLabel(category)
    }

  })

  return {
    categories,
    bars,
    labelByIndex,
    axisMax: niceAxisMax(Math.max(1, ...bars.map(b => b.total)))
  }
}

const sanitizeState = () => {
  allDimensions.forEach(dim => {
    const normalized = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])
    setMapValue(selectedByDim, dim.key, normalized)
  })

  chartDimensions.forEach(dim => {
    const selected = new Set(selectedByDim.value[dim.key] || [])
    const expanded = (expandedByDim.value[dim.key] || []).filter(v => selected.has(v))
    setMapValue(expandedByDim, dim.key, expanded)

    const validBarIds = new Set((rowDataByDim.value[dim.key]?.bars || []).map(b => b.id))
    const keptBarIds = (selectedBarIdsByDim.value[dim.key] || []).filter(id => validBarIds.has(id))
    setMapValue(selectedBarIdsByDim, dim.key, keptBarIds)

    const span = brushSpanByDim.value[dim.key]
    const barCount = rowDataByDim.value[dim.key]?.bars?.length || 0
    if (!span || !barCount) return

    const max = barCount - 1
    const start = Math.max(0, Math.min(max, span.start))
    const end = Math.max(0, Math.min(max, span.end))
    setMapValue(brushSpanByDim, dim.key, { start, end })
  })
}

const rebuildRowData = () => {
  const next = {}
  chartDimensions.forEach(dim => {
    next[dim.key] = buildRowDataForDim(dim)
  })
  rowDataByDim.value = next
}

const rebuildAndRender = () => {
  sanitizeState()
  rebuildRowData()
  sanitizeState()
  renderChart()
}

const clearAllSelections = () => {
  selectedByDim.value = createFilterMap()
  expandedByDim.value = createChartOnlyMap()
  selectedBarIdsByDim.value = createBarSelectionMap()
  brushSpanByDim.value = createSpanMap()
}

const makeSeriesId = (dimKey, metric) => `${dimKey}__${metric}`

const parseSeriesId = (seriesId = '') => {
  const [dimKey, metric] = seriesId.split('__')
  return { dimKey, metric }
}

const buildTotalData = (dimKey) => {
  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const hasBarSelected = selectedBarIds.size > 0
  return bars.map(bar => {
    if (bar.isGap) return { value: 0, itemStyle: { color: 'rgba(0,0,0,0)' } }
    return {
      value: bar.total,
      itemStyle: {
        color: totalGradient,
        borderRadius: [0, 0, 0, 0],
        opacity: hasBarSelected ? (selectedBarIds.has(bar.id) ? 0.7 : 0.2) : 0.54
      }
    }
  })
}

const buildRiskData = (dimKey, metric) => {
  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selected = new Set(normalizeSelection(dimKey, selectedByDim.value[dimKey] || []))
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const hasSelected = selected.size > 0
  const hasBarSelected = selectedBarIds.size > 0
  const color = metric === 'noCvd' ? noCvdGradient : cvdGradient

  return bars.map(bar => {
    if (bar.isGap) return { value: 0, itemStyle: { color: 'rgba(0,0,0,0)' } }

    const enabled = hasBarSelected
      ? selectedBarIds.has(bar.id)
      : (!hasSelected || selected.has(bar.category))
    return {
      value: metric === 'noCvd' ? bar.noCvd : bar.cvd,
      itemStyle: {
        color,
        opacity: enabled ? activeOpacity : mutedOpacity,
        borderWidth: enabled && hasBarSelected ? 0.8 : 0,
        borderColor: metric === 'noCvd' ? '#1d4ed8' : '#65a30d',
        shadowBlur: enabled && hasBarSelected ? 5 : 0,
        shadowColor: metric === 'noCvd' ? 'rgba(29,78,216,0.35)' : 'rgba(101,163,13,0.35)',
        borderRadius: [0, 0, 0, 0]
      }
    }
  })
}

const buildMarkArea = (dimKey) => {
  const span = brushSpanByDim.value[dimKey]
  if (!span) return undefined

  return {
    silent: true,
    z: 6,
    itemStyle: {
      color: 'rgba(34,197,94,0.18)',
      borderColor: 'rgba(34,197,94,0.72)',
      borderWidth: 1
    },
    data: [[
      { xAxis: Math.min(span.start, span.end) },
      { xAxis: Math.max(span.start, span.end) }
    ]]
  }
}

const buildOption = () => {
  const rowHeight = 52
  const rowGap = 7
  const topOffset = 20

  const grids = []
  const xAxis = []
  const yAxis = []
  const series = []

  chartDimensions.forEach((dim, rowIndex) => {
    const row = rowDataByDim.value[dim.key] || { bars: [], labelByIndex: {}, axisMax: 10 }
    const selectedSet = new Set(normalizeSelection(dim.key, selectedByDim.value[dim.key] || []))
    const barSize = row.bars.length > 90
      ? 4
      : row.bars.length > 60
        ? 7
        : row.bars.length > 34
          ? 10
          : row.bars.length > 20
            ? 14
            : row.bars.length > 10
              ? 20
              : 28

    grids.push({
      left: 84,
      right: 10,
      top: topOffset + rowIndex * (rowHeight + rowGap),
      height: rowHeight
    })

    xAxis.push({
      type: 'category',
      gridIndex: rowIndex,
      data: row.bars.map((_, i) => String(i)),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(71,85,105,0.28)' } },
      axisLabel: {
        interval: 0,
        margin: 9,
        fontSize: 9,
        fontWeight: 700,
        color: '#475569',
        formatter: (_, idx) => {
          const label = row.labelByIndex[idx] || ''
          if (!label) return ''
          const bar = row.bars[idx]
          const isActive = !!bar?.category && selectedSet.size > 0 && selectedSet.has(bar.category)
          return isActive ? `{tagActive|${label}}` : `{tag|${label}}`
        },
        rich: {
          tag: {
            color: '#334155',
            backgroundColor: 'rgba(148,163,184,0.14)',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(148,163,184,0.18)',
            padding: [1, 8, 1, 8],
            fontSize: 9.5,
            fontWeight: 700,
            lineHeight: 16
          },
          tagActive: {
            color: '#0f172a',
            backgroundColor: 'rgba(59,130,246,0.22)',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(37,99,235,0.55)',
            padding: [1, 8, 1, 8],
            fontSize: 9.5,
            fontWeight: 700,
            lineHeight: 16
          }
        }
      }
    })

    yAxis.push({
      type: 'value',
      gridIndex: rowIndex,
      min: 0,
      max: row.axisMax,
      splitNumber: 3,
      name: dim.label,
      nameLocation: 'middle',
      nameGap: 48,
      nameRotate: 0,
      nameTextStyle: {
        fontSize: 11,
        fontWeight: 700,
        color: '#334155'
      },
      axisLabel: {
        show: rowIndex === 0,
        color: '#667085',
        formatter: (v) => (rowIndex === 0 ? Math.round(v).toLocaleString() : '')
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(15,23,42,0.09)',
          type: 'solid'
        }
      }
    })

    series.push({
      id: makeSeriesId(dim.key, 'total'),
      name: 'Total Population',
      type: 'bar',
      xAxisIndex: rowIndex,
      yAxisIndex: rowIndex,
      barWidth: barSize,
      barMaxWidth: 30,
      barCategoryGap: '8%',
      barGap: '-100%',
      data: buildTotalData(dim.key),
      markArea: buildMarkArea(dim.key),
      z: 1
    })

    series.push({
      id: makeSeriesId(dim.key, 'noCvd'),
      name: 'No CVD',
      type: 'bar',
      xAxisIndex: rowIndex,
      yAxisIndex: rowIndex,
      stack: `risk-${dim.key}`,
      barWidth: barSize,
      barMaxWidth: 30,
      barCategoryGap: '8%',
      data: buildRiskData(dim.key, 'noCvd'),
      z: 3
    })

    series.push({
      id: makeSeriesId(dim.key, 'cvd'),
      name: 'CVD',
      type: 'bar',
      xAxisIndex: rowIndex,
      yAxisIndex: rowIndex,
      stack: `risk-${dim.key}`,
      barWidth: barSize,
      barMaxWidth: 30,
      barCategoryGap: '8%',
      barMinHeight: 5,
      data: buildRiskData(dim.key, 'cvd'),
      z: 3
    })
  })

  return {
    animationDuration: 150,
    animationDurationUpdate: 120,
    animationEasing: 'cubicOut',
    backgroundColor: 'transparent',
    toolbox: {
      show: false
    },
    legend: {
      top: 0,
      left: 'center',
      itemWidth: 13,
      itemHeight: 9,
      itemGap: 18,
      textStyle: {
        color: '#334155',
        fontSize: 11
      },
      data: ['Total Population', 'No CVD', 'CVD']
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(15,23,42,0.07)' }
      },
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(148,163,184,0.28)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      padding: [8, 10],
      formatter: (params) => {
        const primary = params?.find(p => p.seriesId?.includes('__total')) || params?.[0]
        if (!primary) return ''

        const { dimKey } = parseSeriesId(primary.seriesId)
        const row = rowDataByDim.value[dimKey]
        const dim = chartDimensions.find(d => d.key === dimKey)
        const index = primary.dataIndex
        const bar = row?.bars?.[index]

        if (!row || !dim || !bar || bar.isGap) return ''

        const ratio = bar.total > 0 ? ((bar.cvd / bar.total) * 100).toFixed(1) : '0.0'
        const rangeText = bar.isMicro && bar.minRaw !== null && bar.maxRaw !== null
          ? `${dim.label} range: ${bar.minRaw} - ${bar.maxRaw}`
          : `${dim.label} group: ${bar.category}`

        return [
          `<b>${rangeText}</b>`,
          `Total: ${bar.total}`,
          `No CVD: ${bar.noCvd}`,
          `CVD: ${bar.cvd}`,
          `CVD Ratio: ${ratio}%`
        ].join('<br/>')
      }
    },
    brush: {
      xAxisIndex: chartDimensions.map((_, i) => i),
      brushType: 'rect',
      brushMode: 'single',
      transformable: false,
      removeOnClick: false,
      throttleType: 'debounce',
      throttleDelay: 40,
      toolbox: [],
      brushStyle: {
        borderWidth: 2,
        borderColor: '#16a34a',
        color: 'rgba(34,197,94,0.22)'
      }
    },
    grid: grids,
    xAxis,
    yAxis,
    series
  }
}

const syncBrushArea = () => {
  if (!chart) return
  // Keep brush as an interaction tool only; persistent highlight is rendered by markArea.
  // This avoids stacked/overlapping translucent brush rectangles.
  chart.dispatchAction({ type: 'brush', areas: [] })
}

const enableBrushCursor = () => {
  if (!chart) return
  chart.dispatchAction({
    type: 'takeGlobalCursor',
    key: 'brush',
    brushOption: {
      brushType: 'rect',
      brushMode: 'single'
    }
  })
  chart.getZr().setCursorStyle('crosshair')
}

const renderChart = () => {
  if (!chart) return
  suppressBrushEvent = true
  chart.setOption(buildOption(), true)
  syncBrushArea()
  enableBrushCursor()
  requestAnimationFrame(() => {
    suppressBrushEvent = false
  })
}

const toggleCategorySelection = (dimKey, category) => {
  const current = [...normalizeSelection(dimKey, selectedByDim.value[dimKey] || [])]
  const idx = current.indexOf(category)
  const nextExpanded = new Set(expandedByDim.value[dimKey] || [])

  if (idx >= 0) {
    current.splice(idx, 1)
    nextExpanded.delete(category)
  } else {
    current.push(category)
    nextExpanded.add(category)
  }

  const normalized = normalizeSelection(dimKey, current)
  setMapValue(selectedByDim, dimKey, normalized)
  setMapValue(
    expandedByDim,
    dimKey,
    [...nextExpanded].filter(cat => normalized.includes(cat))
  )
  setMapValue(selectedBarIdsByDim, dimKey, [])
  setMapValue(brushSpanByDim, dimKey, null)

  rebuildAndRender()
  emitAllFilters()
}

const coordToIndex = (coord, max, fallback, rowBars) => {
  if (typeof coord === 'number' && Number.isFinite(coord)) {
    return Math.max(0, Math.min(max, Math.round(coord)))
  }

  if (typeof coord === 'string' && rowBars?.length) {
    const numeric = Number(coord)
    if (Number.isFinite(numeric)) {
      return Math.max(0, Math.min(max, Math.round(numeric)))
    }
  }

  return fallback
}

const handleBrushSelected = (params) => {
  if (suppressBrushEvent) return

  const batch = params?.batch?.[0]
  const areas = batch?.areas || []
  const selectedEntries = batch?.selected || []
  if (!areas.length && !selectedEntries.length) return

  const nextSelected = {
    ...selectedByDim.value
  }
  const nextExpanded = {
    ...expandedByDim.value
  }
  const nextBarIds = {
    ...selectedBarIdsByDim.value
  }
  const nextSpans = {
    ...brushSpanByDim.value
  }

  const touched = new Set()

  const seriesDefs = chart?.getOption()?.series || []
  if (selectedEntries.length) {
    selectedEntries.forEach((entry) => {
      const seriesIndex = Number(entry?.seriesIndex)
      if (!Number.isInteger(seriesIndex) || seriesIndex < 0) return

      const seriesId = seriesDefs?.[seriesIndex]?.id || ''
      const { dimKey, metric } = parseSeriesId(seriesId)
      if (!dimKey || metric !== 'total') return

      const rowBars = rowDataByDim.value[dimKey]?.bars || []
      if (!rowBars.length) return

      const rawIndices = Array.isArray(entry?.dataIndex)
        ? entry.dataIndex
        : (Number.isFinite(entry?.dataIndex) ? [entry.dataIndex] : [])
      if (!rawIndices.length) return

      const validIndices = rawIndices
        .map(idx => Number(idx))
        .filter(idx => Number.isInteger(idx))
        .filter(idx => {
          const bar = rowBars[idx]
          return !!bar && !bar.isGap && !!bar.category
        })

      if (!validIndices.length) return

      const categorySet = new Set()
      const barIdSet = new Set()
      validIndices.forEach((idx) => {
        const bar = rowBars[idx]
        categorySet.add(bar.category)
        barIdSet.add(bar.id)
      })

      const selected = normalizeSelection(dimKey, [...categorySet])
      const left = Math.min(...validIndices)
      const right = Math.max(...validIndices)

      nextSelected[dimKey] = selected
      nextExpanded[dimKey] = (expandedByDim.value[dimKey] || []).filter(cat => selected.includes(cat))
      nextBarIds[dimKey] = [...barIdSet]
      nextSpans[dimKey] = { start: left, end: right }
      touched.add(dimKey)
    })
  }

  if (!touched.size && areas.length) {
    areas.forEach(area => {
      const axisIndexes = Array.isArray(area.xAxisIndex)
        ? area.xAxisIndex
        : [area.xAxisIndex]

      axisIndexes.forEach((axisIdxRaw) => {
        const axisIndex = Number(axisIdxRaw)
        if (!Number.isInteger(axisIndex) || !chartDimensions[axisIndex]) return

        const dimKey = chartDimensions[axisIndex].key
        const rowBars = rowDataByDim.value[dimKey]?.bars || []
        if (!rowBars.length) return

        const max = rowBars.length - 1
        const range = area.coordRange || []
        if (range.length < 2) return

        const start = coordToIndex(range[0], max, 0, rowBars)
        const end = coordToIndex(range[1], max, max, rowBars)
        const left = Math.min(start, end)
        const right = Math.max(start, end)

        const categorySet = new Set()
        const barIdSet = new Set()
        for (let i = left; i <= right; i += 1) {
          const bar = rowBars[i]
          if (!bar || bar.isGap || !bar.category) continue
          categorySet.add(bar.category)
          barIdSet.add(bar.id)
        }

        if (!barIdSet.size) return

        const selected = normalizeSelection(dimKey, [...categorySet])
        nextSelected[dimKey] = selected
        nextExpanded[dimKey] = (expandedByDim.value[dimKey] || []).filter(cat => selected.includes(cat))
        nextBarIds[dimKey] = [...barIdSet]
        nextSpans[dimKey] = { start: left, end: right }
        touched.add(dimKey)
      })
    })
  }

  if (!touched.size) return

  selectedByDim.value = nextSelected
  expandedByDim.value = nextExpanded
  selectedBarIdsByDim.value = nextBarIds
  brushSpanByDim.value = nextSpans

  rebuildAndRender()
  emitAllFilters()
}

const collapseAllExpanded = () => {
  if (!hasExpandedRows.value) return
  expandedByDim.value = createChartOnlyMap()
  selectedBarIdsByDim.value = createBarSelectionMap()
  brushSpanByDim.value = createSpanMap()
  rebuildAndRender()
}

const clearLeftSelection = () => {
  if (!hasAnyLeftSelection.value) return
  clearAllSelections()
  rebuildAndRender()
  emitAllFilters()
}

const initChart = async () => {
  await nextTick()
  if (!chartRef.value) return

  if (chart) {
    chart.dispose()
    chart = null
  }

  chart = echarts.init(chartRef.value)

  chart.on('click', params => {
    const { dimKey, metric } = parseSeriesId(params.seriesId)
    if (!dimKey || !['total', 'noCvd', 'cvd'].includes(metric)) return

    const rowBars = rowDataByDim.value[dimKey]?.bars || []
    const bar = rowBars[params.dataIndex]
    if (!bar || bar.isGap || !bar.category) return

    toggleCategorySelection(dimKey, bar.category)
  })

  chart.on('brushSelected', handleBrushSelected)

  renderChart()
}

const handleResize = () => {
  chart?.resize()
}

onMounted(async () => {
  rebuildBaseCategories()
  rebuildAndRender()
  await initChart()
  emitAllFilters(true)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

watch(
  () => props.rawGroupData,
  async () => {
    rebuildBaseCategories()
    rebuildAndRender()
    if (!chart) {
      await initChart()
    }
    emitAllFilters()
  },
  { deep: true }
)

watch(
  () => props.contextFilters,
  () => {
    rebuildAndRender()
    emitAllFilters()
  },
  { deep: true }
)

watch(
  () => props.clearSignal,
  () => {
    clearAllSelections()
    rebuildAndRender()
    emitAllFilters()
  }
)
</script>

<style scoped>
.range-wrapper {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  border: 0;
  background: transparent;
}

.range-chart {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.control-row {
  height: 36px;
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(148, 163, 184, 0.24);
  padding: 0 10px;
}

.row-meta {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
}

.selection-state {
  font-size: 11px;
  color: #64748b;
  margin-right: 2px;
  max-width: 350px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selection-state.active {
  color: #166534;
  font-weight: 600;
}

.row-link {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: color 0.16s ease, opacity 0.16s ease;
  user-select: none;
}

.row-link:hover {
  color: #0f172a;
}

.row-link.disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}

.row-divider {
  font-size: 11px;
  color: #94a3b8;
}
</style>
