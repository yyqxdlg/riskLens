<template>
  <div class="radar-container">
    <div class="guidance-section">
      <div class="header-row">
        <span class="pulse-icon"></span>
        <h3 class="section-title">Clinical Profile Analysis</h3>
      </div>

      <div class="analysis-box">
        <!-- <div class="dynamic-narrative"> -->
          <!-- <p v-if="hasInputs ||hasData">
            This radar chart visualizes your <strong>Multivariate Profile</strong>. 
            The <strong>Purple area</strong> represents your data. 
            Compare its shape against the <strong>Green (Healthy)</strong> average 
            to identify metrics where you deviate from the norm.
          </p>
          <p v-else>
            Awaiting input. Please enter your data or select filters to see how your 
            clinical "fingerprint" compares to the NHANES population.
          </p> -->
          <!-- <div class="analysis-box"> -->
          
          
       
        <!-- </div> -->
         
      <!-- </div> -->
        <div class="dynamic-narrative" :class="{ 'empty-subgroup-border ': (healthSummary.includes('Awaiting') || healthSummary.includes('Insufficient')), 'healthy-border': healthSummary.includes('well'), 'risk-border': healthSummary.includes('deviation') }">
          <p>{{ healthSummary }}</p>
        </div>
       <div class="status-badge-grid">
          <div v-for="m in badgeData" :key="m.key" class="status-badge" :class="m.level">
            <span class="badge-label">{{ m.label }}</span>
            <span class="badge-category">{{ m.category }}</span>
          </div>
        </div>
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

// Constants for performance and clinical mapping [cite: 93-95, 140]
const MAX_INDIVIDUAL_LINES = 140
const metrics = [
  { key: 'age', name: 'Age', max: 85 },
  { key: 'bmi', name: 'BMI', max: 70 },
  { key: 'bp', name: 'SBP', max: 220 },
  { key: 'lipids', name: 'Chol', max: 450 },
  { key: 'diabetes', name: 'Diabetes', max: 1 }
]

// Guidance Logic
// const hasData = computed(() => {
//   return (props.processObject?.selectedCVD?.length > 0 || props.processObject?.selectedNoCVD?.length > 0);
// })

// Data Processing Helpers
const asNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const sampleRows = (rows = [], max = MAX_INDIVIDUAL_LINES) => {
  if (rows.length <= max) return rows
  const step = rows.length / max
  const sampled = []
  for (let i = 0; i < max; i++) {
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


// const currentUserData = 
//    [
//     asNumber(props.userInputs?.age),      // Age
//     asNumber(props.userInputs?.bmi),      // BMI
//     asNumber(props.userInputs?.sbp),      // SBP (注意你的输入 key 是 sbp)
//     asNumber(props.userInputs?.chol),     // Chol (注意你的输入 key 是 chol)
//     asNumber(props.userInputs?.diabetes)  // Diabetes
//   ]

// Build Chart Data
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

const selectedRows = computed(() => [
  ...(props.processObject?.selectedCVD || []),
  ...(props.processObject?.selectedNoCVD || [])
])

const totalRows = computed(() => [
  ...(props.processObject?.unselectedCVD || []),
  ...(props.processObject?.unselectedNoCVD || [])
])

const hasInputs = computed(() =>
  hasValue(props.userInputs?.age)
  || hasValue(props.userInputs?.bmi)
  || hasValue(props.userInputs?.sbp)
  || hasValue(props.userInputs?.chol)
  || hasValue(props.userInputs?.diabetes)
)

const hasSubgroupSelection = computed(() =>
  totalRows.value.length > 0
  && selectedRows.value.length > 0
  && selectedRows.value.length < totalRows.value.length
)

const subgroupAverageProfile = computed(() => {
  if (!selectedRows.value.length) return null
  const avg = averageMetrics(selectedRows.value)
  return {
    age: avg[0],
    bmi: avg[1],
    sbp: avg[2],
    chol: avg[3],
    diabetes: avg[4]
  }
})

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
  return hasSubgroupSelection.value ? subgroupAverageProfile.value : null
})

