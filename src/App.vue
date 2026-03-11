<template>
    <a-tabs v-model:activeKey="activeKey" class="app-tabs">
      <a-tab-pane key="1">
        <template #tab>
          <span>
            <HeartTwoTone two-tone-color="#ff4d4f" />
            Main
          </span>
        </template>
        <OnboardingFlow
          v-if="showOnboarding"
          @complete="handleOnboardingComplete"
        />
        <section v-else-if="isDashboardBooting" class="onboarding-loading-shell">
          <div class="onboarding-loading-card">
            <div class="loader-badge" aria-hidden="true">
              <span class="loader-ring"></span>
              <span class="loader-heart">♥</span>
            </div>
            <p class="loading-kicker">Preparing dashboard</p>
            <h2>Linking your profile to the cohort</h2>
            <p class="loading-copy">
              Mapping your answers, recalculating subgroup distributions, and generating the clinical comparison.
            </p>
            <div class="loading-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </section>
        <div v-else class="page-shell">
          <section class="topOverviewRow">
            <section class="panel-card form-card">
              <div class="form-card-header">
                <img :src="logoSrc" alt="RiskLens" class="form-card-logo">
              </div>
              <UserForm
                :clearSignal="formClearSignal"
                :initialFilters="formFilters"
                :initialValues="userInputs"
                @updateFilters="onFormFiltersUpdate"
                @updateUserInputs="onUserInputsUpdate"
                @openTimeMachine="showOlderModal"
              />
            </section>
            <section class="panel-card userScoreCard">
              <div class="guidance-section">
                <div class="header-row">
                  <span class="pulse-icon"></span>
                  <h3 class="section-title">Clinical Profile Analysis</h3>
                </div>
                <div class="analysis-box">
                  <div class="dynamic-narrative" :class="riskStatus.class">
                    <div :class="{ 'score-circle': true, 'score-circle-healthy': totalRiskScore > 0, 'score-circle-risk': totalRiskScore < 0, 'score-circle-moderate': totalRiskScore == 0 && hasFilter }">{{ totalRiskScore > 0 ? '+' : '' }}{{ totalRiskScore }}</div>
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
            </section>
          </section>
          <section class="panel-card topFilterRow">
            <div class="topFilterContent">
              <TopFilter :activeFilters="activeFilters" @remove="handleTopFilterRemove"></TopFilter>
            </div>
            <div class="topActions">
              <a-button class="clearAllBtn" @click="clearAllFilters">Clear All Filters</a-button>
            </div>
          </section>
          <section class="panel-card rangePart">
            <RangePart
              :rawGroupData="rawGroupData"
              :contextFilters="formFilters"
              :userInputs="userInputs"
              :clearSignal="rangeClearSignal"
              :clearRequest="clearFilterRequest"
              @updateFilters="onRangeFiltersUpdate"
              @updateSelection="onRangeSelectionUpdate"
            />
          </section>
          <section class="panel-card rightPart">
            <div class="selection-narrative">
              <p v-if="totalSelected > 0">
                Based on the filters, You have isolated a subgroup of <strong>{{ totalSelected.toLocaleString() }}</strong> individuals.
                consisting of <strong class="red">{{ selectedCVDCount.toLocaleString() }}</strong> CVD cases
                and <strong class="blue">{{ selectedHealthyCount.toLocaleString() }}</strong> healthy peers.
              </p>
              <p v-else>
                No matching peers found for these criteria. Please adjust your sliders or categories for peer-group analysis.
              </p>
            </div>
            <div class="twoContainer">
              <div class="radarPart">
                <RadarPart
                  :processObject="processArray"
                  :userInputs="userInputs"
                  :activeFilters="activeFilters"
                ></RadarPart>
              </div>
              <div class="summaryPart">
                <SummaryPart :processObject="processArray" ></SummaryPart>
              </div>
            </div>
          </section>
          <TimeMachine v-if="open" :rawGroupData="rawGroupData" :modalState="modalState" @colseTimeModal="colseTimeModal"></TimeMachine>
        </div>
      </a-tab-pane>
      <a-tab-pane key="2">
        <template #tab>
          <span>
            <BulbTwoTone two-tone-color="#52c41a" />
            About
          </span>
        </template>
        <AboutPage></AboutPage>
      </a-tab-pane>
      <a-tab-pane key="3">
        <template #tab>
          <span>
            <IdcardTwoTone two-tone-color="#1890ff" />
            Team
          </span>
        </template>
        <TeamPage></TeamPage>
      </a-tab-pane>
    </a-tabs>
  
  
  
  <!-- <router-view></router-view> -->
