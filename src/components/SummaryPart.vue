<template>
  <div class="summary-container">
    <div class="guidance-section">
      <div class="header-row">
        <span class="pulse-icon"></span>
        <h3 class="section-title">Live Analysis Guidance</h3>
      </div>

      <div class="analysis-box">
    
        
        <!-- <div class="dynamic-narrative">
          <p v-if="totalSelected > 0">
            You have isolated a subgroup of <strong>{{ totalSelected.toLocaleString() }}</strong> individuals. 
            The <strong>Top Bar</strong> (Selected Group) shows the risk composition of this specific group. 
            Compare it to the <strong>Bottom Bar</strong> (Background) to see if your selected factors (like BMI or Age) 
            increase the concentration of Cardiovascular Disease (CVD).
          </p>
          <p v-else>
            No matching peers found for these criteria. Please adjust your sliders or categories for peer-group analysis.
          </p>
        </div> -->
        <div class="dynamic-narrative" :style="{ borderLeftColor: prevalenceDiff.isHigher ? '#ff4d4f' : '#52c41a' }">
          <p v-if="totalSelected > 0">
            In this subgroup of <strong>{{ totalSelected.toLocaleString() }}</strong> individuals, 
            the CVD prevalence is <strong class="red">{{ prevalenceRate }}%</strong>.
            
            <span v-if="prevalenceDiff.isEqual">
              This <strong>matches</strong> the total background prevalence ({{ backgroundPrevalence }}%).
            </span>
            <span v-else>
              Compared to the overall population ({{ backgroundPrevalence }}%), this group shows a 
              <strong :class="prevalenceDiff.isHigher ? 'red' : 'green'">
                {{ prevalenceDiff.val }}% {{ prevalenceDiff.isHigher ? 'increase' : 'decrease' }}
              </strong> 
              in risk concentration.
            </span>
          </p>
          <p v-else>
            No matching peers found. Please adjust your filters to begin the comparative analysis.
          </p>
        </div>
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="label">Subgroup CVD</span>
            <span class="value red">{{ selectedCVDCount }}</span>
          </div>
          <div class="metric-card">
            <span class="label">Subgroup Healthy</span>
            <span class="value blue">{{ selectedHealthyCount }}</span>
          </div>
          <div class="metric-card">
            <span class="label">Prevalence Rate</span>
            <span class="value purple">{{ prevalenceRate }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div ref="donutChartRef" class="chart-canvas"></div>
    
    <div class="chart-legend-hint">
      <small>* Top Bar: Selected Subgroup | Bottom Bar: Total Background Population</small>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';

const props = defineProps({
  processObject: {
    type: Object,
    default: () => ({
      selectedCVD: [],
      selectedNoCVD: [],
      unselectedCVD: [],
      unselectedNoCVD: []
    })
  },

});

const donutChartRef = ref(null);
let myChart = null;

// Computed Statistics
const selectedCVDCount = computed(() => {
  console.log(props, 'props')
  return props.processObject ? (props.processObject?.selectedCVD || []).length : 0  
  }
) ;
const selectedHealthyCount = computed(() => props.processObject ?(props.processObject?.selectedNoCVD || []).length : 0);
const totalSelected = computed(() => selectedCVDCount.value + selectedHealthyCount.value);
const prevalenceRate = computed(() => {
  return totalSelected.value > 0 
    ? ((selectedCVDCount.value / totalSelected.value) * 100).toFixed(2) 
    : 0;
});

// const initChart = () => {
//   if (!donutChartRef.value) return;
//   if (myChart) myChart.dispose();

//   myChart = echarts.init(donutChartRef.value);

//   const sCVD = selectedCVDCount.value;
//   const sNo = selectedHealthyCount.value;
//   const uCVD = props.processObject?props.processObject.unselectedCVD.length :0;
//   const uNo = props.processObject?props.processObject.unselectedNoCVD.length : 0;

//   const option = {
//     tooltip: {
//       trigger: 'item',
//       formatter: '{a} <br/>{b}: <strong>{c}</strong> ({d}%)'
//     },
//     series: [
//       {
//         name: 'Inner: Selected Subgroup',
//         type: 'pie',
//         selectedMode: 'single',
//         radius: ['20%', '35%'],
//         label: {
//           position: 'inner',
//           fontSize: 10,
//           formatter: '{d}%',
//           color: '#fff'
//         },
//         labelLine: { show: false },
//         data: [
//           { value: sCVD, name: 'Selected CVD', itemStyle: { color: '#ff4d4f' } },
//           { value: sNo, name: 'Selected Healthy', itemStyle: { color: '#1890ff' } }
//         ]
//       },
//       {
//         name: 'Outer: Background Data',
//         type: 'pie',
//         radius: ['70%', '85%'],
//         itemStyle: { opacity: 0.3 }, // Faint background for context
//         label: {
//           formatter: '{b}: {c}\n{d}%',
//           fontSize: 11
//         },
//         data: [
//           { value: uCVD, name: 'Background CVD', itemStyle: { color: '#ff4d4f' } },
//           { value: uNo, name: 'Background Healthy', itemStyle: { color: '#1890ff' } }
//         ]
//       }
//     ]
//   };

//   myChart.setOption(option);
// };
const initChart = () => {
  if (!donutChartRef.value) return; 
  if (myChart) myChart.dispose();

  myChart = echarts.init(donutChartRef.value);

  // 1. 数据获取
  const sCVD = selectedCVDCount.value;
  const sNo = selectedHealthyCount.value;
  const uCVD = props.processObject ? (props.processObject.unselectedCVD?.length || 0) : 0;
  const uNo = props.processObject ? (props.processObject.unselectedNoCVD?.length || 0) : 0;

  const totalS = sCVD + sNo;
  const totalU = uCVD + uNo;

  const getP = (val, total) => total > 0 ? (val / total) * 100 : 0;

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let res = `<strong style="color: #333">${params[0].name}</strong><br/>`;
        params.forEach(item => {
          res += `${item.marker} ${item.seriesName}: <b>${item.data.raw.toLocaleString()}</b> (${item.value.toFixed(1)}%)<br/>`;
        });
        return res;
      }
    },
    legend: {
      data: [
        { name: 'CVD', itemStyle: { color: '#ff4d4f' } },   // 强制图例使用标准的红色
        { name: 'Healthy', itemStyle: { color: '#1890ff' } } // 强制图例使用标准的蓝色
      ],
      bottom: '5%',
      itemWidth: 14,
      itemHeight: 14
    },
    grid: {
      left: '20%', 
      right: '10%',
      top: '15%',
      bottom: '20%'
    },
    xAxis: {
      type: 'value',
      max: 100, 
      show: false 
    },
    yAxis: {
      type: 'category',
      data: ['Background', 'Selected Group'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontWeight: 'bold', color: '#595959' }
    },
    series: [
      {
        name: 'CVD',
        type: 'bar',
        stack: 'total',
        barWidth: 50,
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          formatter: (p) => `${p.data.raw}\n(${p.value.toFixed(1)}%)`
        },
        data: [
          // Background Row: 浅红
          { value: getP(uCVD, totalU), raw: uCVD, itemStyle: { color: 'rgba(255, 77, 79, 0.3)' } },
          // Selected Row: 标准红
          { value: getP(sCVD, totalS), raw: sCVD, itemStyle: { color: '#ff4d4f' } }
        ]
      },
      {
        name: 'Healthy',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          formatter: (p) => `${p.data.raw}\n(${p.value.toFixed(1)}%)`
        },
        data: [
          // Background Row: 浅蓝
          { value: getP(uNo, totalU), raw: uNo, itemStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
          // Selected Row: 标准蓝
          { value: getP(sNo, totalS), raw: sNo, itemStyle: { color: '#1890ff' } }
        ]
      }
    ]
  };

  myChart.setOption(option);
};
watch(() => props.processObject, () => initChart(), { deep: true });

