<template>
  <div class="radar-container">
    <div class="guidance-section">
      <div class="header-row">
        <span class="pulse-icon"></span>
        <h3 class="section-title">Profile Shape Comparison</h3>
      </div>
      <p class="section-subtitle">Compare subgroup average trajectories across core clinical dimensions.</p>
      <div class="dynamic-narrative">
        <p>{{ radarGuidanceText }}</p>
      </div>
    </div>

    <div ref="radarChartRef" class="radar-canvas" />

    <div class="chart-footer-hint">
      <small>* Dashed lines: Group Averages | Faint lines: Individual Peer Records</small>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

const props = defineProps({
  processObject: {
    type: Object,
    default: () => ({
      selectedCVD: [],
      selectedNoCVD: [],
      unselectedCVD: [],
      unselectedNoCVD: []
    })
  },
  userInputs: Object,
  activeFilters: {
    type: Object,
    default: () => ({
      ageGroup: [],
      bmiGroup: [],
      bpGroup: [],
      lipidGroup: [],
      diabetesLabel: []
    })
  }
})

const radarChartRef = ref(null)
let chart = null
let resizeHandler = null

const MAX_INDIVIDUAL_LINES = 140
const metrics = [
  { key: 'age', name: 'Age', max: 85 },
  { key: 'bmi', name: 'BMI', max: 70 },
  { key: 'bp', name: 'SBP', max: 220 },
  { key: 'lipids', name: 'Chol', max: 450 },
  { key: 'diabetes', name: 'Diabetes', max: 1 }
]

const asNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const sampleRows = (rows = [], max = MAX_INDIVIDUAL_LINES) => {
  if (rows.length <= max) return rows
  const step = rows.length / max
  const sampled = []
  for (let i = 0; i < max; i += 1) {
    sampled.push(rows[Math.floor(i * step)])
  }
  return sampled
}

const toMetricArray = (row) => metrics.map(m => asNumber(row?.rawValues?.[m.key], 0))

const averageMetrics = (rows = []) => {
  if (!rows.length) return metrics.map(() => 0)
  return metrics.map((m) => {
    const sum = rows.reduce((acc, row) => acc + asNumber(row?.rawValues?.[m.key], 0), 0)
    return Number((sum / rows.length).toFixed(2))
  })
}

