<template>
  <div>
    RadarPart
    <a-button @click="sendData">test</a-button>        
    <div ref="chart" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import {ref, onMounted, onBeforeUnmount} from 'vue';
const props = defineProps({
  tableData: Array,
})
const emit = defineEmits(['updateCount'])
const sendData = () => {
  // 触发事件
  emit('updateCount', 100);
};
console.log(props.tableData)
    const chart = ref(null);
    let myChart = null;

    onMounted(() => {
      // 3. 初始化
      myChart = echarts.init(chart.value);
      // 4. 配置图表
      var option;

      option = {
        title: {
          text: 'Basic Radar Chart'
        },
        legend: {
          data: ['Allocated Budget', 'Actual Spending']
        },
        radar: {
          // shape: 'circle',
          indicator: [
            { name: 'Sales', max: 6500 },
            { name: 'Administration', max: 16000 },
            { name: 'Information Technology', max: 30000 },
            { name: 'Customer Support', max: 38000 },
            { name: 'Development', max: 52000 },
            { name: 'Marketing', max: 25000 }
          ]
        },
        series: [
          {
            name: 'Budget vs spending',
            type: 'radar',
            data: [
              {
                value: [4200, 3000, 20000, 35000, 50000, 18000],
                name: 'Allocated Budget'
              },
              {
                value: [5000, 14000, 28000, 26000, 42000, 21000],
                name: 'Actual Spending'
              }
            ]
          }
        ]
      };
      option && myChart.setOption(option);
      // 5. 响应式调整
      window.addEventListener('resize', () => myChart.resize());
    });

    onBeforeUnmount(() => {
      // 6. 销毁实例
      if (myChart) {
        myChart.dispose();
        window.removeEventListener('resize', () => myChart.resize());
      }
    });
</script>

<style lang="scss" scoped>

</style>