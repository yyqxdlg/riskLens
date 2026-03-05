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
        <div class="dynamic-narrative" :class="riskStatus.class">
          <!-- <p>{{ healthSummary }}</p> -->
          <div :class="{'score-circle':true, 'score-circle-healthy':totalRiskScore > 0  , 'score-circle-risk': totalRiskScore < 0,'score-circle-moderate': totalRiskScore == 0 && hasFilter}">{{ totalRiskScore > 0 ? '+' : '' }}{{ totalRiskScore }}</div>
        <div class="analysis-text">
          <h4 style="margin:0">
            {{ riskStatus.label }} (Total Score: {{ totalRiskScore }})
          </h4>
          <p class="risk-advice">{{ riskStatus.message }}</p>
          <div v-if="priorityRisks.length > 0" class="action-hint">
            You should focus on: <span class="highlight">{{ priorityRisks.join(', ') }}</span>
          </div>
        </div>
        </div>
       <div class="status-badge-grid">
          <div v-for="m in badgeData" :key="m.key" class="status-badge" :class="m.level">
            <span class="badge-label">{{ m.label }}</span>
            <span class="badge-category">{{ m.category }}</span>
            <div v-if="!m.isMissing" class="point-tag" :class="m.score > 0 ? 'pos' : (m.score == 0 ? 'pos': 'neg')">
            {{ m.score > 0 ? '+' : '' }}{{ m.score }}
          </div>
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


// const getStatus = (key, val) => {
//   const v = key === 'diabetes' ? val :Number(val)
//   if (!val && val !== 0) return { category: '--', level: 'none' }
  
//   if (key === 'age') {
//     if (v < 40) return { category: 'Young Adult', level: 'normal' }
//     if (v < 60) return { category: 'Middle-Aged', level: 'warning' }
//     if (v < 75) return { category: 'Senior', level: 'danger' }
//     return { category: 'Elderly', level: 'danger' }
//   }
//   if (key === 'bmi') {
//     if (v < 18.5) return { category: 'Underweight', level: 'warning' }
//     if (v < 25) return { category: 'Healthy', level: 'normal' }
//     if (v < 30) return { category: 'Overweight', level: 'warning' }
//     if (v < 35) return { category: 'Obese I', level: 'danger' }
//     return { category: 'Severe Obesity', level: 'danger' }
//   }
//   if (key === 'sbp') {
//     if (v < 120) return { category: 'Normal', level: 'normal' }
//     if (v < 130) return { category: 'Elevated', level: 'warning' }
//     if (v < 140) return { category: 'Stage 1', level: 'danger' }
//     if (v < 180) return { category: 'Stage 2', level: 'danger' }
//     return { category: 'Crisis', level: 'danger' }
//   }
//   if (key === 'chol') {
//     if (v < 200) return { category: 'Desirable', level: 'normal' }
//     if (v < 240) return { category: 'Borderline', level: 'warning' }
//     return { category: 'High', level: 'danger' }
//   }
//   if (key === 'diabetes') {
//     if (v === 0) return { category: 'Non-Diabetic', level: 'normal' }
//     if (v === 1) return { category: 'Diabetic', level: 'danger' }
    
//   }
//   return { category: '--', level: 'none' }
// }

// const filterKeyMap = {
//   age: 'ageGroup',
//   bmi: 'bmiGroup',
//   sbp: 'bpGroup',
//   chol: 'lipidGroup',
//   diabetes: 'diabetesLabel'
// }

// const filterStatusMap = {
//   age: {
//     'Young Adult': { category: 'Young Adult', level: 'normal' },
//     'Middle-Aged': { category: 'Middle-Aged', level: 'warning' },
//     'Senior': { category: 'Senior', level: 'danger' },
//     'Elderly': { category: 'Elderly', level: 'danger' }
//   },
//   bmi: {
//     Underweight: { category: 'Underweight', level: 'warning' },
//     Healthy: { category: 'Healthy', level: 'normal' },
//     Overweight: { category: 'Overweight', level: 'warning' },
//     'Obese I': { category: 'Obese I', level: 'danger' },
//     'Severe Obesity': { category: 'Severe Obesity', level: 'danger' },
//     Severe: { category: 'Severe Obesity', level: 'danger' }
//   },
//   sbp: {
//     Low: { category: 'Low', level: 'warning' },
//     Normal: { category: 'Normal', level: 'normal' },
//     Elevated: { category: 'Elevated', level: 'warning' },
//     'Stage 1': { category: 'Stage 1', level: 'danger' },
//     'Stage 2': { category: 'Stage 2', level: 'danger' },
//     Crisis: { category: 'Crisis', level: 'danger' },
//     'S1': { category: 'Stage 1', level: 'danger' },
//     'S2': { category: 'Stage 2', level: 'danger' },
//     'Elev.': { category: 'Elevated', level: 'warning' }
//   },
//   chol: {
//     Desirable: { category: 'Desirable', level: 'normal' },
//     Borderline: { category: 'Borderline', level: 'warning' },
//     High: { category: 'High', level: 'danger' },
//     Extreme: { category: 'Extreme', level: 'danger' },
//     'Desir.': { category: 'Desirable', level: 'normal' },
//     Border: { category: 'Borderline', level: 'warning' }
//   },
//   diabetes: {
//     'Non-Diabetic': { category: 'Non-Diabetic', level: 'normal' },
//     Diabetic: { category: 'Diabetic', level: 'danger' },
//     'Non-DM': { category: 'Non-Diabetic', level: 'normal' },
//     DM: { category: 'Diabetic', level: 'danger' }
//   }
// }

