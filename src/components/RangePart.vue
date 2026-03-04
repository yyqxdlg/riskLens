<template>
  <div class="range-wrapper">
    <div class="chart-stage">
      <aside class="guidance-section">
        <div class="header-row">
          <span class="pulse-icon"></span>
          <h3 class="section-title">Distribution Context</h3>
        </div>

        <div class="dynamic-narrative">
          <div class="guide-metrics">
            <div class="guide-metric">
              <span class="metric-label">Filtered Cohort</span>
              <span class="metric-value">{{ filteredPopulationCount.toLocaleString() }}</span>
            </div>
            <div class="guide-metric">
              <span class="metric-label">Population Share</span>
              <span class="metric-value">{{ filteredPopulationShareText }}</span>
            </div>
          </div>
          <p class="guide-hook">
            <strong>Gray</strong> shows the full-population share. <strong>Blue and orange</strong> show the selected subgroup as a
            share of all people.
          </p>
          <div class="guide-legend-row">
            <span class="legend-chip"><span class="legend-swatch bg"></span>All population</span>
            <span class="legend-chip"><span class="legend-swatch healthy"></span>Selected No CVD</span>
            <span class="legend-chip"><span class="legend-swatch risk"></span>Selected CVD</span>
          </div>
          <p class="guide-summary">The percentage axis contracts around active selections so low-prevalence groups remain readable.</p>
        </div>
      </aside>

      <div class="chart-panel">
        <div ref="chartRef" class="range-chart" />
        <div v-if="isBusy" class="chart-loading">
          <span class="loading-heart" aria-hidden="true">
            <span class="heart-shape"></span>
          </span>
          <span class="loading-text">Updating linked distributions...</span>
        </div>
      </div>
    </div>

    <div class="control-row">
      <div class="mode-switch" aria-label="Range chart mode">
        <span
          class="mode-chip"
          :class="{ active: viewMode === 'composition' }"
          @click="setViewMode('composition')"
        >
          Composition
        </span>
        <span
          class="mode-chip"
          :class="{ active: viewMode === 'impact' }"
          @click="setViewMode('impact')"
        >
          Impact
        </span>
      </div>

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
import rangePartIndex from '@/assets/range_part_index.json'

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
  userInputs: {
    type: Object,
    default: () => ({
      age: null,
      bmi: null,
      sbp: null,
      chol: null,
      diabetes: null
    })
  },
  clearSignal: {
    type: Number,
    default: 0
  },
  clearRequest: {
    type: Object,
    default: () => ({
      token: 0,
      key: ''
    })
  }
})

const emit = defineEmits(['updateFilters', 'updateSelection'])

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

const INPUT_LIMITS = {
  age: [18, 95],
  bmi: [14.9, 68.9],
  sbp: [80, 220],
  chol: [100, 450]
}
const CATEGORY_WINDOWS = {
  ageGroup: {
    'Young Adult': [18, 40],
    'Middle-Aged': [40, 60],
    Senior: [60, 75],
    Elderly: [75, 95]
  },
  bmiGroup: {
    Underweight: [14.9, 18.5],
    Healthy: [18.5, 25],
    Overweight: [25, 30],
    'Obese I': [30, 35],
    'Severe Obesity': [35, 68.9]
  },
  bpGroup: {
    Low: [80, 90],
    Normal: [90, 120],
    Elevated: [120, 130],
    'Stage 1': [130, 140],
    'Stage 2': [140, 180],
    Crisis: [180, 220]
  },
  lipidGroup: {
    Desirable: [100, 200],
    Borderline: [200, 240],
    High: [240, 400],
    Extreme: [400, 450]
  },
  diabetesLabel: {
    'Non-Diabetic': [0, 0.5],
    Diabetic: [0.5, 1]
  }
}
const inputKeyByDim = {
  ageGroup: 'age',
  bmiGroup: 'bmi',
  bpGroup: 'sbp',
  lipidGroup: 'chol',
  diabetesLabel: 'diabetes'
}
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const totalGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#edf2f7' },
  { offset: 1, color: '#dbe3ec' }
])
const noCvdGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#7db2ff' },
  { offset: 1, color: '#5c8ff2' }
])
const cvdGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#f7b267' },
  { offset: 1, color: '#ec8b2d' }
])

const mutedOpacity = 0.18
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
const viewMode = ref('composition')
const indexedUnionCache = new Map()
const isBusy = ref(false)
let busyTimer = null

const dedupe = (arr = []) => [...new Set(arr)]
const shortLabel = (name) => shortLabelMap[name] || name
const dimensionLabelMap = {
  ageGroup: 'Age',
  bmiGroup: 'BMI',
  bpGroup: 'SBP',
  lipidGroup: 'CHOL',
  diabetesLabel: 'DIABETES'
}
const categoryRangeLabelMap = {
  ageGroup: {
    'Young Adult': '18-39',
    'Middle-Aged': '40-59',
    Senior: '60-74',
    Elderly: '75+'
  },
  bmiGroup: {
    Underweight: '<18.5',
    Healthy: '18.5-24.9',
    Overweight: '25-29.9',
    'Obese I': '30-34.9',
    'Severe Obesity': '35+'
  },
  bpGroup: {
    Low: '<90',
    Normal: '90-119',
    Elevated: '120-129',
    'Stage 1': '130-139',
    'Stage 2': '140-179',
    Crisis: '180+'
  },
  lipidGroup: {
    Desirable: '<200',
    Borderline: '200-239',
    High: '240-399',
    Extreme: '400+'
  }
}
const expansionStepByDim = {
  ageGroup: 5,
  bmiGroup: 3,
  bpGroup: 10,
  lipidGroup: 40
}

const buildDisplayLabel = (dimKey, category, isExpanded = false) => {
  const base = `${shortLabel(category)}${isExpanded ? '*' : ''}`
  const rangeText = categoryRangeLabelMap?.[dimKey]?.[category]
  return rangeText ? `${base}\n${rangeText}` : base
}

const buildMicroRangeLabel = (dimKey, minRaw, maxRaw) => {
  if (!Number.isFinite(minRaw) || !Number.isFinite(maxRaw)) return ''
  if (dimKey === 'ageGroup' || dimKey === 'bpGroup' || dimKey === 'lipidGroup') {
    return `${Math.round(minRaw)}-${Math.round(maxRaw)}`
  }
  if (dimKey === 'bmiGroup') {
    return `${Number(minRaw).toFixed(1)}-${Number(maxRaw).toFixed(1)}`
  }
  return ''
}

const startBusy = () => {
  if (busyTimer) clearTimeout(busyTimer)
  isBusy.value = true
}