</template>

<script setup>
// import DashBoard from './components/DashBoard.vue'
import {ref, onMounted, watch, computed} from 'vue'
import { HeartTwoTone, IdcardTwoTone ,BulbTwoTone} from '@ant-design/icons-vue';
import UserForm from './components/UserForm.vue'
import OnboardingFlow from './components/OnboardingFlow.vue'
import RadarPart from './components/RadarPart.vue'
import RangePart from './components/RangePart.vue'
import SummaryPart from './components/SummaryPart.vue'
import TopFilter from './components/TopFilter.vue';
import groupData from '@/assets/riskless_data_all_years.json';
import TimeMachine from './components/TimeMachine.vue';
import AboutPage from './components/AboutPage.vue';
import TeamPage from './components/TeamPage.vue';
import logoSrc from '@/assets/risklenslogo.png';


  const rawGroupData = ref([])

  const emptyFilterMap = () => ({
    ageGroup: [],
    bmiGroup: [],
    bpGroup: [],
    lipidGroup: [],
    diabetesLabel: []
  })
 
  const activeKey = ref('1');
  const showOnboarding = ref(true)
  const isDashboardBooting = ref(false)

  const activeFilters = ref(emptyFilterMap());
  const rangeFilters = ref(emptyFilterMap());
  const rangeSelectedRowIds = ref(null);
  const clearFilterRequest = ref({ token: 0, key: '' })
  const formFilters = ref(emptyFilterMap());
  const formClearSignal = ref(0);
  const rangeClearSignal = ref(0);
  const emptyUserInputs = () => ({
    age: null,
    bmi: null,
    sbp: null,
    chol: null,
    diabetes: null
  })
  const userInputs = ref(emptyUserInputs())

  const processArray = ref(null)

  const dedupe = (arr = []) => [...new Set(arr)];
  const isFilterMapEmpty = (filters = {}) =>
    !Object.values(filters).some((arr) => Array.isArray(arr) && arr.length > 0)

  const mergeFiltersByIntersection = (fromRange = [], fromForm = []) => {
    const left = dedupe(fromRange);
    const right = dedupe(fromForm);

    if (!left.length && !right.length) return [];
    if (!left.length) return right;
    if (!right.length) return left;
    const inter = left.filter(item => right.includes(item));
    if (inter.length) return inter;
    // If the user re-selects on the range chart after typing,
    // treat the latest chart interaction as the active filter for that dimension.
    return left;
  };

  const rebuildActiveFilters = () => {
    const next = emptyFilterMap();
    Object.keys(next).forEach((key) => {
      const fromRange = rangeFilters.value[key] || [];
      const fromForm = formFilters.value[key] || [];
      next[key] = mergeFiltersByIntersection(fromRange, fromForm);
    });
    activeFilters.value = next;
  };

  const onRangeFiltersUpdate = (val) => {
    const nextRange = { ...rangeFilters.value, ...val }
    const nextForm = { ...formFilters.value }

    // ← 新增：chart 主动选了某 dim，form 不再干预该 dim
    Object.keys(val).forEach(key => {
      if ((val[key] || []).length > 0) {
        nextForm[key] = []
      }
    })

    rangeFilters.value = nextRange
    // 只在真正有变化时赋值，避免不必要的 contextFilters watch 触发
    const formChanged = Object.keys(nextForm).some(
      k => JSON.stringify(nextForm[k]) !== JSON.stringify(formFilters.value[k])
    )
    if (formChanged) formFilters.value = nextForm

    rebuildActiveFilters()
  }

  const onRangeSelectionUpdate = (rowIds) => {
    rangeSelectedRowIds.value = Array.isArray(rowIds) ? rowIds : null;
  };

  const onFormFiltersUpdate = (val) => {
    const nextForm = { ...formFilters.value, ...val };
    const nextRange = { ...rangeFilters.value };
    const shouldClearRangeAll = isFilterMapEmpty(nextForm)

    if (shouldClearRangeAll) {
      Object.assign(nextRange, emptyFilterMap())
      rangeSelectedRowIds.value = null
      rangeClearSignal.value += 1
    } else {
      Object.keys(nextForm).forEach((key) => {
        if ((nextForm[key] || []).length > 0) {
          nextRange[key] = []
        }
      });
    }

    formFilters.value = nextForm;
    rangeFilters.value = nextRange;
    rebuildActiveFilters();
  };

  const onUserInputsUpdate = (val) => {
    userInputs.value = { ...userInputs.value, ...val };
  };

  const handleTopFilterRemove = ({ key, value }) => {
    formFilters.value = {
      ...formFilters.value,
      [key]: (formFilters.value[key] || []).filter(item => item !== value)
    }
    rangeFilters.value = {
      ...rangeFilters.value,
      [key]: (rangeFilters.value[key] || []).filter(item => item !== value)
    }
    rangeSelectedRowIds.value = null
    rebuildActiveFilters()
    clearFilterRequest.value = {
      token: clearFilterRequest.value.token + 1,
      key,value
    }
  }

  const handleOnboardingComplete = ({ filters, userInputs: nextInputs }) => {
    isDashboardBooting.value = true
    showOnboarding.value = false
    formFilters.value = { ...emptyFilterMap(), ...(filters || {}) }
    rangeFilters.value = emptyFilterMap()
    rangeSelectedRowIds.value = null
    userInputs.value = { ...emptyUserInputs(), ...(nextInputs || {}) }
    rebuildActiveFilters()
    rangeClearSignal.value += 1
    window.setTimeout(() => {
      isDashboardBooting.value = false
    }, 980)
  }

  const clearAllFilters = () => {
    formFilters.value = emptyFilterMap();
    rangeFilters.value = emptyFilterMap();
    rangeSelectedRowIds.value = null;
    rebuildActiveFilters();
    rangeClearSignal.value += 1;
  };

  const processData = () => {
    const filters = activeFilters.value;
    const activeKeys = Object.keys(filters).filter(key => filters[key].length > 0);
    const hasExactSelection = Array.isArray(rangeSelectedRowIds.value);
    const selectedRowIdSet = hasExactSelection ? new Set(rangeSelectedRowIds.value) : null;
   
    const result = {
      selectedCVD: [],
      selectedNoCVD: [],
      unselectedCVD: [],
      unselectedNoCVD: []
    };
    rawGroupData.value.forEach((item, index) => {
     
      const isMatched = hasExactSelection
        ? selectedRowIdSet.has(index)
        : activeKeys.every(key => filters[key].includes(item.displayGroups[key]));

     
      const hasCVD = item.rawValues.CVD === 1;

    
      if (isMatched) {
        if (hasCVD) result.selectedCVD.push(item);
        else result.selectedNoCVD.push(item);
      } 
      
      if (hasCVD) result.unselectedCVD.push(item);
      else result.unselectedNoCVD.push(item);
      
    });
   
    return result
    
  }
  // watch(() => activeFilters.value, () => {
  //   processArray.value = processData();
  // }, { deep: true })

  const open = ref(false)
  const modalState = ref({
      open: false,
      userAge: 0,
      otherInfo: {
        
      }
    })
  const getPreferredUserAge = () => {
    if (Number.isFinite(userInputs.value.age)) {
      return Math.round(userInputs.value.age)
    }
    if (rawGroupData.value.length) {
      const avg = rawGroupData.value.reduce((acc, row) => acc + Number(row.rawValues?.age || 0), 0) / rawGroupData.value.length
      return Math.round(avg)
    }
    return 50
  }