// const getFilterStatus = (key) => {
//   const filterKey = filterKeyMap[key]
//   const values = props.activeFilters?.[filterKey] || []
//   if (!values.length) return { category: '--', level: 'none' }
//   if (values.length > 1) {
//     return { category: `${values.length} selected`, level: 'warning' }
//   }
//   return filterStatusMap[key]?.[values[0]] || { category: values[0], level: 'warning' }
// }

// const getBadgeStatus = (key, value) => {
//   if (key === 'diabetes') {
//     if (value === 0 || value === 1) return getStatus(key, value)
//     return getFilterStatus(key)
//   }
//   if (Number.isFinite(value)) return getStatus(key, value)
//   return getFilterStatus(key)
// }

// const badgeData = computed(() => [
//   {
//     key: 'age',
//     label: 'Age',
//     ...getBadgeStatus(
//       'age',
//       hasValue(props.userInputs?.age) ? asNumber(props.userInputs?.age, null) : null
//     )
//   },
//   {
//     key: 'bmi',
//     label: 'BMI',
//     ...getBadgeStatus(
//       'bmi',
//       hasValue(props.userInputs?.bmi) ? asNumber(props.userInputs?.bmi, null) : null
//     )
//   },
//   {
//     key: 'sbp',
//     label: 'SBP',
//     ...getBadgeStatus(
//       'sbp',
//       hasValue(props.userInputs?.sbp) ? asNumber(props.userInputs?.sbp, null) : null
//     )
//   },
//   {
//     key: 'chol',
//     label: 'CHOL',
//     ...getBadgeStatus(
//       'chol',
//       hasValue(props.userInputs?.chol) ? asNumber(props.userInputs?.chol, null) : null
//     )
//   },
//   {
//     key: 'diabetes',
//     label: 'Diabetes',
//     ...getBadgeStatus('diabetes', normalizeDiabetesInput(props.userInputs?.diabetes))
//   }
// ])

const hasFilter = computed (()=>{
  return  detailedScores.value.filter(d => !d.isMissing).length;
  
})
const badgeData = computed(() => {
  // 建立 UI 显示标签与数据 key 的映射关系
  const uiMapping = [
    { key: 'age', label: 'Age' },
    { key: 'bmi', label: 'BMI' },
    { key: 'bp', label: 'SBP' },      // 注意这里 key 用 bp，对应 detailedScores
    { key: 'lipids', label: 'CHOL' }, // 注意这里 key 用 lipids，对应 detailedScores
    { key: 'diabetes', label: 'Diabetes' }
  ];

  return uiMapping.map(m => {
    // 直接从已有的 detailedScores 中寻找对应的计算结果
    const scoreDetail = detailedScores.value.find(d => d.key === m.key) || {};

    return {
      key: m.key,
      label: m.label,
      score: scoreDetail.score || 0,
      category: scoreDetail.category || '--',
      level: scoreDetail.level || 'none',
      isMissing: scoreDetail.isMissing ?? true,
      value: scoreDetail.value
    };
  });
});
// const badgeData = computed(() => {
//   const ui = props.userInputs || {};

//   // 定义指标映射关系，确保 key 能对应上 props
//   const metricsMap = [
//     { key: 'age', label: 'Age', inputKey: 'age' },
//     { key: 'bmi', label: 'BMI', inputKey: 'bmi' },
//     { key: 'sbp', label: 'SBP', inputKey: 'sbp' },
//     { key: 'chol', label: 'CHOL', inputKey: 'chol' },
//     { key: 'diabetes', label: 'Diabetes', inputKey: 'diabetes' }
//   ];