const finishBusy = () => {
  if (busyTimer) clearTimeout(busyTimer)
  busyTimer = setTimeout(() => {
    isBusy.value = false
  }, 180)
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

const globalPopulationTotal = computed(() => props.rawGroupData?.length || 0)
const globalCvdTotal = computed(() =>
  (props.rawGroupData || []).reduce((acc, row) => acc + (row.rawValues?.CVD === 1 ? 1 : 0), 0)
)
const overallCvdRate = computed(() => {
  if (!globalPopulationTotal.value) return 0
  return globalCvdTotal.value / globalPopulationTotal.value
})
const filteredPopulationCount = computed(() => getFilteredRowsForDim().length)
const filteredPopulationShareText = computed(() => {
  if (!globalPopulationTotal.value) return '0.0%'
  return `${((filteredPopulationCount.value / globalPopulationTotal.value) * 100).toFixed(1)}%`
})
const selectedSubgroupRows = computed(() => getExactSelectedRows())
const hasSubgroupFilter = computed(() =>
  globalPopulationTotal.value > 0
  && filteredPopulationCount.value > 0
  && filteredPopulationCount.value < globalPopulationTotal.value
)
const canUseIndexedLookup = computed(() =>
  Array.isArray(rangePartIndex?.allRowIds)
  && Number(rangePartIndex?.totalRows) === Number(props.rawGroupData?.length || 0)
)

const mergeSortedUnique = (arrays = []) => {
  const merged = []
  const pointers = arrays.map(() => 0)

  while (arrays.some((arr, idx) => pointers[idx] < arr.length)) {
    let min = Infinity
    let found = false
    arrays.forEach((arr, idx) => {
      const pointer = pointers[idx]
      if (pointer >= arr.length) return
      const value = arr[pointer]
      if (value < min) min = value
      found = true
    })
    if (!found) break

    merged.push(min)
    arrays.forEach((arr, idx) => {
      while (pointers[idx] < arr.length && arr[pointers[idx]] <= min) {
        pointers[idx] += 1
      }
    })
  }

  return merged
}

const intersectSorted = (left = [], right = []) => {
  const result = []
  let i = 0
  let j = 0

  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      result.push(left[i])
      i += 1
      j += 1
      continue
    }
    if (left[i] < right[j]) i += 1
    else j += 1
  }

  return result
}

const getIndexedRowIdsForSelection = (dimKey, categories = []) => {
  if (!canUseIndexedLookup.value) return null

  const cleaned = dedupe(categories).filter(Boolean).sort()
  if (!cleaned.length) return null

  const cacheKey = `${dimKey}:${cleaned.join('|')}`
  if (indexedUnionCache.has(cacheKey)) return indexedUnionCache.get(cacheKey)

  const rowIdsByCategory = rangePartIndex?.rowIdsByDimension?.[dimKey] || {}
  const merged = mergeSortedUnique(cleaned.map(category => rowIdsByCategory[category] || []))
  indexedUnionCache.set(cacheKey, merged)
  return merged
}

const getActiveSelectionsForRow = (skipDimKey) => {
  const activeSelections = []

  allDimensions.forEach((dim) => {
    if (dim.key === skipDimKey) return
    const context = contextSelectionFor(dim.key)
    const selected = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])

    if (context.length && selected.length) {
      const overlap = selected.filter(item => context.includes(item))
      activeSelections.push({ dimKey: dim.key, categories: overlap.length ? overlap : selected })
      return
    }
    if (context.length) {
      activeSelections.push({ dimKey: dim.key, categories: context })
      return
    }
    if (selected.length) {
      activeSelections.push({ dimKey: dim.key, categories: selected })
    }
  })

  return activeSelections
}

const getFilteredRowsForDim = (skipDimKey) => {
  const activeSelections = getActiveSelectionsForRow(skipDimKey)

  if (!activeSelections.length) return props.rawGroupData

  if (!canUseIndexedLookup.value) {
    return props.rawGroupData.filter(row => matchesRowWithCombinedFilters(row, skipDimKey))
  }

  const candidateSets = activeSelections
    .map(({ dimKey, categories }) => getIndexedRowIdsForSelection(dimKey, categories))
    .filter(Boolean)
    .sort((a, b) => a.length - b.length)

  if (!candidateSets.length) return props.rawGroupData

  let filteredIds = candidateSets[0]
  for (let i = 1; i < candidateSets.length; i += 1) {
    filteredIds = intersectSorted(filteredIds, candidateSets[i])
    if (!filteredIds.length) break
  }

  return filteredIds.map(index => props.rawGroupData[index])
}

const getSelectedBarMatchers = (dimKey) => {
  const selectedIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  if (!selectedIds.size) return []

  const bars = rowDataByDim.value[dimKey]?.bars || []
  return bars
    .filter(bar => selectedIds.has(bar.id) && !bar.isGap)
    .map(bar => ({
      category: bar.category,
      minRaw: Number(bar.minRaw),
      maxRaw: Number(bar.maxRaw)
    }))
}

const matchesPreciseBarSelection = (row, dimKey) => {
  const matchers = getSelectedBarMatchers(dimKey)
  if (!matchers.length) return true

  const dim = allDimensions.find(item => item.key === dimKey)
  if (!dim) return true

  const category = row.displayGroups?.[dimKey]
  const raw = Number(row.rawValues?.[dim.rawKey])

  return matchers.some((matcher) => {
    if (matcher.category !== category) return false
    if (!Number.isFinite(matcher.minRaw) || !Number.isFinite(matcher.maxRaw) || !Number.isFinite(raw)) {
      return true
    }
    return raw >= matcher.minRaw && raw <= matcher.maxRaw
  })
}

const getExactSelectedRows = () => {
  const categoryMatchedRows = getFilteredRowsForDim()
  if (!categoryMatchedRows.length) return []

  return categoryMatchedRows.filter((row) => (
    chartDimensions.every(dim => matchesPreciseBarSelection(row, dim.key))
  ))
}

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
      const rangedText = getSelectedRangeText(dimKey)
      if (rangedText) return `${dimensionLabelMap[dimKey]}: ${rangedText}`
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

const formatRawRangeValue = (dimKey, value) => {
  if (!Number.isFinite(value)) return ''
  if (dimKey === 'ageGroup' || dimKey === 'bpGroup' || dimKey === 'lipidGroup') {
    return `${Math.round(value)}`
  }
  return `${Number(value).toFixed(1)}`
}

