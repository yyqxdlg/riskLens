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
          <section class="panel-card form-card">
            <UserForm
              :clearSignal="clearSignal"
              :initialFilters="formFilters"
              :initialValues="userInputs"
              @updateFilters="onFormFiltersUpdate"
              @updateUserInputs="onUserInputsUpdate"
              @openTimeMachine="showOlderModal"
            />
          </section>
          <section class="panel-card topFilterRow">
            <div class="topFilterContent">
              <TopFilter :activeFilters="activeFilters" @remove="handleTopFilterRemove"></TopFilter>
            </div>
            <div class="topActions">
              <a-button class="clearAllBtn" @click="clearAllFilters">Clear All Filters</a-button>
            </div>
          </section>
          <div class="mainChartsRow">
            <section class="panel-card rangePart">
              <RangePart
                :rawGroupData="rawGroupData"
                :contextFilters="formFilters"
                :userInputs="userInputs"
                :clearSignal="clearSignal"
                :clearRequest="clearFilterRequest"
                @updateFilters="onRangeFiltersUpdate"
                @updateSelection="onRangeSelectionUpdate"
              />
            </section>

            
          </div>
          <section class="panel-card rightPart">
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
          <TimeMachine v-if="open" :rawGroupData="rawGroupData" :modalState="modalState"  @colseTimeModal="colseTimeModal"></TimeMachine>
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
import {ref, onMounted, watch} from 'vue'
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
  const clearSignal = ref(0);
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
    rangeFilters.value = { ...rangeFilters.value, ...val };
    rebuildActiveFilters();
  };

  const onRangeSelectionUpdate = (rowIds) => {
    rangeSelectedRowIds.value = Array.isArray(rowIds) ? rowIds : null;
  };

  const onFormFiltersUpdate = (val) => {
    const nextForm = { ...formFilters.value, ...val };
    const nextRange = { ...rangeFilters.value };

    Object.keys(nextForm).forEach((key) => {
      if ((nextForm[key] || []).length > 0) {
        nextRange[key] = []
      }
    });

    formFilters.value = nextForm;
    rangeFilters.value = nextRange;
    rebuildActiveFilters();
  };

  const onUserInputsUpdate = (val) => {
    userInputs.value = { ...userInputs.value, ...val };
  };

  const clearInputForFilterKey = (key) => {
    const inputKeyMap = {
      ageGroup: 'age',
      bmiGroup: 'bmi',
      bpGroup: 'sbp',
      lipidGroup: 'chol',
      diabetesLabel: 'diabetes'
    }
    const inputKey = inputKeyMap[key]
    if (!inputKey) return
    userInputs.value = {
      ...userInputs.value,
      [inputKey]: null
    }
  }

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
    clearInputForFilterKey(key)
    rebuildActiveFilters()
    clearFilterRequest.value = {
      token: clearFilterRequest.value.token + 1,
      key
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
    clearSignal.value += 1
    window.setTimeout(() => {
      isDashboardBooting.value = false
    }, 980)
  }

  const clearAllFilters = () => {
    formFilters.value = emptyFilterMap();
    rangeFilters.value = emptyFilterMap();
    rangeSelectedRowIds.value = null;
    userInputs.value = emptyUserInputs();
    rebuildActiveFilters();
    clearSignal.value += 1;
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
  watch(() => activeFilters.value, () => {
    processArray.value = processData();
  }, { deep: true })

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

  const showOlderModal = () => {
    modalState.value = {
      open: true,
      userAge: getPreferredUserAge(),
      otherInfo: { ...activeFilters.value }

    }
    open.value = true
  }
  const colseTimeModal = () => {
    open.value = false
    
  }

  watch(
    () => [userInputs.value.age, activeFilters.value],
    () => {
      if (!open.value) return
      modalState.value = {
        ...modalState.value,
        open: true,
        userAge: getPreferredUserAge(),
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
  margin-bottom: 12px;
  padding: 0 14px;
}

.page-shell {
  width: calc(100vw - 24px);
  max-width: none;
  margin: 0 auto;
  padding: 0 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
}

.form-card {
  padding: 12px 14px 10px;
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

.mainChartsRow {
  display: block;
  width: 100%;
  min-height: 456px;
}

.rangePart {
  width: 100%;
  height: 456px;
  min-height: 456px;
  padding: 8px 8px 4px;
}

.rightPart {
  min-height: 456px;
  padding: 8px;
}

.twoContainer {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: stretch;
  gap: 6px;
  justify-content: space-around;
}

.radarPart {
  width: 48%;
  height: 700px;
  min-height: 0;
}

.summaryPart {
  width: 48%;
  height: 700px;
  min-height: 0;
}

@media (max-width: 1260px) {
  .mainChartsRow {
    grid-template-columns: 1fr;
  }

  .rangePart,
  .rightPart {
    height: 460px;
    min-height: 460px;
  }
}

@media (max-width: 900px) {
  .topFilterRow {
    flex-direction: column;
    align-items: stretch;
  }

  .topActions {
    justify-content: flex-end;
  }

  .twoContainer {
    flex-direction: column;
    gap: 12px;
  }

  .radarPart,
  .summaryPart {
    width: 100%;
    height: 50%;
  }

  .onboarding-loading-card {
    padding: 32px 24px;
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
</style>
