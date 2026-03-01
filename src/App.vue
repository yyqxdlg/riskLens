<template>
    <a-tabs v-model:activeKey="activeKey" class="app-tabs">
      <a-tab-pane key="1">
        <template #tab>
          <span>
            <apple-outlined/>
            Main
          </span>
        </template>
        <div class="page-shell">
          <section class="panel-card form-card">
            <UserForm
              :clearSignal="clearSignal"
              @updateFilters="onFormFiltersUpdate"
              @updateUserInputs="onUserInputsUpdate"
              @openTimeMachine="showOlderModal"
            />
          </section>
          <section class="panel-card topFilterRow">
            <div class="topFilterContent">
              <TopFilter :activeFilters="activeFilters"></TopFilter>
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
                @updateFilters="onRangeFiltersUpdate"
              />
            </section>

            
          </div>
          <section class="panel-card rightPart">
              <div class="twoContainer">
                <div class="radarPart">
                  <RadarPart :processObject="processArray" :userInputs="userInputs"></RadarPart>
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
            <BulbTwoTone />
            About
          </span>
        </template>
        Tab 2
      </a-tab-pane>
      <a-tab-pane key="3">
        <template #tab>
          <span>
            <android-outlined />
            Team
          </span>
        </template>
        Tab 2
      </a-tab-pane>
    </a-tabs>
  
  
  
  <!-- <router-view></router-view> -->
</template>

<script setup>
// import DashBoard from './components/DashBoard.vue'
import {ref, onMounted, watch} from 'vue'
import { AppleOutlined, AndroidOutlined ,BulbTwoTone} from '@ant-design/icons-vue';
import UserForm from './components/UserForm.vue'
import RadarPart from './components/RadarPart.vue'
import RangePart from './components/RangePart.vue'
import SummaryPart from './components/SummaryPart.vue'
import TopFilter from './components/TopFilter.vue';
import groupData from '@/assets/riskless_data_all_years.json';
import TimeMachine from './components/TimeMachine.vue';
  
  const rawGroupData = ref([])

  const emptyFilterMap = () => ({
    ageGroup: [],
    bmiGroup: [],
    bpGroup: [],
    lipidGroup: [],
    diabetesLabel: []
  })
 
  const activeKey = ref('1');

  const activeFilters = ref(emptyFilterMap());
  const rangeFilters = ref(emptyFilterMap());
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

  const clearAllFilters = () => {
    formFilters.value = emptyFilterMap();
    rangeFilters.value = emptyFilterMap();
    userInputs.value = emptyUserInputs();
    rebuildActiveFilters();
    clearSignal.value += 1;
  };

  const processData = () => {
    const filters = activeFilters.value;
    const activeKeys = Object.keys(filters).filter(key => filters[key].length > 0);
   
    const result = {
      selectedCVD: [],
      selectedNoCVD: [],
      unselectedCVD: [],
      unselectedNoCVD: []
    };
    rawGroupData.value.forEach(item => {
     
      const isMatched = activeKeys.every(key => {
        return filters[key].includes(item.displayGroups[key]);
      });

     
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
}

.radarPart {
  width: 50%;
  height: 800px;
  min-height: 0;
}

.summaryPart {
  width: 50%;
  height: 800px;
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
}
</style>