const getSelectedRangeText = (dimKey) => {
  const selectedIds = selectedBarIdsByDim.value[dimKey] || []
  if (!selectedIds.length) return ''

  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selectedBars = bars.filter(bar => selectedIds.includes(bar.id))
  if (!selectedBars.length) return ''

  const minValues = selectedBars
    .map(bar => Number(bar.minRaw))
    .filter(Number.isFinite)
  const maxValues = selectedBars
    .map(bar => Number(bar.maxRaw))
    .filter(Number.isFinite)

  if (!minValues.length || !maxValues.length) return ''

  const min = Math.min(...minValues)
  const max = Math.max(...maxValues)
  return `${formatRawRangeValue(dimKey, min)}-${formatRawRangeValue(dimKey, max)}`
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

const emitExactSelection = () => {
  const rowIds = getExactSelectedRows().map(row => props.rawGroupData.indexOf(row))
  emit('updateSelection', rowIds)
}

const removeSelectionForDim = (dimKey) => {
  setMapValue(selectedByDim, dimKey, [])
  setMapValue(expandedByDim, dimKey, [])
  setMapValue(selectedBarIdsByDim, dimKey, [])
  setMapValue(brushSpanByDim, dimKey, null)
  rebuildAndRender()
  emitAllFilters()
  emitExactSelection()
}

const contextSelectionFor = (dimKey) => {
  const incoming = props.contextFilters?.[dimKey] || []
  const allCats = baseCategoriesByDim.value[dimKey] || []
  return dedupe(incoming).filter(v => allCats.includes(v))
}

const clearLocalSelectionsForChangedContext = (nextContext = {}) => {
  let changed = false
  const nextSelected = { ...selectedByDim.value }
  const nextExpanded = { ...expandedByDim.value }
  const nextBarIds = { ...selectedBarIdsByDim.value }
  const nextSpans = { ...brushSpanByDim.value }

  chartDimensions.forEach((dim) => {
    const nextValues = dedupe(nextContext?.[dim.key] || [])
    if (!nextValues.length) return

    if ((nextSelected[dim.key] || []).length) {
      nextSelected[dim.key] = []
      changed = true
    }
    if ((nextExpanded[dim.key] || []).length) {
      nextExpanded[dim.key] = []
      changed = true
    }
    if ((nextBarIds[dim.key] || []).length) {
      nextBarIds[dim.key] = []
      changed = true
    }
    if (nextSpans[dim.key]) {
      nextSpans[dim.key] = null
      changed = true
    }
  })

  if (!changed) return

  selectedByDim.value = nextSelected
  expandedByDim.value = nextExpanded
  selectedBarIdsByDim.value = nextBarIds
  brushSpanByDim.value = nextSpans
}

const matchesRowWithCombinedFilters = (row, skipDimKey) => {
  return allDimensions.every(dim => {
    if (dim.key === skipDimKey) return true

    const value = row.displayGroups?.[dim.key]
    if (!value) return false

    const context = contextSelectionFor(dim.key)
    const selected = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])

    if (context.length && selected.length) {
      const overlap = selected.filter(item => context.includes(item))
      return (overlap.length ? overlap : selected).includes(value)
    }
    if (context.length) return context.includes(value)
    if (selected.length) return selected.includes(value)
    return true
  })
}

const clearConflictingSelectionsWithContext = () => {
  // Keep chart-side selections intact even when a form input exists on the same dimension.
  // This allows typed values to place the marker line while brush/click can refine the range.
}