const showOlderModal = (age) => {
  modalState.value = {
    open: true,
    userAge: Number.isFinite(age) ? Math.round(age) : getPreferredUserAge(),
    otherInfo: { ...activeFilters.value }
  }
  open.value = true
}
  const colseTimeModal = () => {
    open.value = false
    
  }

  watch(
  () => activeFilters.value,     // ← 只 watch activeFilters，去掉 userInputs.value.age
  () => {
    processArray.value = processData();
    if (!open.value) return
    modalState.value = {
      ...modalState.value,
      open: true,
      // userAge 不更新 ← modal 打开后 age 保持用户点击时传入的值
      otherInfo: { ...activeFilters.value }
    }
  },
  { deep: true }
)
  onMounted(() => {
    
    rawGroupData.value = groupData
   
    rebuildActiveFilters();
    processArray.value = processData();
   })

const scoreMetrics = [
  { key: 'age', name: 'Age', max: 85 },
  { key: 'bmi', name: 'BMI', max: 70 },
  { key: 'bp', name: 'SBP', max: 220 },
  { key: 'lipids', name: 'Chol', max: 450 },
  { key: 'diabetes', name: 'Diabetes', max: 1 }
]

const detailedScores = computed(() => {
  const ui = userInputs.value || {}

  return scoreMetrics.map(metric => {
    const rawVal = ui[metric.key === 'lipids' ? 'chol' : (metric.key === 'bp' ? 'sbp' : metric.key)]
    const hasInput = metric.key === 'diabetes'
      ? (ui.diabetes && ui.diabetes.length > 0)
      : (rawVal !== undefined && rawVal !== null && rawVal !== '')

    if (!hasInput) {
      return {
        ...metric,
        score: 0,
        category: 'Pending',
        level: 'none',
        reason: 'No input',
        value: null,
        isMissing: true
      }
    }

    const val = metric.key === 'diabetes' ? (ui.diabetes.includes('Diabetic') ? 1 : 0) : Number(rawVal)
    let score = 0
    let category = ''
    let level = ''
    let reason = ''

    switch (metric.key) {
      case 'age':
        if (val < 40) {
          score = 1
          category = 'Young Adult'
          level = 'normal'
          reason = 'Healthy Stage (+1)'
        } else if (val < 60) {
          score = 0
          category = 'Middle-Aged'
          level = 'normal'
          reason = 'Screening Window (0)'
        } else {
          score = 0
          category = val < 75 ? 'Senior' : 'Elderly'
          level = 'normal'
          reason = 'Standard risk (0)'
        }
        break
      case 'bmi':
        if (val >= 18.5 && val < 25) {
          score = 1
          category = 'Healthy'
          level = 'normal'
          reason = 'Healthy BMI (+1)'
        } else if (val < 18.5 || val < 30) {
          score = -1
          category = val < 18.5 ? 'Underweight' : 'Overweight'
          level = 'warning'
          reason = 'Deviated (-1)'
        } else if (val < 35) {
          score = -2
          category = 'Obese I'
          level = 'danger'
          reason = 'Obesity Class I (-2)'
        } else {
          score = -3
          category = 'Severe Obesity'
          level = 'danger'
          reason = 'Significant Risk (-3)'
        }
        break
      case 'bp':
        if (val < 120) {
          score = 1
          category = 'Normal'
          level = 'normal'
          reason = 'Normal (+1)'
        } else if (val < 130) {
          score = -1
          category = 'Elevated'
          level = 'warning'
          reason = 'Elevated (-1)'
        } else if (val < 180) {
          score = -2
          category = val < 140 ? 'Stage 1' : 'Stage 2'
          level = 'danger'
          reason = 'Hypertension (-2)'
        } else {
          score = -3
          category = 'Crisis'
          level = 'danger'
          reason = 'Crisis (-3)'
        }
        break
      case 'lipids':
        if (val < 200) {
          score = 1
          category = 'Desirable'
          level = 'normal'
          reason = 'Optimal (+1)'
        } else if (val < 240) {
          score = -1
          category = 'Borderline'
          level = 'warning'
          reason = 'Borderline (-1)'
        } else if (val < 400) {
          score = -2
          category = 'High'
          level = 'danger'
          reason = 'High Chol (-2)'
        } else {
          score = -3
          category = 'Extreme'
          level = 'danger'
          reason = 'Extreme Risk (-3)'
        }
        break
      case 'diabetes':
        if (val === 0) {
          score = 1
          category = 'Non-Diabetic'
          level = 'normal'
          reason = 'Healthy (+1)'
        } else {
          score = -3
          category = 'Diabetic'
          level = 'danger'
          reason = 'Major Risk (-3)'
        }
        break
      default:
        break
    }

    return { ...metric, score, category, level, reason, value: val, isMissing: false }
  })
})