onMounted(() => {
  window.addEventListener('resize', () => myChart?.resize());
  initChart();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => myChart?.resize());
  myChart?.dispose();
});
// 1. 新增：计算背景组（全部数据）的统计
const backgroundCVDCount = computed(() => {
  const uCVD = props.processObject?.unselectedCVD?.length || 0;
  return selectedCVDCount.value + uCVD;
});

const backgroundTotal = computed(() => {
  const uCVD = props.processObject?.unselectedCVD?.length || 0;
  const uNo = props.processObject?.unselectedNoCVD?.length || 0;
  return totalSelected.value + uCVD + uNo;
});

const backgroundPrevalence = computed(() => {
  return backgroundTotal.value > 0 
    ? ((backgroundCVDCount.value / backgroundTotal.value) * 100).toFixed(2) 
    : 0;
});
// 2. 新增：对比描述逻辑
const prevalenceDiff = computed(() => {
  const diff = (prevalenceRate.value - backgroundPrevalence.value).toFixed(2);
  return {
    val: Math.abs(diff),
    isHigher: diff > 0,
    isEqual: diff == 0
  };
});
</script>

<style scoped>
.summary-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.guidance-section {
  padding: 20px;
  background: #f8fbff;
  border-bottom: 1px solid #e6effb;
  height: 220px;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.pulse-icon {
  width: 10px;
  height: 10px;
  background: #1890ff;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 0 0 rgba(24, 144, 255, 0.4);
  animation: pulse 2s infinite;
}

.section-title {
  margin: 0;
  font-size: 14px;
  color: #003a8c;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.filter-status {
  font-size: 13px;
  color: #595959;
  margin-bottom: 10px;
}

.dynamic-narrative {
  font-size: 14px;
  line-height: 1.6;
  color: #262626;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
  margin-bottom: 15px;
  height: 68px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric-card {
  text-align: center;
  padding: 8px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  height: 65px;
}

.metric-card .label {
  display: block;
  font-size: 11px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.metric-card .value {
  font-size: 16px;
  font-weight: 700;
}
.metric-card:hover { transform: translateY(-2px); }
.red { color: #cf1322; }
.blue { color: #096dd9; }
.purple { color: #722ed1; }

.chart-canvas {
  flex: 1;
  width: 100%;
  min-height: 350px;
}

.chart-legend-hint {
  text-align: center;
  padding: 10px;
  color: #bfbfbf;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
}
</style>