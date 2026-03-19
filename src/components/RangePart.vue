<template>
  <div class="range-wrapper">
    <div class="range-overview-header">
      <h2 class="overview-title">Subgroup Distribution</h2>
      <p class="overview-subtitle">
        Compare subgroup composition against the full cohort baseline.
      </p>
    </div>

    <div class="chart-stage">
      <aside class="guidance-section">
        <div class="dynamic-narrative">
          <div class="guide-metrics">
            <div class="guide-metric">
              <span class="metric-label">Subgroup Size</span>
              <span class="metric-value">{{ filteredPopulationCount.toLocaleString() }}</span>
            </div>
            <div class="guide-metric">
              <span class="metric-label">Filtered Share</span>
              <span class="metric-value">{{ filteredPopulationShareText }}</span>
            </div>
          </div>
          <p class="guide-hook">
            <strong>Gray</strong> is the all-population baseline. <strong>Blue and orange</strong> show the current
            subgroup after filters are applied.
          </p>
          <div class="guide-legend-row">
            <span class="legend-chip"><span class="legend-swatch bg"></span>Baseline All</span>
            <span class="legend-chip"><span class="legend-swatch healthy"></span>Filtered No CVD</span>
            <span class="legend-chip"><span class="legend-swatch risk"></span>Filtered CVD</span>
          </div>
          <p class="guide-summary">
            Distribution view adapts its percentage axis to active subgroup filters for better readability.
          </p>
        </div>
      </aside>

      <div class="chart-panel">
        <div class="zoom-rail" aria-label="Zoom controls">
          <button
            v-for="(dim, index) in chartDimensions"
            :key="`zoom-${dim.key}`"
            type="button"
            class="zoom-chip"
            :class="{ active: focusedDimKey === dim.key }"
            :style="getZoomChipStyle(index)"
            :aria-label="focusedDimKey === dim.key ? `Collapse ${dim.label} focus view` : `Expand ${dim.label} focus view`"
            :title="focusedDimKey === dim.key ? `Collapse ${dim.label} focus view` : `Expand ${dim.label} focus view`"
            @click="toggleFocusedDim(dim.key)"
          >
            {{ focusedDimKey === dim.key ? '-' : '+' }}
          </button>
        </div>
        <div ref="chartRef" class="range-chart" />
        <div v-if="isBusy" class="chart-loading">
          <span class="loading-heart" aria-hidden="true">
            <span class="heart-shape"></span>
          </span>
          <span class="loading-text">Updating filtered distributions...</span>
        </div>
      </div>
    </div>

    <div class="control-row">
      <div class="row-meta">
        <span class="selection-state" :class="{ active: hasAnyLeftSelection }" :title="selectionSummaryText">
          {{ selectionSummaryText }}
        </span>
        <span class="row-link" :class="{ disabled: !hasAnyLeftSelection }" @click="clearLeftSelection">Clear Subgroup Filters</span>
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
      key: '',
      value: ''
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
  'Non-Diabetic': 'No Diabetes',
  Diabetic: 'Diabetes'
}

const INPUT_LIMITS = {
  age: [0, 130],      // 有记录的最长寿 122 岁
  bmi: [10, 100],     // BMI 10 以下基本不存活，100 以上极罕见
  sbp: [50, 300],     // 50 以下休克，300 以上极危重
  chol: [50, 700]     // 50 以下极罕见遗传病，700 以上也属极端
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
const focusedDimKey = ref('')

const createFilterMap = () => ({
  ageGroup: [],
  bmiGroup: [],
  bpGroup: [],
  lipidGroup: [],
  diabetesLabel: []
})

const createBarSelectionMap = () => ({
  ...Object.fromEntries(chartDimensions.map(dim => [dim.key, []]))
})

const baseCategoriesByDim = ref(createFilterMap())
const rowDataByDim = ref({})
const selectedByDim = ref(createFilterMap())
const selectedBarIdsByDim = ref(createBarSelectionMap())
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
    'Young Adult': '<39',
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
const buildDisplayLabel = (dimKey, category) => {
  const base = shortLabel(category)
  const rangeText = categoryRangeLabelMap?.[dimKey]?.[category]
  return rangeText ? `${base}\n${rangeText}` : base
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
    if (userInteractedDims.value.has(dim.key)) {
      result[dim.key] = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])
    }
    // 未交互的 dim 默认返回 []，由 formFilters 接管
  })
  return result
}

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
    const selected = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])

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
  return hasDimSelection || hasBarSelection
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
    return `Subgroup filters: ${tokens.join(' | ')}`
  }

  const hasBarSelection = chartDimensions.some(dim => (selectedBarIdsByDim.value[dim.key] || []).length > 0)
  if (hasBarSelection) {
    return 'Current row selection spans all bins (acts as no filter)'
  }

  return 'Click bars to apply subgroup filters'
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
  // 从用户接管集合中移除，让该 dim 重新受 context 控制
  userInteractedDims.value = new Set([...userInteractedDims.value].filter(d => d !== dimKey)) // ← 新增
  setMapValue(selectedByDim, dimKey, [])
  setMapValue(selectedBarIdsByDim, dimKey, [])
  rebuildAndRender()
  emitAllFilters()
  emitExactSelection()
}