const rebuildBaseCategories = () => {
  indexedUnionCache.clear()
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

const roundUp = (value, step = 0.5) => {
  if (!Number.isFinite(value) || value <= 0) return step
  return Math.ceil(value / step) * step
}

const smartPercentLabel = (value) => {
  const numeric = Number(value) || 0
  if (numeric >= 10) return `${Math.round(numeric)}%`
  if (numeric >= 1) return `${numeric.toFixed(1)}%`
  if (numeric >= 0.1) return `${numeric.toFixed(2)}%`
  return `${numeric.toFixed(3)}%`
}

const buildSteppedChunks = (rows, dim, category) => {
  const step = expansionStepByDim[dim.key]
  if (!step || rows.length <= 1) return [rows]

  const window = CATEGORY_WINDOWS?.[dim.key]?.[category]
  const baseMin = Array.isArray(window) ? Number(window[0]) : Number(rows[0]?.rawValues?.[dim.rawKey])
  const safeBaseMin = Number.isFinite(baseMin) ? baseMin : 0
  const buckets = new Map()

  rows.forEach((row) => {
    const raw = Number(row.rawValues?.[dim.rawKey])
    if (!Number.isFinite(raw)) return
    const bucketIndex = Math.max(0, Math.floor((raw - safeBaseMin) / step))
    if (!buckets.has(bucketIndex)) buckets.set(bucketIndex, [])
    buckets.get(bucketIndex).push(row)
  })

  return [...buckets.keys()]
    .sort((a, b) => a - b)
    .map(key => buckets.get(key))
    .filter(chunk => chunk?.length)
}

const buildRowDataForDim = (dim) => {
  const categories = baseCategoriesByDim.value[dim.key] || []
  const expandedSet = new Set(expandedByDim.value[dim.key] || [])

  const filteredRows = selectedSubgroupRows.value

  const rowsByCategory = new Map()
  filteredRows.forEach((row) => {
    const category = row.displayGroups?.[dim.key]
    if (!category) return
    if (!rowsByCategory.has(category)) rowsByCategory.set(category, [])
    rowsByCategory.get(category).push(row)
  })

  const allRowsByCategory = new Map()
  props.rawGroupData.forEach((row) => {
    const category = row.displayGroups?.[dim.key]
    if (!category) return
    if (!allRowsByCategory.has(category)) allRowsByCategory.set(category, [])
    allRowsByCategory.get(category).push(row)
  })

  const bars = []
  const labelByIndex = {}

  categories.forEach((category) => {
    const baseRows = rowsByCategory.get(category) || []
    const allCategoryRows = allRowsByCategory.get(category) || []
    const canStepExpand = !!expansionStepByDim[dim.key]
    const shouldExpand = expandedSet.has(category) && canStepExpand && allCategoryRows.length > 3
    const categoryRows = shouldExpand
      ? [...baseRows].sort((a, b) => Number(a.rawValues[dim.rawKey] || 0) - Number(b.rawValues[dim.rawKey] || 0))
      : baseRows
    const allRows = shouldExpand
      ? [...allCategoryRows].sort((a, b) => Number(a.rawValues[dim.rawKey] || 0) - Number(b.rawValues[dim.rawKey] || 0))
      : allCategoryRows
    const start = bars.length

    if (shouldExpand) {
      const chunks = buildSteppedChunks(allRows, dim, category)
      const usedChunks = chunks.length > 1 ? chunks : [allRows]

      for (let i = 0; i < usedChunks.length; i += 1) {
        const chunk = usedChunks[i]
        const allTotal = chunk.length
        const minRaw = allTotal ? Number(chunk[0].rawValues[dim.rawKey]) : null
        const maxRaw = allTotal ? Number(chunk[chunk.length - 1].rawValues[dim.rawKey]) : null
        const selectedChunk = categoryRows.filter((row) => {
          const raw = Number(row.rawValues?.[dim.rawKey])
          return Number.isFinite(raw) && raw >= minRaw && raw <= maxRaw
        })
        const total = selectedChunk.length
        const cvd = selectedChunk.reduce((acc, row) => acc + (row.rawValues.CVD === 1 ? 1 : 0), 0)
        const nextIndex = bars.length

        bars.push({
          id: `${dim.key}|${category}|micro|${i}`,
          category,
          isGap: false,
          isMicro: true,
          allTotal,
          total,
          cvd,
          noCvd: total - cvd,
          minRaw,
          maxRaw
        })

        const microLabel = buildMicroRangeLabel(dim.key, minRaw, maxRaw)
        if (microLabel) {
          labelByIndex[nextIndex] = microLabel
        }
      }

      if (dim.key !== 'ageGroup') {
        const end = bars.length - 1
        const center = Math.round((start + end) / 2)
        labelByIndex[center] = buildDisplayLabel(dim.key, category, true)
      }
    } else {
      const total = categoryRows.length
      const cvd = categoryRows.reduce((acc, row) => acc + (row.rawValues.CVD === 1 ? 1 : 0), 0)
      const allTotal = allRows.length
      let minRaw = null
      let maxRaw = null
      allRows.forEach((row) => {
        const raw = Number(row.rawValues?.[dim.rawKey])
        if (!Number.isFinite(raw)) return
        if (minRaw === null || raw < minRaw) minRaw = raw
        if (maxRaw === null || raw > maxRaw) maxRaw = raw
      })

      bars.push({
        id: `${dim.key}|${category}|macro`,
        category,
        isGap: false,
        isMicro: false,
        allTotal,
        total,
        cvd,
        noCvd: total - cvd,
        minRaw,
        maxRaw
      })

      labelByIndex[bars.length - 1] = buildDisplayLabel(dim.key, category, false)
    }

  })

  const rowTotal = bars.reduce((acc, bar) => acc + (bar.isGap ? 0 : bar.total), 0)
  const allPopulation = globalPopulationTotal.value
  const allCvd = globalCvdTotal.value
  const overallRate = overallCvdRate.value
  const normalizedBars = bars.map((bar) => {
    if (bar.isGap) return bar
    const total = Number(bar.total) || 0
    const allTotal = Number(bar.allTotal) || 0
    const groupCvdRate = total > 0 ? (bar.cvd / total) : 0
    const selectedCvdShareAll = allPopulation > 0 ? (bar.cvd / allPopulation) * 100 : 0
    const selectedNoCvdShareAll = allPopulation > 0 ? (bar.noCvd / allPopulation) * 100 : 0
    const selectedCvdShareRow = rowTotal > 0 ? (bar.cvd / rowTotal) * 100 : 0
    const selectedNoCvdShareRow = rowTotal > 0 ? (bar.noCvd / rowTotal) * 100 : 0
    const groupShare = rowTotal > 0 ? (total / rowTotal) * 100 : 0
    const groupShareAll = allPopulation > 0 ? (total / allPopulation) * 100 : 0
    const allShareAll = allPopulation > 0 ? (allTotal / allPopulation) * 100 : 0
    const cvdContributionAll = allCvd > 0 ? (bar.cvd / allCvd) * 100 : 0
    const riskLift = overallRate > 0 ? groupCvdRate / overallRate : 0
    const riskDiff = (groupCvdRate - overallRate) * 100
    return {
      ...bar,
      selectedCvdShareAll,
      selectedNoCvdShareAll,
      selectedCvdShareRow,
      selectedNoCvdShareRow,
      groupShare,
      groupShareAll,
      allShareAll,
      cvdContributionAll,
      groupCvdRate: groupCvdRate * 100,
      riskLift,
      riskDiff
    }
  })
  const maxLift = normalizedBars.reduce((acc, bar) => {
    if (bar.isGap || !Number.isFinite(bar.riskLift)) return acc
    return Math.max(acc, bar.riskLift)
  }, 0)
  const barsWithSignals = normalizedBars.map((bar) => {
    if (bar.isGap) return bar
    return {
      ...bar,
      riskSignal: maxLift > 0 ? (bar.riskLift / maxLift) * 100 : 0
    }
  })

  const maxAllShare = barsWithSignals.reduce((acc, bar) => {
    if (bar.isGap || !Number.isFinite(bar.allShareAll)) return acc
    return Math.max(acc, bar.allShareAll)
  }, 0)
  const maxSelectedShare = barsWithSignals.reduce((acc, bar) => {
    if (bar.isGap) return acc
    return Math.max(
      acc,
      Number.isFinite(bar.selectedNoCvdShareAll) ? bar.selectedNoCvdShareAll : 0,
      Number.isFinite(bar.selectedCvdShareAll) ? bar.selectedCvdShareAll : 0,
      Number.isFinite(bar.groupShareAll) ? bar.groupShareAll : 0
    )
  }, 0)
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dim.key] || [])
  const selectedCategories = new Set(normalizeSelection(dim.key, selectedByDim.value[dim.key] || []))
  const explicitFocusBars = barsWithSignals.filter((bar) => {
    if (bar.isGap) return false
    if (selectedBarIds.size > 0) return selectedBarIds.has(bar.id)
    if (selectedCategories.size > 0) return selectedCategories.has(bar.category)
    return false
  })
  const focusBars = explicitFocusBars.length
    ? explicitFocusBars
    : barsWithSignals.filter(bar => !bar.isGap)
  const focusMaxSelectedShare = focusBars.reduce((acc, bar) => {
    return Math.max(acc, Number(bar.groupShareAll) || 0)
  }, 0)
  const baseAxisMax = Math.max(4, roundUp(Math.max(maxAllShare, maxSelectedShare) * 1.12, 2))
  const zoomAxisMax = Math.max(
    focusMaxSelectedShare < 1 ? 0.4 : focusMaxSelectedShare < 5 ? 1.5 : 3,
    roundUp(
      focusMaxSelectedShare * 1.45,
      focusMaxSelectedShare < 1 ? 0.1 : focusMaxSelectedShare < 5 ? 0.5 : 1
    )
  )

  return {
    categories,
    bars: barsWithSignals,
    labelByIndex,
    axisMax: baseAxisMax,
    zoomAxisMax: Math.min(baseAxisMax, zoomAxisMax),
    impactAxisMax: Math.max(1.5, roundUp(maxLift * 1.16, 0.5)),
    rowTotal
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
  clearConflictingSelectionsWithContext()
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
  if (chart) {
    suppressBrushEvent = true
    chart.setOption({
      series: chartDimensions.flatMap((dim) => ([
        { id: makeSeriesId(dim.key, 'total'), markArea: { silent: true, data: [] } },
        { id: makeSeriesId(dim.key, 'impact'), markArea: { silent: true, data: [] } }
      ]))
    }, false, true)
    syncBrushArea()
    requestAnimationFrame(() => {
      suppressBrushEvent = false
    })
  }
}