//   return metricsMap.map(metric => {
//     const rawVal = ui[metric.inputKey];
    
//     // 1. 判断是否有输入值
//     const hasInput = (metric.key === 'diabetes') 
//       ? (rawVal && rawVal.length > 0) 
//       : (rawVal !== undefined && rawVal !== null && rawVal !== '');

//     // 如果没有输入，返回初始/待定状态
//     if (!hasInput) {
//       return {
//         ...metric,
//         ...getBadgeStatus(metric.key, null), // 保留原有的状态获取逻辑
//         score: 0,
//         category: "Pending",
//         level: "none",
//         reason: "No input",
//         value: null,
//         isMissing: true
//       };
//     }
//     console.log(metric,'metric')
//     // 2. 格式化数值
//     let val = metric.key === 'diabetes' 
//       ? (normalizeDiabetesInput(rawVal) === 'Diabetic' ? 1 : 0) 
//       : Number(rawVal);

//     // 3. 计算评分逻辑 (原 detailedScores 逻辑)
//     let score = 0, category = "", level = "", reason = "";

//     switch (metric.key) {
//       case 'age':
//         if (val < 40) { score = 1; category = "Young Adult"; level = "normal"; reason = "Healthy Stage (+1)"; }
//         else if (val < 60) { score = 0; category = "Middle-Aged"; level = "warning"; reason = "Screening Window (0)"; }
//         else { score = 0; category = val < 75 ? "Senior" : "Elderly"; level = "danger"; reason = "Standard risk (0)"; }
//         break;
//       case 'bmi':
//         if (val >= 18.5 && val < 25) { score = 1; category = "Healthy"; level = "normal"; reason = "Healthy BMI (+1)"; }
//         else if (val < 18.5 || val < 30) { score = -1; category = val < 18.5 ? "Underweight" : "Overweight"; level = "warning"; reason = "Deviated (-1)"; }
//         else if (val < 35) { score = -2; category = "Obese I"; level = "danger"; reason = "Obesity Class I (-2)"; }
//         else { score = -3; category = "Severe Obesity"; level = "danger"; reason = "Significant Risk (-3)"; }
//         break;
//       case 'sbp': // 对应原 bp 逻辑
//         if (val < 120) { score = 1; category = "Normal"; level = "normal"; reason = "Normal (+1)"; }
//         else if (val < 130) { score = -1; category = "Elevated"; level = "warning"; reason = "Elevated (-1)"; }
//         else if (val < 180) { score = -2; category = val < 140 ? "Stage 1" : "Stage 2"; level = "danger"; reason = "Hypertension (-2)"; }
//         else { score = -3; category = "Crisis"; level = "danger"; reason = "Crisis (-3)"; }
//         break;
//       case 'chol': // 对应原 lipids 逻辑
//         if (val < 200) { score = 1; category = "Desirable"; level = "normal"; reason = "Optimal (+1)"; }
//         else if (val < 240) { score = -1; category = "Borderline"; level = "warning"; reason = "Borderline (-1)"; }
//         else if (val < 400) { score = -2; category = "High"; level = "danger"; reason = "High Chol (-2)"; }
//         else { score = -3; category = "Extreme"; level = "danger"; reason = "Extreme Risk (-3)"; }
//         break;
//       case 'diabetes':
//         if (val === 0) { score = 1; category = "Non-Diabetic"; level = "normal"; reason = "Healthy (+1)"; }
//         else if(val === "diabetes") { score = -3; category = "Diabetic"; level = "danger"; reason = "Major Risk (-3)"; }
//         break;
//     }

//     // 4. 合并结果
//     return {
//       ...metric,
//       // 依然调用 getBadgeStatus 来获取颜色、图标等原有配置
//       ...getBadgeStatus(metric.key, val), 
//       score,
//       category,
//       level,
//       reason,
//       value: val,
//       isMissing: false
//     };
//   });
// });
// const healthSummary = computed(() => {
//   const profile = activeProfile.value
//   const data = buildRadarData();
//   const benchmark = data.benchmarkHealthy;
//   const subgroupCount = selectedRows.value.length

//   if (!profile) return "Awaiting profile input or subgroup selection to generate clinical analysis...";

//   if (hasSubgroupSelection.value && subgroupCount === 0) {
//     return "⚠️ Insufficient Data: No clinical peers match the current filters. Unable to perform benchmark comparison.";
//   }

