<template>
  <div class="summary-root">
    <div ref="summaryBar" class="summary-canvas"></div>
  </div>
</template>

<script setup>
  // import { setTimeout } from 'core-js';
  import * as echarts from 'echarts';
  import {ref, onMounted, onBeforeUnmount, watch} from 'vue';
  const props = defineProps({  
   
    processObject: Object,

  })
  
  const summaryBar = ref(null);
  let myChart = null;

  const createSummaryBar = () => {
    if (!summaryBar.value) return;

    // 1. 如果已经有实例了，先销毁它
    if (myChart) {
      myChart.dispose(); 
      myChart = null; // 确保引用清空
    }
    // 3. 初始化
    myChart = echarts.init(summaryBar.value);
    // 4. 配置图表
    const sCVD = processArray.value.selectedCVD.length;
    const uCVD = processArray.value.unselectedCVD.length;
    const sNoCVD = processArray.value.selectedNoCVD.length;
    const uNoCVD = processArray.value.unselectedNoCVD.length;
    var option;

    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
        // params[0] 是 Selected 系列, params[1] 是 Unselected 系列
        const selected = params[0].value;
        const unselected = params[1].value;
        const total = selected + unselected;
        const percentage = total > 0 ? ((selected / total) * 100).toFixed(1) : 0;
        const colorCircle = (color) => `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;

        return `
          <div style="font-weight:bold; margin-bottom:5px;">${params[0].name} Group</div>
          ${colorCircle(params[0].color)} <b>Selected:</b> ${selected} <br/>
          ${colorCircle('#d9d9d9')} <b>Unselected:</b> ${unselected} <br/>
          <hr style="margin: 5px 0; border:0; border-top:1px solid #eee;"/>
          <b>Total:</b> ${total} <br/>
          <b>Rate:</b> ${percentage}%
        `;
      }
      },
      grid: {
        top: '15%',
        left: '10%',
        right: '10%',
        bottom: '10%',
        containLabel: true
      },
      title: {
        text: 'subGroup Distribution'
      },
      legend: {
        data: ['CVD-Selected', 'non-CVD-Selected', 'Unselected']
      },
      xAxis: [
        {
          type: 'category',
          data: ['CVD', 'non-CVD']
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: [
        {
          name: 'Selected',
          type: 'bar',
          stack: 'all',
          itemStyle: { 
           color: (params) => {
            // params.dataIndex === 0 是 CVD 柱子，1 是 non-CVD 柱子
            return params.dataIndex === 0 ? '#ff4d4f' : '#1890ff';
          }
          },
          data: [sCVD, sNoCVD], // [CVD位置的值, nonCVD位置的值],
          label:{
            show:true,
            position:'top',
            formatter: (params) => params.value > 0 ? params.value : ''
          }
        },
        {
          name: 'Unselected',
          type: 'bar',
          stack: 'all',
          itemStyle: { color: '#d9d9d9' }, // 灰色
          data: [uCVD, uNoCVD],
          label:{
            show:true,
            position:'top',
            formatter: (params) => params.value > 0 ? params.value : ''
          }
        },
        {
        name: 'CVD-Selected',
        type: 'bar',
        stack: 'all',
        itemStyle: { color: '#ff4d4f' },
        data: [] // 不填数据，不影响画图
      },
      {
        name: 'non-CVD-Selected',
        type: 'bar',
        stack: 'all',
        itemStyle: { color: '#1890ff' },
        data: []
      }
      
      ]
    };
    option &&myChart.setOption(option, true);
    // 5. 响应式调整
  }


  const processArray = ref({
      selectedCVD: [],
      selectedNoCVD: [],
      unselectedCVD: [],
      unselectedNoCVD: []
    })

  watch(() => props.processObject, (newValue)=>{
   
    if(newValue){
      processArray.value = props.processObject
      createSummaryBar()
    }
  },{ deep: true })
  onMounted(() => {
    setTimeout(()=>{
      processArray.value = props.processObject
      createSummaryBar();
      
    }, 1000)
   
  });

  onBeforeUnmount(() => {
    // 6. 销毁实例
    if (myChart) {
     myChart.dispose();
      
    }
    });

  
</script>

<style  scoped>
.summary-root {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.summary-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