const makeSeriesId = (dimKey, metric) => `${dimKey}__${metric}`

const parseSeriesId = (seriesId = '') => {
  const [dimKey, metric] = seriesId.split('__')
  return { dimKey, metric }
}

const buildTotalData = (dimKey, options = {}) => {
  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const hasBarSelected = selectedBarIds.size > 0
  const zoomed = !!options.zoomed
  const zoomStrength = Number(options.zoomStrength) || 1
  const baseOpacity = zoomed
    ? Math.min(0.8, 0.56 + (zoomStrength - 1) * 0.12)
    : 0.54
  return bars.map(bar => {
    if (bar.isGap) return { value: 0, itemStyle: { color: 'rgba(0,0,0,0)' } }
    return {
      value: bar.allShareAll || 0,
      itemStyle: {
        color: totalGradient,
        borderRadius: [0, 0, 0, 0],
        opacity: hasBarSelected ? (selectedBarIds.has(bar.id) ? 0.82 : 0.12) : baseOpacity,
        borderWidth: 0,
        shadowBlur: hasBarSelected && selectedBarIds.has(bar.id) ? 10 : 0,
        shadowColor: 'rgba(37,99,235,0.18)'
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
    const subgroupShare = Number(bar.groupShareAll) || 0
    const shouldLabelNoCvd = metric === 'noCvd' && subgroupShare > 0 && Number(bar.selectedCvdShareAll || 0) <= 0
    const shouldLabelCvd = metric === 'cvd' && subgroupShare > 0
    return {
      value: metric === 'noCvd' ? bar.selectedNoCvdShareAll : bar.selectedCvdShareAll,
      label: {
        show: !bar.isMicro && (shouldLabelNoCvd || shouldLabelCvd),
        position: 'top',
        distance: 4,
        color: enabled ? '#1e3a8a' : '#64748b',
        fontSize: 9.5,
        fontWeight: 700,
        formatter: smartPercentLabel(subgroupShare)
      },
      itemStyle: {
        color,
        opacity: enabled ? activeOpacity : mutedOpacity,
        borderWidth: 0,
        shadowBlur: enabled && hasBarSelected ? 10 : 0,
        shadowColor: metric === 'noCvd' ? 'rgba(29,78,216,0.35)' : 'rgba(194,65,12,0.35)',
        borderRadius: [0, 0, 0, 0]
      }
    }
  })
}

const impactLowerGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#8ac5ff' },
  { offset: 1, color: '#3973d8' }
])
const impactHigherGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#fdba74' },
  { offset: 1, color: '#ea580c' }
])

const buildImpactData = (dimKey) => {
  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selected = new Set(normalizeSelection(dimKey, selectedByDim.value[dimKey] || []))
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const hasSelected = selected.size > 0
  const hasBarSelected = selectedBarIds.size > 0

  return bars.map((bar) => {
    if (bar.isGap) return { value: 0, itemStyle: { color: 'rgba(0,0,0,0)' } }

    const enabled = hasBarSelected
      ? selectedBarIds.has(bar.id)
      : (!hasSelected || selected.has(bar.category))
    const liftValue = Number(bar.riskLift) || 0

    return {
      value: liftValue,
      itemStyle: {
        color: liftValue > 1 ? impactHigherGradient : impactLowerGradient,
        opacity: enabled ? activeOpacity : mutedOpacity,
        borderWidth: 0,
        shadowBlur: enabled && hasBarSelected ? 10 : 0,
        shadowColor: liftValue > 1 ? 'rgba(194,65,12,0.28)' : 'rgba(29,78,216,0.28)',
        borderRadius: [0, 0, 0, 0]
      }
    }
  })
}

const resolveInputCategory = (dimKey, inputValue) => {
  if (dimKey === 'ageGroup') {
    if (inputValue < 40) return 'Young Adult'
    if (inputValue < 60) return 'Middle-Aged'
    if (inputValue < 75) return 'Senior'
    return 'Elderly'
  }

  if (dimKey === 'bmiGroup') {
    if (inputValue < 18.5) return 'Underweight'
    if (inputValue < 25) return 'Healthy'
    if (inputValue < 30) return 'Overweight'
    if (inputValue < 35) return 'Obese I'
    return 'Severe Obesity'
  }

  if (dimKey === 'bpGroup') {
    if (inputValue < 90) return 'Low'
    if (inputValue < 120) return 'Normal'
    if (inputValue < 130) return 'Elevated'
    if (inputValue < 140) return 'Stage 1'
    if (inputValue < 180) return 'Stage 2'
    return 'Crisis'
  }

  if (dimKey === 'lipidGroup') {
    if (inputValue < 200) return 'Desirable'
    if (inputValue < 240) return 'Borderline'
    if (inputValue < 400) return 'High'
    return 'Extreme'
  }

  if (dimKey === 'diabetesLabel') {
    return inputValue >= 0.5 ? 'Diabetic' : 'Non-Diabetic'
  }

  return null
}

const getInputValueForDim = (dimKey) => {
  const inputKey = inputKeyByDim[dimKey]
  if (!inputKey) return null

  const rawSource = props.userInputs?.[inputKey]
  if (rawSource === null || rawSource === undefined || rawSource === '') return null

  if (dimKey === 'diabetesLabel') {
    if (Array.isArray(rawSource)) {
      if (!rawSource.length) return null
      if (rawSource.includes('Diabetic')) return 1
      if (rawSource.includes('Non-Diabetic')) return 0
      return null
    }

    const raw = Number(rawSource)
    if (!Number.isFinite(raw)) return null
    return clamp(raw, 0, 1)
  }

  if (Array.isArray(rawSource)) return null

  const raw = Number(rawSource)
  if (!Number.isFinite(raw)) return null

  const range = INPUT_LIMITS[inputKey]
  if (!range) return raw
  return clamp(raw, range[0], range[1])
}

