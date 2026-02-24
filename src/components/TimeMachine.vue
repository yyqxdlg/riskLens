<template>
  <div>
     <a-modal v-model:open="open" width="800px"  title="Health Time Machine"  :footer="null" @cancel="closeModal">
        <div ref="timeMachine" style="height: 600px;" ></div>
      </a-modal>
            
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import * as echarts from 'echarts';


  const props = defineProps({  
   
    modalState: Object,
    rawGroupData: Array,

  })
  console.log(props)
  const open = ref(props.modalState.open)
  const userAge = ref(props.modalState.userAge)
  const otherInfo = ref(props.modalState.otherInfo)
  const tableData = ref(props.rawGroupData)
  const emit = defineEmits([ "colseTimeModal" ]);

  const closeModal = ()=>{
    open.value = false;
    emit('colseTimeModal')
  }

  const STANDARD_AGE_BINS = [
    { start: 0,  end: 18, label: '<18' },
    { start: 18, end: 20, label: '18-20' },
    { start: 20, end: 25, label: '20-25' },
    { start: 25, end: 30, label: '25-30' },
    { start: 30, end: 35, label: '30-35' },
    { start: 35, end: 40, label: '35-40' },
    { start: 40, end: 45, label: '40-45' },
    { start: 45, end: 50, label: '45-50' },
    { start: 50, end: 55, label: '50-55' },
    { start: 55, end: 60, label: '55-60' },
    { start: 60, end: 65, label: '60-65' },
    { start: 65, end: 70, label: '65-70' },
    { start: 70, end: 75, label: '70-75' },
    { start: 75, end: 80, label: '75-80' },
    { start: 80, end: 120, label: '80+' }
  ];
  
  
  const runGetOlderSimulation = (inputAge, currentFilters, allData) => {
    const age = Number(inputAge);
    

    const startIndex = STANDARD_AGE_BINS.findIndex(bin => age >= bin.start && age < bin.end);
    if (startIndex === -1) return [];
    const targetBins = STANDARD_AGE_BINS.slice(startIndex);

    // 多维过滤逻辑：支持空值（即不过滤）
    const peerGroup = allData.filter(item => {
      const checkFilter = (key) => {
        const filterValue = currentFilters[key];
        // 如果 filterValue 为空数组或未定义，则返回 true 表示该维度匹配所有数据
        if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
          return true;
        }
        // 否则，检查数据项是否在选中的过滤条件中
        return Array.isArray(filterValue) 
          ? filterValue.includes(item.displayGroups[key]) 
          : item.displayGroups[key] === filterValue;
      };

      return (
        checkFilter('bmiGroup') &&
        checkFilter('bpGroup') &&
        checkFilter('lipidGroup') &&
        checkFilter('diabetesLabel')
      );
    });

    // 动态分组并剔除 N=0 的无效区间 [cite: 109, 112]
    const result = [];
    targetBins.forEach(bin => {
      const subset = peerGroup.filter(item => item.rawValues.age >= bin.start && item.rawValues.age < bin.end);
      if (subset.length > 0) {
        const cvdCount = subset.filter(i => i.rawValues.CVD === 1).length;
        const total = subset.length;
        result.push({
          label: bin.label,
          cvd: cvdCount,
          healthy: total - cvdCount,
          rate: ((cvdCount / total) * 100).toFixed(1)
        });
      }
    });
    return result;
  };
  const timeMachine = ref(null);
  let myChart = null;
  const renderOlderChart = ( simulationData) => {
    if (!timeMachine.value) return;

    // 1. 如果已经有实例了，先销毁它
    if (myChart) {
      myChart.dispose(); 
      myChart = null; // 确保引用清空
    }
    // 3. 初始化
    myChart = echarts.init(timeMachine.value);
    
    const animationStep = 400; 

    const option = {
      animation: true,
      animationDuration: 1200,
      tooltip: { 
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: simulationData.map(d => d.label)
      },
      yAxis: [
        { type: 'value', name: 'Count' },
        { type: 'value', name: 'Risk (%)', max: 100 }
      ],
      series: [
        {
          name: 'CVD Group',
          type: 'bar',
          stack: 'aging',
          itemStyle: { color: '#ff4d4f' },
          animationDelay: (idx) => idx * animationStep,
          data: simulationData.map(d => d.cvd)
        },
        {
          name: 'Healthy Group',
          type: 'bar',
          stack: 'aging',
          itemStyle: { color: '#1890ff' },
          animationDelay: (idx) => idx * animationStep + 100,
          data: simulationData.map(d => d.healthy)
        },
        {
          name: 'Risk Trend',
          type: 'line',
          yAxisIndex: 1,
          itemStyle: { color: '#722ed1' },
          symbol: 'diamond',
          symbolSize: 10,
          animationDelay: (idx) => idx * animationStep + 200,
          data: simulationData.map(d => d.rate)
        }
      ]
    };

    myChart.setOption(option, true); 
  };
  const filterData = ref(null)
  onMounted(()=>{
    // open.value = 
   filterData.value = runGetOlderSimulation(userAge.value, otherInfo.value,tableData.value)
   renderOlderChart(filterData.value)
  })

</script>

<style lang="scss" scoped>

</style>