//   const deviations = [
//     { name: 'BMI', diff: benchmark[1] > 0 ? (profile.bmi / benchmark[1]) - 1 : 0 },
//     { name: 'Blood Pressure', diff: benchmark[2] > 0 ? (profile.sbp / benchmark[2]) - 1 : 0 },
//     { name: 'Cholesterol', diff: benchmark[3] > 0 ? (profile.chol / benchmark[3]) - 1 : 0 }
//   ];

//   const majorRisks = deviations
//     .filter(d => d.diff > 0.1) 
//     .sort((a, b) => b.diff - a.diff);

//   if (!hasInputs.value && hasSubgroupSelection.value) {
//     if (majorRisks.length === 0) {
//       return `Subgroup profile: ${subgroupCount.toLocaleString()} matched individuals remain close to the healthy benchmark across the major clinical axes.`
//     }
//     const topRisk = majorRisks[0]
//     const riskLevel = topRisk.diff > 0.3 ? 'clear' : 'mild'
//     return `Subgroup profile: ${subgroupCount.toLocaleString()} matched individuals show a ${riskLevel} elevation in ${topRisk.name} relative to the healthy benchmark.`
//   }

//   if (majorRisks.length === 0) {
//     return "✅ Your clinical profile is within the healthy benchmark. Your metrics align well with the non-CVD population.";
//   } else {
//     const topRisk = majorRisks[0];
//     const riskLevel = topRisk.diff > 0.3 ? 'significantly' : 'slightly';
//     return `⚠️ Your profile shows a ${riskLevel} deviation in ${topRisk.name} compared to the healthy average. Focus on this axis for risk mitigation.`;
//   }
// });


// new grade rule
// --- 打分引擎：严格遵循图片中的 Categorization Logic ---
const detailedScores = computed(() => {
  const ui = props.userInputs || {}
  
  return metrics.map(m => {
    const rawVal = ui[m.key === 'lipids' ? 'chol' : (m.key === 'bp' ? 'sbp' : m.key)];
    const hasInput = (m.key === 'diabetes') ? 
      (ui.diabetes && ui.diabetes.length > 0) : 
      (rawVal !== undefined && rawVal !== null && rawVal !== '');

    if (!hasInput) return { ...m, score: 0, category: "Pending", level: "none", reason: "No input", value: null, isMissing: true };

    let val = m.key === 'diabetes' ? (ui.diabetes.includes('Diabetic') ? 1 : 0) : Number(rawVal);
    let score = 0, category = "", level = "", reason = "";

    switch (m.key) {
      case 'age':
        if (val < 40) { score = 1; category = "Young Adult"; level = "normal"; reason = "Healthy Stage (+1)"; }
        else if (val < 60) { score = 0; category = "Middle-Aged"; level = "normal"; reason = "Screening Window (0)"; }
        else { score = 0; category = val < 75 ? "Senior" : "Elderly"; level = "normal"; reason = "Standard risk (0)"; }
        break;
      case 'bmi':
        if (val >= 18.5 && val < 25) { score = 1; category = "Healthy"; level = "normal"; reason = "Healthy BMI (+1)"; }
        else if (val < 18.5 || val < 30) { score = -1; category = val < 18.5 ? "Underweight" : "Overweight"; level = "warning"; reason = "Deviated (-1)"; }
        else if (val < 35) { score = -2; category = "Obese I"; level = "danger"; reason = "Obesity Class I (-2)"; }
        else { score = -3; category = "Severe Obesity"; level = "danger"; reason = "Significant Risk (-3)"; }
        break;
      case 'bp':
        if (val < 120) { score = 1; category = "Normal"; level = "normal"; reason = "Normal (+1)"; }
        else if (val < 130) { score = -1; category = "Elevated"; level = "warning"; reason = "Elevated (-1)"; }
        else if (val < 180) { score = -2; category = val < 140 ? "Stage 1" : "Stage 2"; level = "danger"; reason = "Hypertension (-2)"; }
        else { score = -3; category = "Crisis"; level = "danger"; reason = "Crisis (-3)"; }
        break;
      case 'lipids':
        if (val < 200) { score = 1; category = "Desirable"; level = "normal"; reason = "Optimal (+1)"; }
        else if (val < 240) { score = -1; category = "Borderline"; level = "warning"; reason = "Borderline (-1)"; }
        else if (val < 400) { score = -2; category = "High"; level = "danger"; reason = "High Chol (-2)"; }
        else { score = -3; category = "Extreme"; level = "danger"; reason = "Extreme Risk (-3)"; }
        break;
      case 'diabetes':
        if (val === 0) { score = 1; category = "Non-Diabetic"; level = "normal"; reason = "Healthy (+1)"; }
        else { score = -3; category = "Diabetic"; level = "danger"; reason = "Major Risk (-3)"; }
        break;
    }
    return { ...m, score, category, level, reason, value: val, isMissing: false };
  });
});

