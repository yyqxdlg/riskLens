<template>
  <div class="radar-root">
    <div ref="radarChart" class="radar-canvas" />
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  processObject: {
    type: Object,
    default: () => ({
      selectedCVD: [],
      selectedNoCVD: [],
      unselectedCVD: [],
      unselectedNoCVD: []
    })
  }
})

const radarChart = ref(null)
let chart = null

const MAX_INDIVIDUAL_LINES = 140

const metrics = [
  { key: 'age', name: 'Age', max: 85 },
  { key: 'bmi', name: 'BMI', max: 70 },
  { key: 'bp', name: 'Systolic BP', max: 220 },
  { key: 'lipids', name: 'Cholesterol', max: 450 },
  { key: 'diabetes', name: 'Diabetes', max: 1 }
]

const defaultProcess = {
  selectedCVD: [],
  selectedNoCVD: [],
  unselectedCVD: [],
  unselectedNoCVD: []
}

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

const buildRadarData = (processObject) => {
  const source = processObject || defaultProcess

  const selectedCVD = source.selectedCVD || []
  const selectedNoCVD = source.selectedNoCVD || []

  return {
    individualCVD: sampleRows(selectedCVD).map(toMetricArray),
    individualNoCVD: sampleRows(selectedNoCVD).map(toMetricArray),
    avgCVD: averageMetrics(selectedCVD),
    avgNoCVD: averageMetrics(selectedNoCVD),
    userData: [45, 28, 135, 210, 1]
  }
}

const buildOption = (data) => ({
  title: {
    text: 'Risk Factor Comparison',
    left: 'center',
    textStyle: {
      fontSize: 13,
      fontWeight: 700,
      color: '#374151'
    }
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    data: ['CVD Avg', 'Healthy Avg', 'My Data', 'CVD Individuals', 'Healthy Individuals'],
    bottom: 0,
    textStyle: {
      fontSize: 10
    }
  },
  radar: {
    indicator: metrics.map(m => ({ name: m.name, max: m.max })),
    shape: 'circle',
    splitNumber: 4,
    axisName: {
      color: '#374151',
      fontSize: 10,
      fontWeight: 600
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(148,163,184,0.45)'
      }
    },
    splitArea: {
      areaStyle: {
        color: ['rgba(248,250,252,0.8)', 'rgba(241,245,249,0.8)']
      }
    }
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
          areaStyle: { color: 'rgba(255, 77, 79, 0.2)' }
        },
        {
          value: data.avgNoCVD,
          name: 'Healthy Avg',
          lineStyle: { width: 2, type: 'dashed' },
          areaStyle: { color: 'rgba(24, 144, 255, 0.2)' }
        },
        {
          value: data.userData,
          name: 'My Data',
          lineStyle: { width: 3, color: '#722ed1' },
          itemStyle: { color: '#722ed1', borderWidth: 1 },
          areaStyle: { color: 'rgba(114, 46, 209, 0.28)' }
        }
      ]
    }
  ]
})

const render = () => {
  if (!chart) return
  const data = buildRadarData(props.processObject)
  chart.setOption(buildOption(data), true)
}

const onResize = () => {
  chart?.resize()
}

onMounted(() => {
  if (!radarChart.value) return

  chart = echarts.init(radarChart.value)
  render()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

watch(
  () => props.processObject,
  () => {
    render()
  },
  { deep: true }
)
</script>

<style scoped>
.radar-root {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.radar-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
