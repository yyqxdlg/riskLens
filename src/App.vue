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
           <UserForm></UserForm>  
          </div>
          <a-flex>
            <div class="rangePart">
              <RangePart :rawGroupData="rawGroupData"></RangePart>
            </div>

            <div class="rightPart">
              <div>
                <TopFilter :activeFilters="activeFilters"></TopFilter>
              </div>
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

  
  const rawGroupData = ref([])

 
  const activeKey = ref('1');

  const activeFilters = ref({
    ageGroup: ['Middle-Aged', 'Senior', 'Elderly'],   // 可能包含: {"Middle-Aged", "Senior"}
    bmiGroup: ['Obese I'],   // 可能包含: {"Obese I"}
    bpGroup: ['Normal', 'Elevated'],     // 
    lipidGroup: ['Desirable', 'Borderline', 'Extreme'],
    diabetesLabel: ['Diabetic'],
  });

  const processArray = ref(null)

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
  })
  onMounted(() => {
    
    rawGroupData.value = groupData
   
    console.log('group数据已就绪:', rawGroupData.value);
    processArray.value = processData();
    console.log(processArray.value, 'rocessArray.value')

    setTimeout(()=>{
      activeFilters.value = {
        ageGroup: [],   // 可能包含: {"Middle-Aged", "Senior"}
        bmiGroup: [],   // 可能包含: {"Obese I"}
        bpGroup: [],     // 
        lipidGroup: [],
        diabetesLabel: [],
      };
    }, 30000)
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
  width: 40%;
}
.rightPart{
  width: 60%;
  
}
.twoContainer{
  display: flex;
  width: 100%;
}
.radarPart{
  width: 50%;
}
.summaryPart{
  width: 50%;
}
</style>