const activeProfileSeriesName = computed(() => (
  hasInputs.value ? 'My Data' : hasSubgroupSelection.value ? 'Subgroup Avg' : 'My Data'
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
    legend: {
      data: ['CVD Avg', 'Healthy Avg', activeProfileSeriesName.value],
      // bottom: 5,
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

// Lifecycle Hooks
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


const getStatus = (key, val) => {
  const v = key === 'diabetes' ? val :Number(val)
  if (!val && val !== 0) return { category: '--', level: 'none' }
  
  if (key === 'age') {
    if (v < 40) return { category: 'Young Adult', level: 'normal' }
    if (v < 60) return { category: 'Middle-Aged', level: 'warning' }
    if (v < 75) return { category: 'Senior', level: 'danger' }
    return { category: 'Elderly', level: 'danger' }
  }
  if (key === 'bmi') {
    if (v < 18.5) return { category: 'Underweight', level: 'warning' }
    if (v < 25) return { category: 'Healthy', level: 'normal' }
    if (v < 30) return { category: 'Overweight', level: 'warning' }
    if (v < 35) return { category: 'Obese I', level: 'danger' }
    return { category: 'Severe Obesity', level: 'danger' }
  }
  if (key === 'sbp') {
    if (v < 120) return { category: 'Normal', level: 'normal' }
    if (v < 130) return { category: 'Elevated', level: 'warning' }
    if (v < 140) return { category: 'Stage 1', level: 'danger' }
    if (v < 180) return { category: 'Stage 2', level: 'danger' }
    return { category: 'Crisis', level: 'danger' }
  }
  if (key === 'chol') {
    if (v < 200) return { category: 'Desirable', level: 'normal' }
    if (v < 240) return { category: 'Borderline', level: 'warning' }
    return { category: 'High', level: 'danger' }
  }
  if (key === 'diabetes') {
    if (v === 0) return { category: 'Non-Diabetic', level: 'normal' }
    if (v === 1) return { category: 'Diabetic', level: 'danger' }
    
  }
  return { category: '--', level: 'none' }
}

const filterKeyMap = {
  age: 'ageGroup',
  bmi: 'bmiGroup',
  sbp: 'bpGroup',
  chol: 'lipidGroup',
  diabetes: 'diabetesLabel'
}

const filterStatusMap = {
  age: {
    'Young Adult': { category: 'Young Adult', level: 'normal' },
    'Middle-Aged': { category: 'Middle-Aged', level: 'warning' },
    'Senior': { category: 'Senior', level: 'danger' },
    'Elderly': { category: 'Elderly', level: 'danger' }
  },
  bmi: {
    Underweight: { category: 'Underweight', level: 'warning' },
    Healthy: { category: 'Healthy', level: 'normal' },
    Overweight: { category: 'Overweight', level: 'warning' },
    'Obese I': { category: 'Obese I', level: 'danger' },
    'Severe Obesity': { category: 'Severe Obesity', level: 'danger' },
    Severe: { category: 'Severe Obesity', level: 'danger' }
  },
  sbp: {
    Low: { category: 'Low', level: 'warning' },
    Normal: { category: 'Normal', level: 'normal' },
    Elevated: { category: 'Elevated', level: 'warning' },
    'Stage 1': { category: 'Stage 1', level: 'danger' },
    'Stage 2': { category: 'Stage 2', level: 'danger' },
    Crisis: { category: 'Crisis', level: 'danger' },
    'S1': { category: 'Stage 1', level: 'danger' },
    'S2': { category: 'Stage 2', level: 'danger' },
    'Elev.': { category: 'Elevated', level: 'warning' }
  },
  chol: {
    Desirable: { category: 'Desirable', level: 'normal' },
    Borderline: { category: 'Borderline', level: 'warning' },
    High: { category: 'High', level: 'danger' },
    Extreme: { category: 'Extreme', level: 'danger' },
    'Desir.': { category: 'Desirable', level: 'normal' },
    Border: { category: 'Borderline', level: 'warning' }
  },
  diabetes: {
    'Non-Diabetic': { category: 'Non-Diabetic', level: 'normal' },
    Diabetic: { category: 'Diabetic', level: 'danger' },
    'Non-DM': { category: 'Non-Diabetic', level: 'normal' },
    DM: { category: 'Diabetic', level: 'danger' }
  }
}

const getFilterStatus = (key) => {
  const filterKey = filterKeyMap[key]
  const values = props.activeFilters?.[filterKey] || []
  if (!values.length) return { category: '--', level: 'none' }
  if (values.length > 1) {
    return { category: `${values.length} selected`, level: 'warning' }
  }
  return filterStatusMap[key]?.[values[0]] || { category: values[0], level: 'warning' }
}

const getBadgeStatus = (key, value) => {
  if (key === 'diabetes') {
    if (value === 0 || value === 1) return getStatus(key, value)
    return getFilterStatus(key)
  }
  if (Number.isFinite(value)) return getStatus(key, value)
  return getFilterStatus(key)
}

const badgeData = computed(() => [
  {
    key: 'age',
    label: 'Age',
    ...getBadgeStatus(
      'age',
      hasValue(props.userInputs?.age) ? asNumber(props.userInputs?.age, null) : null
    )
  },
  {
    key: 'bmi',
    label: 'BMI',
    ...getBadgeStatus(
      'bmi',
      hasValue(props.userInputs?.bmi) ? asNumber(props.userInputs?.bmi, null) : null
    )
  },
  {
    key: 'sbp',
    label: 'SBP',
    ...getBadgeStatus(
      'sbp',
      hasValue(props.userInputs?.sbp) ? asNumber(props.userInputs?.sbp, null) : null
    )
  },
  {
    key: 'chol',
    label: 'CHOL',
    ...getBadgeStatus(
      'chol',
      hasValue(props.userInputs?.chol) ? asNumber(props.userInputs?.chol, null) : null
    )
  },
  {
    key: 'diabetes',
    label: 'Diabetes',
    ...getBadgeStatus('diabetes', normalizeDiabetesInput(props.userInputs?.diabetes))
  }
])

const healthSummary = computed(() => {
  const profile = activeProfile.value
  const data = buildRadarData();
  const benchmark = data.benchmarkHealthy;
  const subgroupCount = selectedRows.value.length

  if (!profile) return "Awaiting profile input or subgroup selection to generate clinical analysis...";

  if (hasSubgroupSelection.value && subgroupCount === 0) {
    return "⚠️ Insufficient Data: No clinical peers match the current filters. Unable to perform benchmark comparison.";
  }

  const deviations = [
    { name: 'BMI', diff: benchmark[1] > 0 ? (profile.bmi / benchmark[1]) - 1 : 0 },
    { name: 'Blood Pressure', diff: benchmark[2] > 0 ? (profile.sbp / benchmark[2]) - 1 : 0 },
    { name: 'Cholesterol', diff: benchmark[3] > 0 ? (profile.chol / benchmark[3]) - 1 : 0 }
  ];

  const majorRisks = deviations
    .filter(d => d.diff > 0.1) 
    .sort((a, b) => b.diff - a.diff);

  if (!hasInputs.value && hasSubgroupSelection.value) {
    if (majorRisks.length === 0) {
      return `Subgroup profile: ${subgroupCount.toLocaleString()} matched individuals remain close to the healthy benchmark across the major clinical axes.`
    }
    const topRisk = majorRisks[0]
    const riskLevel = topRisk.diff > 0.3 ? 'clear' : 'mild'
    return `Subgroup profile: ${subgroupCount.toLocaleString()} matched individuals show a ${riskLevel} elevation in ${topRisk.name} relative to the healthy benchmark.`
  }

  if (majorRisks.length === 0) {
    return "✅ Your clinical profile is within the healthy benchmark. Your metrics align well with the non-CVD population.";
  } else {
    const topRisk = majorRisks[0];
    const riskLevel = topRisk.diff > 0.3 ? 'significantly' : 'slightly';
    return `⚠️ Your profile shows a ${riskLevel} deviation in ${topRisk.name} compared to the healthy average. Focus on this axis for risk mitigation.`;
  }
});
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
  padding: 20px;
  background: #fdfefe;
  border-bottom: 1px solid #e6effb;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.pulse-icon {
  width: 10px;
  height: 10px;
  background: #722ed1;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 0 0 rgba(91, 25, 86, 0.4);
  animation: pulse 2s infinite;
}

.section-title {
  margin: 0;
  font-size: 14px;
  color: #4f05b7;
  text-transform: uppercase;
  font-weight: 700;
}

.dynamic-narrative {
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
  background: #f8fafc;
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #722ed1;
  margin-bottom: 15px;
}

.metrics-glossary {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #64748b;
}

.radar-canvas {
  flex: 1;
  width: 100%;
  min-height: 300px;
}

.chart-footer-hint {
  text-align: center;
  padding: 8px;
  color: #94a3b8;
}

.status-badge-grid { 
  display: grid; 
  grid-template-columns: repeat(5, 1fr); 
  gap: 8px; 
}
.status-badge { 
  padding: 6px; 
  border-radius: 6px; 
  text-align: center; 
  border: 1px solid #eee; 
  transition: all 0.3s ease; 
}
.badge-label { 
  display: block; 
  font-size: 10px; 
  color: #8c8c8c; 
  font-weight: bold; 
  text-transform: uppercase; 
}
.badge-category { 
  font-size: 11px; 
  font-weight: bold; 
}
/* 状态颜色 */
.normal { background: #f6ffed; border-color: #b7eb8f; color: #389e0d; }
.warning { background: #fffbe6; border-color: #ffe58f; color: #d48806; }
.danger { background: #fff1f0; border-color: #ffa39e; color: #cf1322; }
.none { background: #fafafa; color: #bfbfbf; }

.dynamic-narrative {
  transition: all 0.3s ease;
  min-height: 50px;
  display: flex;
  align-items: center;
}

/* 当身体健康时的样式 */
.healthy-border {
  border-left: 4px solid #52c41a !important; /* 绿色 */
  background: #f6ffed !important;
  color: #389e0d !important;
}

/* 当有风险时的样式（你原有的紫色或改成红色） */
.risk-border {
  border-left: 4px solid #ff4d4f;
  background: #fff1f0;
}
.empty-subgroup-border {
  border-left: 4px solid #bfbfbf !important;
  background: #fafafa !important;
  color: #8c8c8c !important;
  font-style: italic;
}

/* 容器保持一致，确保整体感 */
.summary-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

/* 引导区：背景微调为极浅紫灰，增加质感 */
.guidance-section {
  padding: 20px;
  background: #fdfefe; /* 保持您要求的极简白 */
  border-bottom: 1px solid #f1f5f9; /* 稍微淡化边框线 */
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

/* 呼吸灯：改为紫色，并优化了发光阴影的颜色匹配 */
.pulse-icon {
  width: 10px;
  height: 10px;
  background: #722ed1; /* 标准紫色 */
  border-radius: 50%;
  margin-right: 10px;
  /* 阴影改为紫色半透明，呼吸感更自然 */
  box-shadow: 0 0 0 rgba(114, 46, 209, 0.4); 
  animation: pulse 2s infinite;
}

/* 标题：改为深邃的石板色，更显高级感 */
.section-title {
  margin: 0;
  font-size: 14px;
  color: #4f05b7; /* 您指定的颜色 */
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* 动态话语框：增加紫色边框逻辑，作为结论的核心展示区 */
.dynamic-narrative {
  font-size: 13px;
  line-height: 1.6;
  color: #475569;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #722ed1; /* 紫色强调线 */
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

/* 呼吸动画：阴影颜色同步更新 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(114, 46, 209, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(114, 46, 209, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(114, 46, 209, 0);
  }
}
</style>