const hasFilter = computed(() => detailedScores.value.filter(score => !score.isMissing).length)

const totalRiskScore = computed(() => detailedScores.value.reduce((acc, curr) => acc + curr.score, 0))

const riskStatus = computed(() => {
  const activeCount = detailedScores.value.filter(score => !score.isMissing).length

  if (activeCount === 0) {
    return {
      label: 'AWAITING DATA',
      class: 'none-border',
      message: 'Please input clinical data to analyze your risk profile.'
    }
  }

  if (totalRiskScore.value > 0) {
    return {
      label: 'LOW RISK',
      class: 'healthy-border',
      message: 'You are currently in a low risk category. Your clinical metrics align well with healthy benchmarks.'
    }
  }

  if (totalRiskScore.value === 0) {
    return {
      label: 'MODERATE RISK',
      class: 'warning-border',
      message: 'You are currently in a middle risk category. Some deviations from standard clinical ranges have been detected.'
    }
  }

  return {
    label: 'HIGH RISK',
    class: 'risk-border',
    message: 'You are currently in a high risk category. Significant deviations across multiple metrics require clinical attention.'
  }
})

const priorityRisks = computed(() => detailedScores.value
  .filter(score => !score.isMissing && score.score < 0)
  .sort((left, right) => left.score - right.score)
  .map(score => score.name)
)

