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
  userInputs: Object
})

const radarChartRef = ref(null)
let chart = null

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
const buildRadarData = () => {
  const source = props.processObject
  return {
    individualCVD: sampleRows(source?.selectedCVD || []).map(toMetricArray),
    individualNoCVD: sampleRows(source?.selectedNoCVD || []).map(toMetricArray),
    avgCVD: averageMetrics(source?.selectedCVD || []),
    avgNoCVD: averageMetrics(source?.selectedNoCVD || []),
    // userData: [45, 28, 135, 210, 1] // Example: Should be reactive to user input
   
    userData: [props.userInputs?.age ,
              props.userInputs?.bmi,
              props.userInputs?.sbp,
              props.userInputs?.chol,
              props.userInputs &&  props.userInputs.diabetes?
              (props.userInputs?.diabetes[0] === 'Diabetic' ? 
              1 : (props.userInputs?.diabetes[0] === 'Non-Diabetic' ? 0 : '')) 
               : '' ,
     ] // Example: Should be reactive to user input

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
      data: ['CVD Avg', 'Healthy Avg', 'My Data'],
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
            name: 'My Data',
            lineStyle: { width: 3, color: '#722ed1' },
            itemStyle: { color: '#722ed1', borderWidth: 1 },
            areaStyle: { color: 'rgba(114, 46, 209, 0.3)' }
          }
        ]
      }
    ]
  }

  chart.setOption(option)
}

// Lifecycle Hooks
watch(() => props.processObject, () => initChart(), { deep: true })

onMounted(() => {
  window.addEventListener('resize', () => chart?.resize())
  initChart()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => chart?.resize())
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
    console.log(v,'111111111')
    if (v[0] === 'Non-Diabetic') return { category: 'Non-Diabetic', level: 'normal' }
    if (v[0] === 'Diabetic') return { category: 'Diabetic', level: 'danger' }
    
  }
  return { category: '--', level: 'none' }
}

const badgeData = computed(() => [
  { key: 'age', label: 'Age', ...getStatus('age', props.userInputs?.age) },
  { key: 'bmi', label: 'BMI', ...getStatus('bmi', props.userInputs?.bmi) },
  { key: 'sbp', label: 'SBP', ...getStatus('sbp', props.userInputs?.sbp) },
  { key: 'chol', label: 'CHOL', ...getStatus('chol', props.userInputs?.chol)},
  { key: 'diatetes', label: 'Diabetes', ...getStatus('diabetes', props.userInputs?.diabetes), }
])

const hasInputs = computed(() => Object.values(props.userInputs || {}).some(v => v !== null && v !== '' &&  v.length!==0 ))



const healthSummary = computed(() => {
  const ui = props.userInputs;
  const data = buildRadarData();
  const avg = data.avgNoCVD; 
  // majorRisksExist.value = 0
  // 1. 检查是否有个人输入
  console.log('ui:',ui)
  if (!hasInputs.value) return "Awaiting profile input to generate clinical analysis...";

  // 2. 核心：检查当前子群体是否有样本支撑 (Subgroup Validation)
  // const sCVD = (props.processObject?.selectedCVD || []).length;
  const sNo = (props.processObject?.selectedNoCVD || []).length;
  // const totalInSubgroup = sCVD + sNo;

  if (sNo === 0) {
    // majorRisksExist.value = 0
    return "⚠️ Insufficient Data: No clinical peers match your current filters. Unable to perform benchmark comparison. ";
  }

  // 3. 执行对比逻辑 (只有在有样本时才运行)
  const deviations = [
    { name: 'BMI', diff: (ui.bmi / avg[1]) - 1 },
    { name: 'Blood Pressure', diff: (ui.sbp / avg[2]) - 1 },
    { name: 'Cholesterol', diff: (ui.chol / avg[3]) - 1 }
  ];

  const majorRisks = deviations
    .filter(d => d.diff > 0.1) 
    .sort((a, b) => b.diff - a.diff);

  if (majorRisks.length === 0) {
    // majorRisksExist.value = 1
    
    return "✅ Your clinical profile is within the healthy benchmark. Your metrics align well with the non-CVD population. ";
  } else {
    const topRisk = majorRisks[0];
    const riskLevel = topRisk.diff > 0.3 ? 'significantly' : 'slightly';
    // majorRisksExist.value = 2

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