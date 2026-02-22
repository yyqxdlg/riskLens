<template>
  <div>
    <!-- RadarPart -->
    <!-- <a-button @click="sendData">test</a-button>         -->
    <div ref="redarChart" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script setup>
  import * as echarts from 'echarts';
  import {ref, onMounted, onBeforeUnmount, watch} from 'vue';
  const props = defineProps({  
    processObject: Object,
  })
  const redarChart = ref(null);
  // const emit = defineEmits(['updateCount'])
  // const sendData = () => {
  //   // 触发事件
  //   emit('updateCount', 100);
  // };

  const calculateRadarData = () => {
    // 定义维度，必须与 radar.indicator 顺序一致
    const metrics = ['age', 'bmi', 'bp', 'lipids','diabetes']; 

    const getAverage = (arr) => {
      if (arr.length === 0) return [0, 0, 0, 0, 0];
        return metrics.map(key => {
          const sum = arr.reduce((acc, item) => acc + item.rawValues[key], 0);
          return (sum / arr.length).toFixed(2);
        });
      };

    // 1. 获取所有个体的原始数据（用于淡色背景）
    const individualCVD = processArray.value.selectedCVD.map(item => metrics.map(k => item.rawValues[k]));
    const individualNoCVD = processArray.value.selectedNoCVD.map(item => metrics.map(k => item.rawValues[k]));

    // 2. 计算平均值
    const avgCVD = getAverage(processArray.value.selectedCVD);
    const avgNoCVD = getAverage(processArray.value.selectedNoCVD);

    // 3. 假设这是当前用户自己的数据（从某处获取）
    const userData = [45, 28, 135, 210,1]; 

    return { individualCVD, individualNoCVD, avgCVD, avgNoCVD, userData };
  };

  let myChart = null;
  const createRadarChart = () => {
    const data = calculateRadarData();
    if (!redarChart.value) return;

    // 1. 如果已经有实例了，先销毁它
    if (myChart) {
      myChart.dispose(); 
      myChart = null; // 确保引用清空
    }
    myChart = echarts.init(redarChart.value);

    const option = {
      title: { text: 'Risk Factor Comparison' },
      tooltip: { trigger: 'item' },
      legend: {
        data: ['CVD Avg', 'Healthy Avg', 'My Data', 'CVD Individuals','Healthy Individuals'],
        bottom: 0
      },
      radar: {
        // 这里的 max 建议根据你数据集的物理极限设置
        indicator: [
          { name: 'Age',  },
          { name: 'BMI',  },
          { name: 'Systolic BP',  },
          { name: 'Cholesterol',  },
          { name: 'Diatetes', max: 1 }
        ],
        shape: 'circle',
        splitNumber: 5
      },
      series: [
        // --- 第一层：所有 CVD 个体 (淡红色线) ---
        {
          name: 'CVD Individuals',
          type: 'radar',
          silent: true, // 不触发鼠标事件，提升性能
          lineStyle: { width: 1, opacity: 0.05 }, // 极低透明度
          itemStyle: { opacity: 1 }, // 隐藏圆点
          data: data.individualCVD,
          symbol: 'none',
          color: '#ff4d4f'
        },
        // --- 第二层：所有 Healthy 个体 (淡蓝色线) ---
        {
          name: 'Healthy Individuals',
          type: 'radar',
          silent: true,
          lineStyle: { width: 1, opacity: 0.05 },
          itemStyle: { opacity: 1 },
          data: data.individualNoCVD,
          symbol: 'none',
          color: '#1890ff'
        },
        // --- 第三层：重点展示的数据 (平均值与用户) ---
        {
          name: 'Averages and User',
          type: 'radar',
          data: [
            {
              value: data.avgCVD,
              name: 'CVD Avg',
              lineStyle: { width: 3, type: 'dashed' }, // 虚线
              areaStyle: { color: 'rgba(255, 77, 79, 0.2)' } // 淡色填充
            },
            {
              value: data.avgNoCVD,
              name: 'Healthy Avg',
              lineStyle: { width: 3, type: 'dashed' },
              areaStyle: { color: 'rgba(24, 144, 255, 0.2)' }
            },
            {
              value: data.userData,
              name: 'My Data',
              lineStyle: { width: 4, color: '#722ed1' }, // 鲜亮的紫色
              itemStyle: { color: '#722ed1', borderWidth: 2 },
              areaStyle: { color: 'rgba(114, 46, 209, 0.4)' },
              label: { show: true, formatter: (p) => p.value }
            }
          ]
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          orient: 'vertical', // 如果想上下缩放高度
          yAxisIndex: 0
        }
      ],
    };

    myChart.setOption(option, true);
  };
  watch(() => props.processObject, (newValue)=>{
   
    if(newValue){
      processArray.value = props.processObject
      console.log('4444444', newValue)
      createRadarChart()
    }
  },{ deep: true })
  const processArray = ref({
    selectedCVD: [],
    selectedNoCVD: [],
  })
  onMounted(() => {
   setTimeout(()=>{
      processArray.value = props.processObject
      createRadarChart();
      
    }, 1000)
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