const resolveUserMarkerIndex = (dimKey, row) => {
  const value = getInputValueForDim(dimKey)
  if (value === null) return null

  const bars = row?.bars || []
  if (!bars.length) return null

  const targetCategory = resolveInputCategory(dimKey, value)
  if (!targetCategory) return null

  const axisIndexWithinBar = (index, bar, inputValue) => {
    const minRaw = Number(bar?.minRaw)
    const maxRaw = Number(bar?.maxRaw)
    if (!Number.isFinite(minRaw) || !Number.isFinite(maxRaw) || maxRaw <= minRaw) {
      return index
    }
    const ratio = clamp((inputValue - minRaw) / (maxRaw - minRaw), 0, 1)
    const halfWidth = 0.42
    return index - halfWidth + ratio * (halfWidth * 2)
  }

  const rangedCandidates = bars
    .map((bar, index) => ({ bar, index }))
    .filter(({ bar }) => !bar.isGap && bar.category === targetCategory && bar.minRaw !== null && bar.maxRaw !== null)

  if (rangedCandidates.length) {
    const inside = rangedCandidates.find(({ bar }) => value >= bar.minRaw && value <= bar.maxRaw)
    if (inside) return axisIndexWithinBar(inside.index, inside.bar, value)

    const nearest = rangedCandidates.reduce((best, item) => {
      const mid = (item.bar.minRaw + item.bar.maxRaw) / 2
      const dist = Math.abs(mid - value)
      if (!best || dist < best.dist) return { item, dist }
      return best
    }, null)
    return nearest?.item
      ? axisIndexWithinBar(nearest.item.index, nearest.item.bar, value)
      : null
  }

  const categoryBarIndex = bars.findIndex(bar => !bar.isGap && bar.category === targetCategory)
  if (categoryBarIndex >= 0) {
    if (dimKey === 'diabetesLabel') return categoryBarIndex

    const window = CATEGORY_WINDOWS?.[dimKey]?.[targetCategory]
    if (!window || window.length < 2) return categoryBarIndex

    const [min, max] = window
    if (!(max > min)) return categoryBarIndex

    const ratio = clamp((value - min) / (max - min), 0, 1)
    // Category axis is centered at integer index; offset lets the marker reflect
    // the relative position inside the selected category.
    return categoryBarIndex - 0.36 + ratio * 0.72
  }

  const anyRangedBars = bars
    .map((bar, index) => ({ bar, index }))
    .filter(({ bar }) => !bar.isGap && bar.minRaw !== null && bar.maxRaw !== null)

  if (anyRangedBars.length) {
    const nearest = anyRangedBars.reduce((best, item) => {
      const mid = (item.bar.minRaw + item.bar.maxRaw) / 2
      const dist = Math.abs(mid - value)
      if (!best || dist < best.dist) return { item, dist }
      return best
    }, null)
    return nearest?.item
      ? axisIndexWithinBar(nearest.item.index, nearest.item.bar, value)
      : null
  }

  const firstVisible = bars.findIndex(bar => !bar.isGap)
  return firstVisible >= 0 ? firstVisible : null
}

const buildUserMarkLine = (markerIndex) => {
  if (!Number.isFinite(markerIndex) || markerIndex < 0) {
    return {
      symbol: ['none', 'none'],
      silent: true,
      data: []
    }
  }

  return {
    symbol: ['none', 'none'],
    silent: true,
    precision: 2,
    lineStyle: {
      color: 'rgba(30,64,175,0.82)',
      width: 1.4,
      type: 'dashed',
      opacity: 0.9
    },
    label: {
      show: false
    },
    data: [{ xAxis: markerIndex }]
  }
}

const buildImpactMarkLine = (markerIndex) => {
  const data = [
    {
      yAxis: 1,
      lineStyle: {
        color: 'rgba(100,116,139,0.5)',
        width: 1,
        type: 'dashed',
        opacity: 0.9
      },
      label: {
        show: false
      }
    }
  ]

  if (Number.isFinite(markerIndex) && markerIndex >= 0) {
    data.push({
      xAxis: markerIndex,
      lineStyle: {
        color: 'rgba(30,64,175,0.82)',
        width: 1.4,
        type: 'dashed',
        opacity: 0.9
      },
      label: {
        show: false
      }
    })
  }

  return {
    symbol: ['none', 'none'],
    silent: true,
    precision: 2,
    data
  }
}

const getSelectedIndexSegments = (dimKey) => {
  const rowBars = rowDataByDim.value[dimKey]?.bars || []
  if (!rowBars.length) return []

  const explicitIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const selectedCategories = new Set(normalizeSelection(dimKey, selectedByDim.value[dimKey] || []))

  const indices = rowBars
    .map((bar, index) => ({ bar, index }))
    .filter(({ bar }) => !bar.isGap && (
      explicitIds.size > 0
        ? explicitIds.has(bar.id)
        : selectedCategories.size > 0 && selectedCategories.has(bar.category)
    ))
    .map(({ index }) => index)

  if (!indices.length) return []

  const segments = []
  let start = indices[0]
  let prev = indices[0]

  for (let i = 1; i < indices.length; i += 1) {
    const current = indices[i]
    if (current === prev + 1) {
      prev = current
      continue
    }
    segments.push([start, prev])
    start = current
    prev = current
  }
  segments.push([start, prev])
  return segments
}

const buildSelectionMarkArea = (dimKey, axisMax) => {
  const segments = getSelectedIndexSegments(dimKey)
  if (!segments.length) {
    return {
      silent: true,
      data: []
    }
  }

  return {
    silent: true,
    itemStyle: {
      color: 'rgba(59,130,246,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(37,99,235,0.48)'
    },
    data: segments.map(([start, end]) => ([
      { xAxis: start - 0.48, yAxis: 0 },
      { xAxis: end + 0.48, yAxis: axisMax }
    ]))
  }
}