const removeSelectionValueForDim = (dimKey, value) => {
  if (!dimKey) return
  const targetValue = typeof value === 'string' ? value : ''
  if (!targetValue) {
    removeSelectionForDim(dimKey)
    return
  }

  const currentValues = normalizeSelection(dimKey, selectedByDim.value[dimKey] || [])
  const nextValues = currentValues.filter(item => item !== targetValue)

  const bars = rowDataByDim.value[dimKey]?.bars || []
  const targetBarIds = new Set(
    bars
      .filter(bar => !bar.isGap && bar.category === targetValue)
      .map(bar => bar.id)
  )
  const currentBarIds = selectedBarIdsByDim.value[dimKey] || []
  const nextBarIds = currentBarIds.filter(id => !targetBarIds.has(id))

  const valuesChanged = nextValues.length !== currentValues.length
  const barsChanged = nextBarIds.length !== currentBarIds.length
  if (!valuesChanged && !barsChanged) return

  setMapValue(selectedByDim, dimKey, nextValues)
  setMapValue(selectedBarIdsByDim, dimKey, nextBarIds)
  rebuildAndRender()
  emitAllFilters()
  emitExactSelection()
}

// 4. applyDefaultSelectionsFromContext：跳过用户已交互的 dim
const applyDefaultSelectionsFromContext = (nextContext = {}) => {
  let changed = false
  const nextSelected = { ...selectedByDim.value }
  const nextBarIds = { ...selectedBarIdsByDim.value }

  chartDimensions.forEach((dim) => {
    if (userInteractedDims.value.has(dim.key)) return // ← 新增：用户已接管，不覆盖

    const allCats = baseCategoriesByDim.value[dim.key] || []
    const incomingValues = dedupe(nextContext?.[dim.key] || []).filter(v => allCats.includes(v))
    const currentSelected = normalizeSelection(dim.key, nextSelected[dim.key] || [])
    const currentBarIds = nextBarIds[dim.key] || []

    if (!sameArray(currentSelected, incomingValues)) {
      nextSelected[dim.key] = incomingValues
      changed = true
    }
    if (currentBarIds.length) {
      nextBarIds[dim.key] = []
      changed = true
    }
  })

  if (!changed) return
  selectedByDim.value = nextSelected
  selectedBarIdsByDim.value = nextBarIds
}

const matchesRowWithCombinedFilters = (row, skipDimKey) => {
  return allDimensions.every(dim => {
    if (dim.key === skipDimKey) return true

    const value = row.displayGroups?.[dim.key]
    if (!value) return false

    const selected = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])

    if (selected.length) return selected.includes(value)
    return true
  })
}

const clearConflictingSelectionsWithContext = () => {
  // Keep chart-side selections intact even when a form input exists on the same dimension.
  // Keep chart-side selections intact even when a form input exists on the same dimension.
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

const buildRowDataForDim = (dim) => {
  const categories = baseCategoriesByDim.value[dim.key] || []

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
    const categoryRows = rowsByCategory.get(category) || []
    const allRows = allRowsByCategory.get(category) || []

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
      allTotal,
      total,
      cvd,
      noCvd: total - cvd,
      minRaw,
      maxRaw
    })

    labelByIndex[bars.length - 1] = buildDisplayLabel(dim.key, category)
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
  const focusAxisMax = Math.max(
    focusMaxSelectedShare < 1 ? 0.28 : focusMaxSelectedShare < 5 ? 1.1 : 2,
    roundUp(
      focusMaxSelectedShare * 1.08,
      focusMaxSelectedShare < 1 ? 0.1 : focusMaxSelectedShare < 5 ? 0.25 : 0.5
    )
  )
  const focusImpactAxisMax = Math.max(1.15, roundUp(maxLift * 1.04, 0.25))

  return {
    categories,
    bars: barsWithSignals,
    labelByIndex,
    axisMax: baseAxisMax,
    zoomAxisMax: Math.min(baseAxisMax, zoomAxisMax),
    focusAxisMax,
    impactAxisMax: Math.max(1.5, roundUp(maxLift * 1.16, 0.5)),
    focusImpactAxisMax,
    rowTotal
  }
}