const badgeData = computed(() => {
  const uiMapping = [
    { key: 'age', label: 'Age' },
    { key: 'bmi', label: 'BMI' },
    { key: 'bp', label: 'SBP' },
    { key: 'lipids', label: 'CHOL' },
    { key: 'diabetes', label: 'Diabetes' }
  ]

  return uiMapping.map(metric => {
    const scoreDetail = detailedScores.value.find(item => item.key === metric.key) || {}

    return {
      key: metric.key,
      label: metric.label,
      score: scoreDetail.score || 0,
      category: scoreDetail.category || '--',
      level: scoreDetail.level || 'none',
      isMissing: scoreDetail.isMissing ?? true,
      value: scoreDetail.value
    }
  })
})

//后续修改
const totalSelected = computed(() => selectedCVDCount.value + selectedHealthyCount.value);
const selectedCVDCount = computed(() => {

  return processArray.value ? (processArray.value?.selectedCVD || []).length : 0  
  }
) ;
const selectedHealthyCount = computed(() => processArray.value ?(processArray.value?.selectedNoCVD || []).length : 0);

</script>

<style scoped>
#app {
  font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1f3b53;
  min-height: 100vh;
  background:
    radial-gradient(120% 70% at 10% -10%, rgba(59, 130, 246, 0.13), transparent 60%),
    radial-gradient(110% 70% at 95% 0%, rgba(20, 184, 166, 0.09), transparent 60%),
    linear-gradient(180deg, #f4f9ff 0%, #f8fbff 36%, #f5f8fc 100%);
}

:deep(.ant-tabs-nav) {
  margin-bottom: 10px;
  padding: 0 8px;
}

.page-shell {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.onboarding-loading-shell {
  min-height: calc(100vh - 84px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.onboarding-loading-card {
  width: min(560px, 100%);
  padding: 42px 34px;
  text-align: center;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
    radial-gradient(100% 100% at 50% 0%, rgba(59, 130, 246, 0.12), transparent 52%),
    radial-gradient(100% 100% at 50% 100%, rgba(14, 165, 233, 0.08), transparent 48%),
    #ffffff;
  box-shadow: 0 24px 58px rgba(15, 23, 42, 0.08);
}

.loader-badge {
  position: relative;
  width: 74px;
  height: 74px;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(248, 250, 252, 0.2) 34%, rgba(239, 68, 68, 0.12) 35%, rgba(239, 68, 68, 0.03) 70%, transparent 72%);
}

.loader-heart {
  position: relative;
  z-index: 1;
  font-size: 34px;
  line-height: 1;
  color: #e11d48;
  text-shadow:
    0 0 0 rgba(244, 63, 94, 0.24),
    0 0 18px rgba(244, 63, 94, 0.16);
  animation: loaderBeat 1.05s ease-in-out infinite;
}

.loading-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.onboarding-loading-card h2 {
  margin: 0 0 10px;
  font-size: 28px;
  line-height: 1.1;
  color: #0f172a;
}

.loading-copy {
  margin: 0 auto;
  max-width: 420px;
  font-size: 15px;
  line-height: 1.65;
  color: #475569;
}

.loading-dots {
  margin-top: 14px;
  display: inline-flex;
  gap: 6px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.32);
  animation: dotPulse 1.2s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.panel-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.23);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.045);
}

.form-card {
  padding: 10px 12px 8px;
}

.form-card-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 4px;
  min-height: 42px;
}

.form-card-logo {
  width: 184px;
  max-width: 46%;
  height: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 2px 6px rgba(30, 64, 175, 0.12));
}

.topOverviewRow {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(360px, 1fr);
  gap: 10px;
  align-items: start;
}

.userScoreCard {
  padding: 0;
  overflow: hidden;
}

.guidance-section {
  padding: 20px;
  background: #f8fbff;
  border-bottom: 1px solid #e6effb;
  height: auto;
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
  box-shadow: 0 0 0 rgba(114, 46, 209, 0.4);
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
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #722ed1;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  border-left: 6px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 110px;
}