const normalizeDiabetesInput = (value) => {
  if (Array.isArray(value)) {
    if (value.includes('Diabetic')) return 1
    if (value.includes('Non-Diabetic')) return 0
    return null
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined && value !== ''
}

const hasInputs = computed(() => (
  hasValue(props.userInputs?.age)
  || hasValue(props.userInputs?.bmi)
  || hasValue(props.userInputs?.sbp)
  || hasValue(props.userInputs?.chol)
  || hasValue(props.userInputs?.diabetes)
))

const activeProfile = computed(() => {
  if (hasInputs.value) {
    return {
      age: hasValue(props.userInputs?.age) ? asNumber(props.userInputs?.age, null) : null,
      bmi: hasValue(props.userInputs?.bmi) ? asNumber(props.userInputs?.bmi, null) : null,
      sbp: hasValue(props.userInputs?.sbp) ? asNumber(props.userInputs?.sbp, null) : null,
      chol: hasValue(props.userInputs?.chol) ? asNumber(props.userInputs?.chol, null) : null,
      diabetes: normalizeDiabetesInput(props.userInputs?.diabetes)
    }
  }
  return null
})

const activeProfileSeriesName = computed(() => 'My Data')
const radarGuidanceText = computed(() => (
  hasInputs.value
    ? 'Purple contour is your current profile. Dashed red/blue contours are subgroup averages for CVD and healthy peers.'
    : 'Enter your clinical values above to overlay your profile against subgroup average patterns.'
))

const buildRadarData = () => {
  const source = props.processObject
  const profile = activeProfile.value
  return {
    individualCVD: sampleRows(source?.selectedCVD || []).map(toMetricArray),
    individualNoCVD: sampleRows(source?.selectedNoCVD || []).map(toMetricArray),
    avgCVD: averageMetrics(source?.selectedCVD || []),
    avgNoCVD: averageMetrics(source?.selectedNoCVD || []),
    benchmarkHealthy: averageMetrics(source?.unselectedNoCVD || []),
    userData: profile
      ? [
          profile.age,
          profile.bmi,
          profile.sbp,
          profile.chol,
          profile.diabetes
        ]
      : []
  }
}

const initChart = () => {
  if (!radarChartRef.value) return
  if (chart) chart.dispose()

  chart = echarts.init(radarChartRef.value)
  const data = buildRadarData()

  const option = {
    tooltip: { trigger: 'item' },
    color: ['#ff4d4f', '#1890ff', '#722ed1'],
    legend: {
      data: ['CVD Avg', 'Healthy Avg', activeProfileSeriesName.value],
      textStyle: { fontSize: 10 },
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    radar: {
      indicator: metrics.map(m => ({ name: m.name, max: m.max })),
      shape: 'circle',
      splitNumber: 4,
      axisName: { color: '#374151', fontSize: 10, fontWeight: 600 },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.4)' } },
      splitArea: { areaStyle: { color: ['#fcfdfd', '#f8fafc'] } }
    },
    series: [
      {
        name: 'CVD Individuals',
        type: 'radar',
        silent: true,
        lineStyle: { width: 1, opacity: 0.05 },
        data: data.individualCVD,
        symbol: 'none',
        color: '#ff4d4f'
      },
      {
        name: 'Healthy Individuals',
        type: 'radar',
        silent: true,
        lineStyle: { width: 1, opacity: 0.05 },
        data: data.individualNoCVD,
        symbol: 'none',
        color: '#1890ff'
      },
      {
        name: 'Averages and User',
        type: 'radar',
        data: [
          {
            value: data.avgCVD,
            name: 'CVD Avg',
            lineStyle: { width: 2, type: 'dashed' },
            areaStyle: { color: 'rgba(255, 77, 79, 0.15)' }
          },
          {
            value: data.avgNoCVD,
            name: 'Healthy Avg',
            lineStyle: { width: 2, type: 'dashed' },
            areaStyle: { color: 'rgba(24, 144, 255, 0.15)' }
          },
          {
            value: data.userData,
            name: activeProfileSeriesName.value,
            lineStyle: { width: 3, color: '#722ed1' },
            itemStyle: { color: '#722ed1', borderWidth: 1 },
            areaStyle: { color: 'rgba(114, 46, 209, 0.3)' },
            symbol: data.userData.length ? 'circle' : 'none'
          }
        ]
      }
    ]
  }

  chart.setOption(option)
}

watch(
  () => [props.processObject, props.userInputs],
  () => initChart(),
  { deep: true }
)

onMounted(() => {
  resizeHandler = () => chart?.resize()
  window.addEventListener('resize', resizeHandler)
  initChart()
})

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  chart?.dispose()
})
</script>

<style scoped>
.radar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.guidance-section {
  padding: 14px 16px 10px;
  background: #f8fbff;
  border-bottom: 1px solid #e6effb;
  flex-shrink: 0;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
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
  font-weight: 700;
  letter-spacing: 0.5px;
}

.section-subtitle {
  margin: 0 0 8px;
  font-size: 11px;
  color: #64748b;
}

.dynamic-narrative {
  font-size: 12.5px;
  line-height: 1.65;
  color: #334155;
  background: #fff;
  padding: 10px 12px;
  border-radius: 10px;
  border-left: 4px solid #1890ff;
}

.dynamic-narrative p {
  margin: 0;
}

.radar-canvas {
  flex: 1;
  width: 100%;
  min-height: 240px;
}

.chart-footer-hint {
  text-align: center;
  padding: 8px 10px 12px;
  color: #94a3b8;
}

@media (max-width: 1200px) {
  .guidance-section {
    padding: 12px 12px 10px;
  }

  .radar-canvas {
    min-height: 220px;
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
}
</style>
