<template>
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="1">
        <template #tab>
          <span>
            <apple-outlined/>
            Home
          </span>
        </template>
        <div>
          <div class="uesrForm">
           <UserForm :clearSignal="clearSignal" @updateFilters="onFormFiltersUpdate"></UserForm>
          </div>
          <div class="topFilterRow">
            <div class="topFilterContent">
              <TopFilter :activeFilters="activeFilters"></TopFilter>
            </div>
            <div class="topActions">
              <a-button class="clearAllBtn" @click="clearAllFilters">Clear All Filters</a-button>
              <a-button class="timeMachineBtn" @click="showOlderModal">Health Time Machine</a-button>
            </div>
          </div>
          <a-flex class="mainChartsRow">
            <div class="rangePart">
              <RangePart
                :rawGroupData="rawGroupData"
                :contextFilters="formFilters"
                :clearSignal="clearSignal"
                @updateFilters="onRangeFiltersUpdate"
              />
            </div>

            <div class="rightPart">
              <div class="twoContainer">
                <div class="radarPart">
                  <RadarPart :processObject="processArray" ></RadarPart>
                </div>
                <div class="summaryPart">
                  <SummaryPart :processObject="processArray" ></SummaryPart>
                </div>
              </div>
            </div>
            
          </a-flex>
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
import groupData from '@/assets/riskless_data.json';
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

  const processArray = ref(null)

  const dedupe = (arr = []) => [...new Set(arr)];

  const mergeFiltersByIntersection = (fromRange = [], fromForm = []) => {
    const left = dedupe(fromRange);
    const right = dedupe(fromForm);

    if (!left.length && !right.length) return [];
    if (!left.length) return right;
    if (!right.length) return left;
    const inter = left.filter(item => right.includes(item));
    return inter;
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
    formFilters.value = { ...formFilters.value, ...val };
    rebuildActiveFilters();
  };

  const clearAllFilters = () => {
    formFilters.value = emptyFilterMap();
    rangeFilters.value = emptyFilterMap();
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
      } else {
        if (hasCVD) result.unselectedCVD.push(item);
        else result.unselectedNoCVD.push(item);
      }
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
  const showOlderModal = () => {
    modalState.value = {
      open: true,
      userAge: 47,
      otherInfo: {

      }

    }
    open.value = true
  }
  const colseTimeModal = () => {
    open.value = false
    
  }
  onMounted(() => {
    
    rawGroupData.value = groupData
   
    rebuildActiveFilters();
    processArray.value = processData();
   })
  

</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.rangePart{
  width: 45%;
  height: 400px;
}
.rightPart{
  width: 55%;
  height: 400px;
  display: flex;
  align-items: stretch;
}
.mainChartsRow{
  height: 400px;
  align-items: stretch;
}
.topFilterRow{
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}
.topFilterContent{
  flex: 1;
  min-width: 0;
}
.topActions{
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.clearAllBtn{
  border-radius: 6px;
}
.timeMachineBtn{
  border-radius: 6px;
}
.twoContainer{
  display: flex;
  width: 100%;
  height: 100%;
  align-items: stretch;
}
.radarPart{
  width: 50%;
  height: 100%;
}
.summaryPart{
  width: 50%;
  height: 100%;
}
</style>