const totalRiskScore = computed(() => detailedScores.value.reduce((acc, curr) => acc + curr.score, 0));

// --- 风险级别与颜色判定 ---
// const riskStatus = computed(() => {
//   const activeCount = detailedScores.value.filter(d => !d.isMissing).length;
//   if (activeCount === 0) return { label: 'AWAITING DATA', class: 'none-border', message: 'Input clinical data to determine risk.' };
  
//   const score = totalRiskScore.value;
//   // 计算平均表现来判定
//   const avg = score / activeCount;
  
//   if (avg >= 0.4) return { label: 'LOW RISK', class: 'healthy-border', message: 'Your profile is generally aligned with healthy standards.' };
//   if (avg >= -0.3) return { label: 'MODERATE RISK', class: 'warning-border', message: 'Some metrics show deviation from clinical benchmarks.' };
//   return { label: 'HIGH RISK', class: 'risk-border', message: 'Significant risk detected across multiple clinical axes.' };
// });
const riskStatus = computed(() => {
  const activeCount = detailedScores.value.filter(d => !d.isMissing).length;
  
  // 无数据状态
  if (activeCount === 0) {
    return { 
      label: 'AWAITING DATA', 
      class: 'none-border', 
      message: 'Please input clinical data to analyze your risk profile.' 
    };
  }
  
  const score = totalRiskScore.value;
  // const avg = score / activeCount; // 计算平均权重
  
  // 1. 低风险 (大部分是 +1)
  if (score > 0) {
    return { 
      label: 'LOW RISK', 
      class: 'healthy-border', 
      message: 'You are currently in a low risk category. Your clinical metrics align well with healthy benchmarks.' 
    };
  } 
  
  // 2. 中风险 (得分在 0 附近徘徊)
  if (score == 0) {
    return { 
      label: 'MODERATE RISK', 
      class: 'warning-border', 
      message: 'You are currently in a middle risk category. Some deviations from standard clinical ranges have been detected.' 
    };
  } 
  
  // 3. 高风险 (平均分很低)
  return { 
    label: 'HIGH RISK', 
    class: 'risk-border', 
    message: 'You are currently in a high risk category. Significant deviations across multiple metrics require clinical attention.' 
  };
});
// --- 自动提取需要关注的模块（得分小于0的模块） ---
const priorityRisks = computed(() => {
  return detailedScores.value
    .filter(d => !d.isMissing && d.score < 0)
    .sort((a, b) => a.score - b.score) // 扣分最多的排前面
    .map(d => d.name);
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
    display: flex; align-items: center; padding: 15px; border-radius: 10px; 
  margin-bottom: 20px; border-left: 6px solid #e2e8f0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.score-circle { 
  width: 44px; height: 44px; border-radius: 50%; background: #722ed1; color: #fff; 
  display: flex; align-items: center; justify-content: center; font-weight: 900; 
  margin-right: 18px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3); font-size: 18px;
}

.score-circle-healthy { background-color: #52c41a !important; }

.score-circle-risk { background-color: #ff4d4f !important;}
.score-circle-moderate { background-color: #faad14 !important;}


.analysis-text h4 { font-size: 15px; margin-bottom: 4px; }
.risk-advice { font-size: 12px; margin: 0; opacity: 0.9; }

/* 动态行动建议 */
.action-hint { margin-top: 8px; font-size: 11px; font-weight: bold; background: rgba(255,255,255,0.4); padding: 4px 8px; border-radius: 4px; display: inline-block; }
.highlight { text-decoration: underline; color: inherit; }

/* 风险等级样式映射 */
.healthy-border { border-left-color: #52c41a !important; background: #f6ffed !important; color: #389e0d !important; }
.warning-border { border-left-color: #faad14 !important; background: #fffbe6 !important; color: #d48806 !important; }
.risk-border { border-left-color: #ff4d4f !important; background: #fff1f0 !important; color: #cf1322 !important; }

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
  position: relative;
}
.status-badge:hover { transform: translateY(-2px); }
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
.point-tag { position: absolute; top: -8px; right: -5px; font-size: 10px; padding: 2px 6px; border-radius: 10px; color: #fff; font-weight: 900; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.pos { background: #52c41a; }
.neg { background: #ff4d4f; }
.nor {background: #faad14;}
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