const buildOption = () => {
  const rowHeight = 66
  const rowGap = 5
  const topOffset = 16

  const grids = []
  const xAxis = []
  const yAxis = []
  const series = []

  chartDimensions.forEach((dim, rowIndex) => {
    const row = rowDataByDim.value[dim.key] || { bars: [], labelByIndex: {}, axisMax: 10, zoomAxisMax: 10, impactAxisMax: 2 }
    const markerIndex = resolveUserMarkerIndex(dim.key, row)
    const selectedSet = new Set(normalizeSelection(dim.key, selectedByDim.value[dim.key] || []))
    const rowHasLocalSelection = (selectedByDim.value[dim.key] || []).length > 0 || (selectedBarIdsByDim.value[dim.key] || []).length > 0
    const shouldZoomCompositionAxis = viewMode.value === 'composition' && (hasSubgroupFilter.value || rowHasLocalSelection)
    const compositionAxisMax = shouldZoomCompositionAxis ? row.zoomAxisMax : row.axisMax
    const zoomStrength = shouldZoomCompositionAxis && row.zoomAxisMax > 0
      ? Math.max(1, row.axisMax / row.zoomAxisMax)
      : 1
    const barCount = row.bars.length
    const barSize = barCount > 90
      ? 4
      : barCount > 70
        ? 5
        : barCount > 52
          ? 7
          : barCount > 36
            ? 9
            : barCount > 24
              ? 12
              : barCount > 16
                ? 15
                : barCount > 10
                  ? 20
                  : 30
    const barCategoryGap = barCount > 32
      ? '28%'
      : barCount > 20
        ? '18%'
        : barCount > 12
          ? '12%'
          : '8%'
    const backgroundBarWidth = shouldZoomCompositionAxis
      ? Math.min(46, Math.round(barSize * Math.min(1.45, 1 + (zoomStrength - 1) * 0.18)))
      : barSize
    const foregroundBarWidth = shouldZoomCompositionAxis
      ? Math.max(5, Math.round(backgroundBarWidth * 0.72))
      : Math.max(5, Math.round(barSize * 0.72))

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
        margin: dim.key === 'ageGroup' ? 10 : 7,
        fontSize: 9,
        fontWeight: 700,
        hideOverlap: true,
        color: '#475569',
        formatter: (_, idx) => {
          const label = row.labelByIndex[idx] || ''
          if (!label) return ''
          const [primaryLabel, secondaryLabel] = String(label).split('\n')
          const bar = row.bars[idx]
          const isActive = !!bar?.category && selectedSet.size > 0 && selectedSet.has(bar.category)
          if (secondaryLabel) {
            return isActive
              ? `{tagActive|${primaryLabel}}\n{rangeActive|${secondaryLabel}}`
              : `{tag|${primaryLabel}}\n{range|${secondaryLabel}}`
          }
          return isActive ? `{tagActive|${primaryLabel}}` : `{tag|${primaryLabel}}`
        },
        rich: {
          tag: {
            color: '#334155',
            backgroundColor: 'rgba(148,163,184,0.14)',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(148,163,184,0.18)',
            padding: [1, 6, 1, 6],
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
            padding: [1, 6, 1, 6],
            fontSize: 9.5,
            fontWeight: 700,
            lineHeight: 16
          },
          range: {
            color: '#94a3b8',
            fontSize: 8.5,
            fontWeight: 600,
            lineHeight: 12,
            padding: [1, 0, 0, 0]
          },
          rangeActive: {
            color: '#2563eb',
            fontSize: 8.5,
            fontWeight: 700,
            lineHeight: 12,
            padding: [1, 0, 0, 0]
          }
        }
      }
    })

    yAxis.push({
      type: 'value',
      gridIndex: rowIndex,
      min: 0,
      max: viewMode.value === 'impact' ? row.impactAxisMax : compositionAxisMax,
      splitNumber: 2,
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
        formatter: (v) => {
          if (rowIndex !== 0) return ''
          return viewMode.value === 'impact' ? `${Number(v).toFixed(1)}x` : smartPercentLabel(v)
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(15,23,42,0.09)',
          type: 'solid'
        }
      }
    })

    if (viewMode.value === 'impact') {
      series.push({
        id: makeSeriesId(dim.key, 'impact'),
        name: 'Relative Risk',
        type: 'bar',
        xAxisIndex: rowIndex,
        yAxisIndex: rowIndex,
        barWidth: barSize,
        barMaxWidth: 32,
        barCategoryGap,
        data: buildImpactData(dim.key),
        markArea: buildSelectionMarkArea(dim.key, row.impactAxisMax),
        markLine: buildImpactMarkLine(markerIndex),
        z: 3
      })
    } else {
      series.push({
        id: makeSeriesId(dim.key, 'total'),
        name: 'All Population',
        type: 'bar',
        xAxisIndex: rowIndex,
        yAxisIndex: rowIndex,
        barWidth: backgroundBarWidth,
        barMaxWidth: 42,
        barCategoryGap,
        barGap: '-100%',
        data: buildTotalData(dim.key, { zoomed: shouldZoomCompositionAxis, zoomStrength }),
        markArea: buildSelectionMarkArea(dim.key, compositionAxisMax),
        markLine: buildUserMarkLine(markerIndex),
        z: 1
      })

      series.push({
        id: makeSeriesId(dim.key, 'noCvd'),
        name: 'Filtered No CVD',
        type: 'bar',
        xAxisIndex: rowIndex,
        yAxisIndex: rowIndex,
        stack: `risk-${dim.key}`,
        barWidth: foregroundBarWidth,
        barMaxWidth: 32,
        barCategoryGap,
        data: buildRiskData(dim.key, 'noCvd'),
        z: 3
      })

      series.push({
        id: makeSeriesId(dim.key, 'cvd'),
        name: 'Filtered CVD',
        type: 'bar',
        xAxisIndex: rowIndex,
        yAxisIndex: rowIndex,
        stack: `risk-${dim.key}`,
        barWidth: foregroundBarWidth,
        barMaxWidth: 32,
        barCategoryGap,
        data: buildRiskData(dim.key, 'cvd'),
        z: 4
      })

    }
  })

  return {
    animation: viewMode.value === 'composition',
    animationDuration: viewMode.value === 'composition' ? 380 : 0,
    animationDurationUpdate: viewMode.value === 'composition' ? 620 : 0,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicInOut',
    backgroundColor: 'transparent',
    color: viewMode.value === 'impact'
      ? ['#3973d8']
      : ['#dbe3ec', '#5c8ff2', '#ec8b2d'],
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
      data: viewMode.value === 'impact'
        ? ['Relative Risk']
        : ['All Population', 'Filtered No CVD', 'Filtered CVD']
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
        const primary = params?.find(p => p.seriesId?.includes('__total') || p.seriesId?.includes('__impact'))
          || params?.[0]
        if (!primary) return ''

        const { dimKey } = parseSeriesId(primary.seriesId)
        const row = rowDataByDim.value[dimKey]
        const dim = chartDimensions.find(d => d.key === dimKey)
        const index = primary.dataIndex
        const bar = row?.bars?.[index]

        if (!row || !dim || !bar || bar.isGap) return ''

        const ratio = bar.total > 0 ? ((bar.cvd / bar.total) * 100).toFixed(1) : '0.0'
        const groupShare = bar.groupShare !== undefined ? bar.groupShare.toFixed(1) : '0.0'
        const groupShareAll = bar.groupShareAll !== undefined ? bar.groupShareAll.toFixed(1) : '0.0'
        const cvdContributionAll = bar.cvdContributionAll !== undefined ? bar.cvdContributionAll.toFixed(1) : '0.0'
        const groupCvdRate = bar.groupCvdRate !== undefined ? bar.groupCvdRate.toFixed(1) : '0.0'
        const populationRate = (overallCvdRate.value * 100).toFixed(1)
        const riskLift = bar.riskLift !== undefined ? bar.riskLift.toFixed(2) : '0.00'
        const riskDiff = bar.riskDiff !== undefined ? `${bar.riskDiff >= 0 ? '+' : ''}${bar.riskDiff.toFixed(1)}` : '+0.0'
        const rangeText = bar.isMicro && bar.minRaw !== null && bar.maxRaw !== null
          ? `${dim.label} range: ${bar.minRaw} - ${bar.maxRaw}`
          : `${dim.label} group: ${bar.category}`

        if (viewMode.value === 'impact') {
          return [
            `<b>${rangeText}</b>`,
            `Subgroup count: ${bar.total}`,
            `Group CVD rate: ${groupCvdRate}%`,
            `Population CVD rate: ${populationRate}%`,
            `Relative risk: ${riskLift}x`,
            `Risk difference: ${riskDiff} pts`,
            `Share within subgroup: ${groupShare}%`,
            `Share of all CVD cases: ${cvdContributionAll}%`
          ].join('<br/>')
        }

        return [
          `<b>${rangeText}</b>`,
          `All population: ${bar.allTotal}`,
          `Background share: ${bar.allShareAll.toFixed(1)}%`,
          `Current subgroup: ${bar.total}`,
          `Subgroup share of population: ${groupShareAll}%`,
          `Share within subgroup: ${groupShare}%`,
          `Subgroup No CVD: ${bar.noCvd}`,
          `Subgroup CVD: ${bar.cvd}`,
          `Subgroup CVD ratio: ${ratio}%`,
          `Share of all CVD cases: ${cvdContributionAll}%`
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
        borderWidth: 1.5,
        borderColor: 'rgba(37,99,235,0.72)',
        color: 'rgba(59,130,246,0.12)'
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
  startBusy()
  suppressBrushEvent = true
  chart.setOption(buildOption(), {
    notMerge: false,
    lazyUpdate: true,
    replaceMerge: ['grid', 'xAxis', 'yAxis', 'series', 'legend']
  })
  syncBrushArea()
  enableBrushCursor()
  requestAnimationFrame(() => {
    suppressBrushEvent = false
    finishBusy()
  })
}

const renderUserMarkersOnly = () => {
  if (!chart) return
  startBusy()
  const series = chartDimensions.map((dim) => {
    const row = rowDataByDim.value[dim.key] || { bars: [] }
    const markerIndex = resolveUserMarkerIndex(dim.key, row)
    return viewMode.value === 'impact'
      ? {
          id: makeSeriesId(dim.key, 'impact'),
          markLine: buildImpactMarkLine(markerIndex)
        }
      : {
          id: makeSeriesId(dim.key, 'total'),
          markLine: buildUserMarkLine(markerIndex)
        }
  })
  chart.setOption({ series }, false, true)
  requestAnimationFrame(() => {
    finishBusy()
  })
}

const setViewMode = (mode) => {
  if (!['composition', 'impact'].includes(mode) || viewMode.value === mode) return
  viewMode.value = mode
  renderChart()
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
  emitExactSelection()
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
  syncBrushArea()

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
      if (!dimKey || !['total', 'impact'].includes(metric)) return

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

  syncBrushArea()
  rebuildAndRender()
  emitAllFilters()
  emitExactSelection()
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
  emitExactSelection()
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
    if (!dimKey || !['total', 'noCvd', 'cvd', 'impact'].includes(metric)) return

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
  emitExactSelection()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (busyTimer) clearTimeout(busyTimer)
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
    emitExactSelection()
  },
  { deep: true }
)

