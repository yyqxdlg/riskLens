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
              <RangePart :tableData="tableData"></RangePart>
            </div>
            <div class="radarPart">
              <RadarPart :tableData="tableData" @updateCount="updateCount"></RadarPart>
            </div>
            <div class="summaryPart">
              <SummaryPart :tableData="tableData"></SummaryPart>
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
import {ref, onMounted} from 'vue'
import { AppleOutlined, AndroidOutlined ,BulbTwoTone} from '@ant-design/icons-vue';
import UserForm from './components/UserForm.vue'
import RadarPart from './components/RadarPart.vue'
import RangePart from './components/RangePart.vue'
import SummaryPart from './components/SummaryPart.vue'
import rawData from '@/assets/nhanes_cvd_risk_2021_2023.json';

  const tableData = ref([]);

  
 
  const activeKey = ref('1');

  const updateCount = (value) => {
    console.log(value, '111111')
  };
   onMounted(() => {
    tableData.value = rawData;
    console.log('数据已就绪:', tableData.value);
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
.radarPart{
  width: 30%;
}
.summaryPart{
  width: 30%;
}
</style>