.analysis-text h4 {
  font-size: 15px;
  margin-bottom: 4px;
}

.risk-advice {
  font-size: 12px;
  margin: 0;
  opacity: 0.9;
}

.score-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #722ed1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  margin-right: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3);
  font-size: 18px;
}

.score-circle-healthy {
  background-color: #52c41a !important;
}

.score-circle-risk {
  background-color: #ff4d4f !important;
}

.score-circle-moderate {
  background-color: #faad14 !important;
}

.action-hint {
  margin-top: 8px;
  font-size: 11px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.4);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.highlight {
  text-decoration: underline;
  color: inherit;
}

.healthy-border {
  border-left-color: #52c41a !important;
  background: #f6ffed !important;
  color: #389e0d !important;
}

.warning-border {
  border-left-color: #faad14 !important;
  background: #fffbe6 !important;
  color: #d48806 !important;
}

.risk-border {
  border-left-color: #ff4d4f !important;
  background: #fff1f0 !important;
  color: #cf1322 !important;
}

.none-border {
  border-left-color: #cbd5e1 !important;
  background: #f8fafc !important;
  color: #64748b !important;
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
  height: 65px;
}

.status-badge:hover {
  transform: translateY(-2px);
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

.point-tag {
  position: absolute;
  top: -8px;
  right: -5px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: #fff;
  font-weight: 900;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pos {
  background: #52c41a;
}

.neg {
  background: #ff4d4f;
}

.normal {
  background: #f6ffed;
  border-color: #b7eb8f;
  color: #389e0d;
}

.warning {
  background: #fffbe6;
  border-color: #ffe58f;
  color: #d48806;
}

.danger {
  background: #fff1f0;
  border-color: #ffa39e;
  color: #cf1322;
}

.none {
  background: #fafafa;
  color: #bfbfbf;
}

.topFilterRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.topFilterContent {
  flex: 1;
  min-width: 0;
}

.topActions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clearAllBtn {
  border-radius: 10px;
  border-color: #bfdbfe;
  color: #1d4ed8;
  background: #f8fbff;
  font-weight: 600;
}

.clearAllBtn:hover {
  border-color: #93c5fd;
  color: #1e40af;
  background: #f0f7ff;
}

.rangePart {
  width: 100%;
  height: 440px;
  min-height: 440px;
  padding: 8px 8px 6px;
}

.rightPart {
  min-height: 440px;
  padding: 8px;
}

.selection-narrative {
  margin: 14px 14px 12px;
  border-left: 4px solid #2563eb;
  border-radius: 10px;
  padding: 10px 12px;
  background: #ffffff;
  font-size: 13px;
  line-height: 1.6;
  color: #475569;
}

.selection-narrative p {
  margin: 0;
}

.twoContainer {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: stretch;
  gap: 10px;
  justify-content: space-around;
}

.radarPart {
  width: 48%;
  height: 640px;
  min-height: 0;
}

.summaryPart {
  width: 48%;
  height: 640px;
  min-height: 0;
}

@media (max-width: 1260px) {
  .topOverviewRow {
    grid-template-columns: 1fr;
  }

  .status-badge-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .rangePart,
  .rightPart {
    height: 440px;
    min-height: 440px;
  }
}

@media (max-width: 900px) {
  .form-card-logo {
    width: 154px;
    max-width: 58%;
  }

  .topFilterRow {
    flex-direction: column;
    align-items: stretch;
  }

  .topActions {
    justify-content: flex-end;
  }

  .status-badge-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .twoContainer {
    flex-direction: column;
    gap: 12px;
  }

  .radarPart,
  .summaryPart {
    width: 100%;
    height: 560px;
  }

  .onboarding-loading-card {
    padding: 32px 24px;
  }
}

@media (max-width: 640px) {
  .form-card-logo {
    width: 132px;
    max-width: 72%;
  }

  .status-badge-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes loaderBeat {
  0%, 100% { transform: scale(0.94); }
  22% { transform: scale(1.1); }
  40% { transform: scale(0.98); }
  62% { transform: scale(1.05); }
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.35; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(114, 46, 209, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(114, 46, 209, 0); }
  100% { box-shadow: 0 0 0 0 rgba(114, 46, 209, 0); }
}
.red { color: #cf1322; }
.blue { color: #096dd9; }
</style>