watch(
  () => props.contextFilters,
  (next, prev) => {
    clearLocalSelectionsForChangedContext(next, prev)
    rebuildAndRender()
    emitAllFilters()
    emitExactSelection()
  },
  { deep: true }
)

watch(
  () => props.userInputs,
  () => {
    renderUserMarkersOnly()
  },
  { deep: true }
)

watch(
  () => props.clearSignal,
  () => {
    clearAllSelections()
    rebuildAndRender()
    emitAllFilters()
    emitExactSelection()
  }
)

watch(
  () => props.clearRequest?.token,
  () => {
    const dimKey = props.clearRequest?.key
    if (!dimKey) return
    removeSelectionForDim(dimKey)
  }
)
</script>

<style scoped>
.range-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 0;
  background: transparent;
}

.chart-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.guidance-section {
  padding: 12px 12px 10px;
  background: #f8fbff;
  border: 1px solid #e6effb;
  border-radius: 12px;
  min-height: 0;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.pulse-icon {
  width: 10px;
  height: 10px;
  background: #1890ff;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 0 0 rgba(24, 144, 255, 0.4);
  animation: pulse 2s infinite;
}

.section-title {
  margin: 0;
  font-size: 14px;
  color: #003a8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dynamic-narrative {
  font-size: 12.5px;
  line-height: 1.55;
  color: #262626;
  background: #fff;
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.dynamic-narrative p {
  margin: 0;
}

.guide-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.guide-metric {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px;
  border-radius: 8px;
  background: #f8fbff;
  border: 1px solid rgba(191, 219, 254, 0.58);
}

.metric-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #64748b;
}

.metric-value {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.guide-hook {
  color: #334155;
  margin-bottom: 9px;
}

.guide-legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  margin-bottom: 8px;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #475569;
  font-size: 10.5px;
  font-weight: 600;
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-swatch.bg {
  background: #dbe3ec;
}

.legend-swatch.share {
  background: #7dd3a9;
}

.legend-swatch.healthy {
  background: #5c8ff2;
}

.legend-swatch.risk {
  background: #ec8b2d;
}

.guide-summary {
  color: #1f2937;
  font-size: 12px;
}

.chart-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  background: transparent;
}

.range-chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(248, 250, 252, 0.62);
  backdrop-filter: blur(2px);
  z-index: 8;
  pointer-events: none;
}

.loading-heart {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: heartBeat 0.9s ease-in-out infinite;
}

.heart-shape {
  position: relative;
  width: 12px;
  height: 12px;
  background: #ef4444;
  transform: rotate(-45deg);
  border-radius: 2px;
}

.heart-shape::before,
.heart-shape::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
}

.heart-shape::before {
  top: -6px;
  left: 0;
}

.heart-shape::after {
  left: 6px;
  top: 0;
}

.loading-text {
  font-size: 11.5px;
  font-weight: 600;
  color: #334155;
}

.control-row {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(148, 163, 184, 0.28);
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.78), rgba(244, 248, 253, 0.78));
  padding: 0 10px;
}

.mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  flex-shrink: 0;
}

.mode-chip {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.mode-chip.active {
  color: #0f172a;
  background: linear-gradient(180deg, rgba(219, 234, 254, 0.92), rgba(191, 219, 254, 0.92));
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.35);
}

.row-meta {
  min-width: 0;
  display: flex;
  justify-content: flex-end;
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
  color: #1e40af;
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

@media (max-width: 900px) {
  .chart-stage {
    grid-template-columns: 1fr;
  }

  .guide-metrics {
    grid-template-columns: 1fr;
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
}

@keyframes heartBeat {
  0%, 100% { transform: scale(0.92); }
  20% { transform: scale(1.14); }
  40% { transform: scale(0.98); }
  60% { transform: scale(1.08); }
}
</style>