const sanitizeState = () => {
  allDimensions.forEach(dim => {
    const normalized = normalizeSelection(dim.key, selectedByDim.value[dim.key] || [])
    setMapValue(selectedByDim, dim.key, normalized)
  })

  chartDimensions.forEach(dim => {
    const validBarIds = new Set((rowDataByDim.value[dim.key]?.bars || []).map(b => b.id))
    const keptBarIds = (selectedBarIdsByDim.value[dim.key] || []).filter(id => validBarIds.has(id))
    setMapValue(selectedBarIdsByDim, dim.key, keptBarIds)
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
  selectedBarIdsByDim.value = createBarSelectionMap()
  if (chart) {
    chart.setOption({
      series: chartDimensions.flatMap((dim) => ([
        { id: makeSeriesId(dim.key, 'total'), markArea: { silent: true, data: [] } },
        { id: makeSeriesId(dim.key, 'impact'), markArea: { silent: true, data: [] } }
      ]))
    }, false, true)
  }
  userInteractedDims.value = new Set()
}

const makeSeriesId = (dimKey, metric) => `${dimKey}__${metric}`

const parseSeriesId = (seriesId = '') => {
  const [dimKey, metric] = seriesId.split('__')
  return { dimKey, metric }
}

const buildMarkerOverlaySeries = (dimKey, rowIndex, markerIndex, bars, axisMax) => {
  const axisCategory = normalizeMarkerAxisCategory(markerIndex, bars)
  const rowMax = axisMax || (rowDataByDim.value[dimKey]?.zoomAxisMax || rowDataByDim.value[dimKey]?.axisMax || 1)
  const markerData = (bars || []).map((bar, index) => {
    if (bar?.isGap) return 0
    return axisCategory !== null && index === axisCategory ? rowMax : 0
  })
  return {
    id: makeSeriesId(dimKey, 'marker'),
    name: '',
    type: 'bar',
    xAxisIndex: rowIndex,
    yAxisIndex: rowIndex,
    data: markerData,
    barWidth: 2.5,
    barMaxWidth: 3,
    barGap: '-100%',
    itemStyle: {
      color: 'rgba(124,58,237,0)',
      opacity: 0,
      borderRadius: [0, 0, 0, 0]
    },
    tooltip: { show: false },
    silent: true,
    z: 130,
    zlevel: 5
  }
}

const buildTotalData = (dimKey, options = {}) => {
  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const hasBarSelected = selectedBarIds.size > 0
  const zoomed = !!options.zoomed
  const zoomStrength = Number(options.zoomStrength) || 1
  const deemphasized = !!options.deemphasized
  const focused = !!options.focused
  const baseOpacity = zoomed
    ? Math.min(0.8, 0.56 + (zoomStrength - 1) * 0.12)
    : 0.54
  return bars.map(bar => {
    if (bar.isGap) return { value: 0, itemStyle: { color: 'rgba(0,0,0,0)' } }
    const idleOpacity = deemphasized
      ? 0.12
      : (focused ? Math.min(0.94, baseOpacity + 0.16) : baseOpacity)
    const selectedOpacity = deemphasized ? 0.28 : 0.82
    const unselectedOpacity = deemphasized ? 0.06 : 0.12
    return {
      value: bar.allShareAll || 0,
      itemStyle: {
        color: totalGradient,
        borderRadius: [0, 0, 0, 0],
        opacity: hasBarSelected ? (selectedBarIds.has(bar.id) ? selectedOpacity : unselectedOpacity) : idleOpacity,
        borderWidth: 0,
        shadowBlur: !deemphasized && hasBarSelected && selectedBarIds.has(bar.id) ? 10 : 0,
        shadowColor: 'rgba(37,99,235,0.18)'
      }
    }
  })
}

const buildRiskData = (dimKey, metric, options = {}) => {
  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selected = new Set(normalizeSelection(dimKey, selectedByDim.value[dimKey] || []))
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const hasSelected = selected.size > 0
  const hasBarSelected = selectedBarIds.size > 0
  const color = metric === 'noCvd' ? noCvdGradient : cvdGradient
  const deemphasized = !!options.deemphasized
  const focused = !!options.focused

  return bars.map(bar => {
    if (bar.isGap) return { value: 0, itemStyle: { color: 'rgba(0,0,0,0)' } }

    const enabled = hasBarSelected
      ? selectedBarIds.has(bar.id)
      : (!hasSelected || selected.has(bar.category))
    const subgroupShare = Number(bar.groupShareAll) || 0
    const shouldLabelNoCvd = metric === 'noCvd' && subgroupShare > 0 && Number(bar.selectedCvdShareAll || 0) <= 0
    const shouldLabelCvd = metric === 'cvd' && subgroupShare > 0
    const emphasisOpacity = deemphasized ? 0.34 : (focused ? 1 : activeOpacity)
    const mutedSeriesOpacity = deemphasized ? 0.08 : mutedOpacity
    return {
      value: metric === 'noCvd' ? bar.selectedNoCvdShareAll : bar.selectedCvdShareAll,
      label: {
        show: !deemphasized && (shouldLabelNoCvd || shouldLabelCvd),
        position: 'top',
        distance: 4,
        color: enabled ? '#1e3a8a' : '#64748b',
        fontSize: focused ? 10.5 : 9.5,
        fontWeight: 700,
        formatter: smartPercentLabel(subgroupShare)
      },
      itemStyle: {
        color,
        opacity: enabled ? emphasisOpacity : mutedSeriesOpacity,
        borderWidth: 0,
        shadowBlur: !deemphasized && enabled && hasBarSelected ? 10 : 0,
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

const buildImpactData = (dimKey, options = {}) => {
  const bars = rowDataByDim.value[dimKey]?.bars || []
  const selected = new Set(normalizeSelection(dimKey, selectedByDim.value[dimKey] || []))
  const selectedBarIds = new Set(selectedBarIdsByDim.value[dimKey] || [])
  const hasSelected = selected.size > 0
  const hasBarSelected = selectedBarIds.size > 0
  const deemphasized = !!options.deemphasized
  const focused = !!options.focused

  return bars.map((bar) => {
    if (bar.isGap) return { value: 0, itemStyle: { color: 'rgba(0,0,0,0)' } }

    const enabled = hasBarSelected
      ? selectedBarIds.has(bar.id)
      : (!hasSelected || selected.has(bar.category))
    const liftValue = Number(bar.riskLift) || 0
    const emphasisOpacity = deemphasized ? 0.32 : (focused ? 1 : activeOpacity)
    const mutedSeriesOpacity = deemphasized ? 0.08 : mutedOpacity

    return {
      value: liftValue,
      itemStyle: {
        color: liftValue > 1 ? impactHigherGradient : impactLowerGradient,
        opacity: enabled ? emphasisOpacity : mutedSeriesOpacity,
        borderWidth: 0,
        shadowBlur: !deemphasized && enabled && hasBarSelected ? 10 : 0,
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
  if (rawSource === null || rawSource === undefined || rawSource === '') {
    const fallbackCategory = (props.contextFilters?.[dimKey] || [])[0]
    if (!fallbackCategory) return null
    const window = CATEGORY_WINDOWS?.[dimKey]?.[fallbackCategory]
    if (Array.isArray(window) && window.length === 2) {
      const [min, max] = window
      if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
        return (min + max) / 2
      }
    }
    if (dimKey === 'diabetesLabel') {
      return fallbackCategory === 'Diabetic' ? 1 : 0
    }
    return null
  }

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

const normalizeMarkerAxisCategory = (markerIndex, bars = []) => {
  if (!Number.isFinite(markerIndex)) return null
  const validIndices = bars
    .map((bar, index) => ({ bar, index }))
    .filter(({ bar }) => !bar.isGap)
    .map(({ index }) => index)
  if (!validIndices.length) return null

  const minIdx = validIndices[0]
  const maxIdx = validIndices[validIndices.length - 1]
  const rounded = Math.round(markerIndex)
  const clamped = Math.max(minIdx, Math.min(maxIdx, rounded))
  return clamped
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
  const rowHeight = CHART_ROW_HEIGHT
  const rowGap = CHART_ROW_GAP
  const topOffset = CHART_TOP_OFFSET
  const chartWidth = chartRef.value?.clientWidth || 760
  const compactChart = chartWidth < 820
  const controlRailWidth = compactChart ? 56 : 64
  const focusedDim = focusedDimKey.value
  const rowLayouts = getRowLayouts()
  const rowLayoutMap = new Map(rowLayouts.map(layout => [layout.key, layout]))

  const grids = []
  const xAxis = []
  const yAxis = []
  const series = []

  chartDimensions.forEach((dim, rowIndex) => {
    const row = rowDataByDim.value[dim.key] || { bars: [], labelByIndex: {}, axisMax: 10, zoomAxisMax: 10, impactAxisMax: 2 }
    const rowLayout = rowLayoutMap.get(dim.key) || {
      top: topOffset + rowIndex * (rowHeight + rowGap),
      height: rowHeight,
      focused: false,
      compressed: false
    }
    const markerIndex = resolveUserMarkerIndex(dim.key, row)
    const selectedSet = new Set(normalizeSelection(dim.key, selectedByDim.value[dim.key] || []))
    const rowHasLocalSelection = (selectedByDim.value[dim.key] || []).length > 0 || (selectedBarIdsByDim.value[dim.key] || []).length > 0
    const isFocusedRow = rowLayout.focused
    const isCompressedRow = rowLayout.compressed
    const isDeemphasizedRow = !!focusedDim && !isFocusedRow
    const shouldZoomCompositionAxis = viewMode.value === 'composition' && (
      isFocusedRow || (!focusedDim && (hasSubgroupFilter.value || rowHasLocalSelection))
    )
    const compositionAxisMax = isFocusedRow
      ? (row.focusAxisMax || row.zoomAxisMax || row.axisMax)
      : (shouldZoomCompositionAxis ? row.zoomAxisMax : row.axisMax)
    const impactAxisMax = isFocusedRow
      ? (row.focusImpactAxisMax || row.impactAxisMax)
      : row.impactAxisMax
    const currentAxisMax = viewMode.value === 'impact' ? impactAxisMax : compositionAxisMax
    const zoomStrength = shouldZoomCompositionAxis && row.zoomAxisMax > 0
      ? Math.max(1, row.axisMax / row.zoomAxisMax)
      : 1
    const barCount = row.bars.length
    const lowDensity = barCount <= 6
    const barSize = barCount > 90
      ? 4
      : barCount > 70
        ? 5
        : barCount > 52
          ? 7
          : barCount > 36
            ? 9
            : barCount > 24
              ? 11
              : barCount > 16
                ? 14
                : barCount > 10
                  ? 18
                  : compactChart
                    ? 24
                    : 28
    const barCategoryGap = barCount > 32
      ? '34%'
      : barCount > 20
        ? '28%'
        : barCount > 12
          ? '16%'
          : compactChart
            ? '14%'
            : '10%'
    const backgroundBarMaxWidth = lowDensity
      ? (compactChart ? 44 : 54)
      : 42
    const foregroundBarMaxWidth = lowDensity
      ? (compactChart ? 34 : 42)
      : 32
    const backgroundBarWidth = shouldZoomCompositionAxis
      ? Math.min(backgroundBarMaxWidth, Math.round(barSize * Math.min(1.38, 1 + (zoomStrength - 1) * 0.16)))
      : Math.min(backgroundBarMaxWidth, Math.round(barSize * (lowDensity ? 1.45 : 1.16)))
    const foregroundBarWidth = shouldZoomCompositionAxis
      ? Math.min(foregroundBarMaxWidth, Math.max(8, Math.round(backgroundBarWidth * (lowDensity ? 0.82 : 0.74))))
      : Math.min(foregroundBarMaxWidth, Math.max(8, Math.round(backgroundBarWidth * (lowDensity ? 0.8 : 0.72))))

    grids.push({
      left: 92,
      right: controlRailWidth,
      top: rowLayout.top,
      height: rowLayout.height
    })

    xAxis.push({
      type: 'category',
      gridIndex: rowIndex,
      data: row.bars.map((_, i) => String(i)),
      axisTick: { show: false },
      axisLine: {
        show: !isCompressedRow,
        lineStyle: { color: isFocusedRow ? 'rgba(37,99,235,0.42)' : 'rgba(71,85,105,0.28)' }
      },
      axisLabel: {
        show: !isCompressedRow,
        interval: 0,
        margin: dim.key === 'ageGroup' ? 12 : 9,
        fontSize: isFocusedRow ? 10 : 9,
        fontWeight: 700,
        hideOverlap: true,
        color: isFocusedRow ? '#1d4ed8' : '#475569',
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
            padding: [1, 5, 1, 5],
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 15
          },
          tagActive: {
            color: '#0f172a',
            backgroundColor: 'rgba(59,130,246,0.22)',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(37,99,235,0.55)',
            padding: [1, 5, 1, 5],
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 15
          },
          range: {
            color: '#94a3b8',
            fontSize: 8,
            fontWeight: 600,
            lineHeight: 11,
            padding: [1, 0, 0, 0]
          },
          rangeActive: {
            color: '#2563eb',
            fontSize: 8,
            fontWeight: 700,
            lineHeight: 11,
            padding: [1, 0, 0, 0]
          }
        }
      }
    })

    yAxis.push({
      type: 'value',
      gridIndex: rowIndex,
      min: 0,
      max: currentAxisMax,
      splitNumber: 2,
      name: dim.label,
      nameLocation: 'middle',
      nameGap: 48,
      nameRotate: 0,
      nameTextStyle: {
        fontSize: isFocusedRow ? 12 : 11,
        fontWeight: 700,
        color: isFocusedRow ? '#1d4ed8' : (isCompressedRow ? '#94a3b8' : '#334155')
      },
      axisLabel: {
        show: !isCompressedRow,
        color: '#667085',
        fontSize: isFocusedRow ? 10 : 9,
        formatter: (v) => {
          return viewMode.value === 'impact' ? `${Number(v).toFixed(1)}x` : smartPercentLabel(v)
        }
      },
      splitLine: {
        show: !focusedDim || isFocusedRow,
        lineStyle: {
          color: isFocusedRow ? 'rgba(37,99,235,0.16)' : 'rgba(15,23,42,0.09)',
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
        barMaxWidth: foregroundBarMaxWidth,
        barCategoryGap,
        data: buildImpactData(dim.key, { deemphasized: isDeemphasizedRow, focused: isFocusedRow }),
        markArea: buildSelectionMarkArea(dim.key, impactAxisMax),
        z: 3
      })
      series.push(buildMarkerOverlaySeries(dim.key, rowIndex, markerIndex, row.bars, impactAxisMax))
    } else {
      series.push({
        id: makeSeriesId(dim.key, 'total'),
        name: 'All Population',
        type: 'bar',
        xAxisIndex: rowIndex,
        yAxisIndex: rowIndex,
        barWidth: backgroundBarWidth,
        barMaxWidth: backgroundBarMaxWidth,
        barCategoryGap,
        barGap: '-100%',
        data: buildTotalData(dim.key, {
          zoomed: shouldZoomCompositionAxis,
          zoomStrength,
          deemphasized: isDeemphasizedRow,
          focused: isFocusedRow
        }),
        markArea: buildSelectionMarkArea(dim.key, compositionAxisMax),
        markLine: { symbol: ['none', 'none'], silent: true, data: [] },
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
        barMaxWidth: foregroundBarMaxWidth,
        barCategoryGap,
        data: buildRiskData(dim.key, 'noCvd', { deemphasized: isDeemphasizedRow, focused: isFocusedRow }),
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
        barMaxWidth: foregroundBarMaxWidth,
        barCategoryGap,
        data: buildRiskData(dim.key, 'cvd', { deemphasized: isDeemphasizedRow, focused: isFocusedRow }),
        z: 4
      })
      series.push(buildMarkerOverlaySeries(dim.key, rowIndex, markerIndex, row.bars, compositionAxisMax))

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
      trigger: 'item',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(148,163,184,0.28)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      padding: [8, 10],
      formatter: (param) => {
        if (!param?.seriesId) return ''
        const { dimKey } = parseSeriesId(param.seriesId)
        const row = rowDataByDim.value[dimKey]
        const dim = chartDimensions.find(d => d.key === dimKey)
        const bar = row?.bars?.[param.dataIndex]

        if (!row || !dim || !bar || bar.isGap) return ''

        const ratio = bar.total > 0 ? ((bar.cvd / bar.total) * 100).toFixed(1) : '0.0'
        const groupShare = bar.groupShare !== undefined ? bar.groupShare.toFixed(1) : '0.0'
        const groupShareAll = bar.groupShareAll !== undefined ? bar.groupShareAll.toFixed(1) : '0.0'
        const cvdContributionAll = bar.cvdContributionAll !== undefined ? bar.cvdContributionAll.toFixed(1) : '0.0'
        const groupCvdRate = bar.groupCvdRate !== undefined ? bar.groupCvdRate.toFixed(1) : '0.0'
        const populationRate = (overallCvdRate.value * 100).toFixed(1)
        const riskLift = bar.riskLift !== undefined ? bar.riskLift.toFixed(2) : '0.00'
        const riskDiff = bar.riskDiff !== undefined ? `${bar.riskDiff >= 0 ? '+' : ''}${bar.riskDiff.toFixed(1)}` : '+0.0'
        const rangeText = `${dim.label} group: ${bar.category}`

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
      brushType: false
    },
    grid: grids,
    xAxis,
    yAxis,
    series
  }
}

const renderChart = () => {
  if (!chart) return
  startBusy()
  chart.setOption(buildOption(), {
    notMerge: false,
    lazyUpdate: true,
    replaceMerge: ['grid', 'xAxis', 'yAxis', 'series', 'legend']
  })
  requestAnimationFrame(() => {
    finishBusy()
  })
}

const renderUserMarkersOnly = () => {
  if (!chart) return
  startBusy()
  const series = chartDimensions.map((dim) => {
    const row = rowDataByDim.value[dim.key] || { bars: [] }
    const markerIndex = resolveUserMarkerIndex(dim.key, row)
    const rowHasLocalSelection = (selectedByDim.value[dim.key] || []).length > 0 || (selectedBarIdsByDim.value[dim.key] || []).length > 0
    const shouldZoomCompositionAxis = viewMode.value === 'composition' && (
      focusedDimKey.value === dim.key || (!focusedDimKey.value && (hasSubgroupFilter.value || rowHasLocalSelection))
    )
    return {
      id: makeSeriesId(dim.key, 'marker'),
      data: (() => {
        const axisCategory = normalizeMarkerAxisCategory(markerIndex, row.bars || [])
        const axisMax = viewMode.value === 'impact'
          ? (focusedDimKey.value === dim.key
            ? (rowDataByDim.value[dim.key]?.focusImpactAxisMax || rowDataByDim.value[dim.key]?.impactAxisMax || 1)
            : (rowDataByDim.value[dim.key]?.impactAxisMax || 1))
          : (focusedDimKey.value === dim.key
            ? (rowDataByDim.value[dim.key]?.focusAxisMax || rowDataByDim.value[dim.key]?.zoomAxisMax || rowDataByDim.value[dim.key]?.axisMax || 1)
            : (shouldZoomCompositionAxis
              ? (rowDataByDim.value[dim.key]?.zoomAxisMax || rowDataByDim.value[dim.key]?.axisMax || 1)
              : (rowDataByDim.value[dim.key]?.axisMax || 1)))
        const rowMax = viewMode.value === 'impact'
          ? axisMax
          : axisMax
        return (row.bars || []).map((bar, index) => {
          if (bar?.isGap) return 0
          return axisCategory !== null && index === axisCategory ? rowMax : 0
        })
      })()
    }
  })
  chart.setOption({ series }, false, true)
  requestAnimationFrame(() => {
    finishBusy()
  })
}

// ✅ 正确写法
const toggleCategorySelection = (dimKey, category) => {
  // 直接读当前值，context 预设的 Young Adult 还在里面
  const current = [...normalizeSelection(dimKey, selectedByDim.value[dimKey] || [])]
  
  userInteractedDims.value = new Set([...userInteractedDims.value, dimKey])

  const idx = current.indexOf(category)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(category)
  }
  const normalized = normalizeSelection(dimKey, current)
  setMapValue(selectedByDim, dimKey, normalized)
  setMapValue(selectedBarIdsByDim, dimKey, [])
  rebuildAndRender()
  emitAllFilters()
  emitExactSelection()
}

const clearLeftSelection = () => {
  if (!hasAnyLeftSelection.value) return
  clearAllSelections()
  rebuildAndRender()
  emitAllFilters()
  emitExactSelection()
}

const toggleFocusedDim = (dimKey) => {
  focusedDimKey.value = focusedDimKey.value === dimKey ? '' : dimKey
  applyChartHeight()
  chart?.resize()
  renderChart()
}

const CHART_ROW_HEIGHT = 38
const CHART_ROW_GAP = 40
const CHART_TOP_OFFSET = 42
const CHART_BOTTOM_PADDING = 54
const DEFAULT_CHART_HEIGHT = CHART_TOP_OFFSET
  + chartDimensions.length * CHART_ROW_HEIGHT
  + (chartDimensions.length - 1) * CHART_ROW_GAP
  + CHART_BOTTOM_PADDING

const getChartViewportHeight = () => {
  const parentHeight = chartRef.value?.parentElement?.clientHeight || 0
  const ownHeight = chartRef.value?.clientHeight || 0
  return Math.max(parentHeight, ownHeight, DEFAULT_CHART_HEIGHT)
}

const getRowLayouts = () => {
  const focusedDim = focusedDimKey.value
  const rowCount = chartDimensions.length
  const contentHeight = Math.max(
    rowCount * CHART_ROW_HEIGHT + (rowCount - 1) * CHART_ROW_GAP,
    getChartViewportHeight() - CHART_TOP_OFFSET - CHART_BOTTOM_PADDING
  )
  let top = CHART_TOP_OFFSET

  if (!focusedDim) {
    const baseRowHeight = CHART_ROW_HEIGHT
    const gap = rowCount > 1
      ? (contentHeight - rowCount * baseRowHeight) / (rowCount - 1)
      : 0

    return chartDimensions.map((dim, index) => {
      const height = baseRowHeight
      const center = top + (height / 2)
      const layout = { key: dim.key, top, height, center, focused: false, compressed: false }
      top += height + (index === chartDimensions.length - 1 ? 0 : gap)
      return layout
    })
  }

  const compressedCount = Math.max(0, rowCount - 1)
  let gap = rowCount > 1 ? Math.max(10, Math.round(contentHeight * 0.028)) : 0
  let focusHeight = Math.round(contentHeight * 0.58)
  let compressedHeight = compressedCount > 0
    ? Math.floor((contentHeight - focusHeight - gap * (rowCount - 1)) / compressedCount)
    : contentHeight

  if (compressedHeight < 24 && compressedCount > 0) {
    gap = Math.max(8, Math.floor((contentHeight - focusHeight - 24 * compressedCount) / (rowCount - 1)))
    compressedHeight = Math.floor((contentHeight - focusHeight - gap * (rowCount - 1)) / compressedCount)
  }

  if (compressedHeight < 20 && compressedCount > 0) {
    compressedHeight = 20
    focusHeight = contentHeight - compressedHeight * compressedCount - gap * (rowCount - 1)
  }

  focusHeight = Math.max(112, focusHeight)

  return chartDimensions.map((dim, index) => {
    const focused = !!focusedDim && focusedDim === dim.key
    const compressed = !!focusedDim && focusedDim !== dim.key
    const height = focused
      ? focusHeight
      : compressed
        ? compressedHeight
        : CHART_ROW_HEIGHT
    const center = top + (height / 2)
    const layout = { key: dim.key, top, height, center, focused, compressed }
    top += height + (index === chartDimensions.length - 1 ? 0 : gap)
    return layout
  })
}

const getZoomChipStyle = (index) => {
  const layout = getRowLayouts()[index]
  return {
    top: `${layout?.center || CHART_TOP_OFFSET}px`
  }
}

const applyChartHeight = () => {
  if (!chartRef.value) return
  chartRef.value.style.height = `${getChartViewportHeight()}px`
}

const initChart = async () => {
  await nextTick()
  if (!chartRef.value) return

  if (chart) {
    chart.dispose()
    chart = null
  }

  applyChartHeight()
  chart = echarts.init(chartRef.value)

  chart.on('click', params => {
    const { dimKey, metric } = parseSeriesId(params.seriesId)
    if (!dimKey || !['total', 'noCvd', 'cvd', 'impact'].includes(metric)) return

    const rowBars = rowDataByDim.value[dimKey]?.bars || []
    const bar = rowBars[params.dataIndex]
    if (!bar || bar.isGap || !bar.category) return

    toggleCategorySelection(dimKey, bar.category)
  })

  renderChart()
}

const handleResize = () => {
  applyChartHeight()
  chart?.resize()
  renderChart()
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

// RangePart.vue
watch(
  () => props.contextFilters,
  (next) => {
    // form 有值的 dim → form 重新接管，清除用户交互标记
    // form 为空的 dim → 说明是 chart 接管后 form 被清空的，保留用户交互标记
    const newInteracted = new Set(userInteractedDims.value)
    chartDimensions.forEach(dim => {
      const incoming = next?.[dim.key] || []
      if (incoming.length > 0) {
        newInteracted.delete(dim.key)  // form 有值，form 接管
      }
      // incoming 为空 → chart 正在控制这个 dim，不动
    })
    userInteractedDims.value = newInteracted

    applyDefaultSelectionsFromContext(next)
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
    const value = props.clearRequest?.value
    if (!dimKey) return
    removeSelectionValueForDim(dimKey, value)
  }
)

//new 
const userInteractedDims = ref(new Set())
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

.range-overview-header {
  padding: 4px 4px 10px;
  border-bottom: 1px solid rgba(203, 213, 225, 0.4);
  margin-bottom: 10px;
}

.overview-title {
  margin: 0;
  font-size: 23px;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: #0f3b87;
}

.overview-subtitle {
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: #64748b;
}

.chart-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: clamp(216px, 22vw, 248px) minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.guidance-section {
  padding: 10px 10px 9px;
  background: #f8fbff;
  border: 1px solid #e6effb;
  border-radius: 12px;
  min-height: 0;
}

.dynamic-narrative {
  font-size: 12.5px;
  line-height: 1.55;
  color: #262626;
  background: #fff;
  padding: 10px 11px;
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

.legend-swatch.marker {
  width: 0;
  height: 12px;
  border-radius: 0;
  border-left: 2px solid #7c3aed;
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

.zoom-rail {
  position: absolute;
  inset: 0 0 0 auto;
  width: 48px;
  z-index: 6;
  pointer-events: none;
}

.zoom-chip {
  position: absolute;
  right: 8px;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: 1px solid rgba(96, 165, 250, 0.34);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: #475569;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.zoom-chip:hover {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.16);
}

.zoom-chip.active {
  background: #1d4ed8;
  color: #fff;
  border-color: rgba(29, 78, 216, 0.72);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.24);
}

.range-chart {
  width: 100%;
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
  justify-content: flex-end;
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
  .range-overview-header {
    padding: 2px 2px 8px;
    margin-bottom: 8px;
  }

  .overview-title {
    font-size: 20px;
  }

  .overview-subtitle {
    font-size: 12px;
  }

  .chart-stage {
    grid-template-columns: 1fr;
  }

  .guide-metrics {
    grid-template-columns: 1fr;
  }

  .zoom-rail {
    width: 42px;
  }

  .zoom-chip {
    right: 6px;
    width: 24px;
    height: 24px;
    font-size: 15px;
  }
}

@keyframes heartBeat {
  0%, 100% { transform: scale(0.92); }
  20% { transform: scale(1.14); }
  40% { transform: scale(0.98); }
  60% { transform: scale(1.08); }
}
</style>
