<template>
  <div class="summary-container">
    <div class="guidance-section">
      <div class="header-row">
        <span class="pulse-icon"></span>
        <h3 class="section-title">Live Analysis Guidance</h3>
      </div>
      <p class="section-subtitle">Compare subgroup composition with the cohort baseline to identify risk concentration shifts.</p>

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

    <div class="chart-block">
      <div ref="donutChartRef" class="chart-canvas"></div>
    </div>
    
    <div class="chart-legend-hint">
      <small>* Labels show count and within-row percentage.</small>
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
let resizeObserver = null;
const selectedCvdColor = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
  { offset: 0, color: '#ff6b6f' },
  { offset: 1, color: '#ff3d43' }
]);
const backgroundCvdColor = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
  { offset: 0, color: 'rgba(255, 125, 128, 0.48)' },
  { offset: 1, color: 'rgba(255, 77, 79, 0.32)' }
]);
const selectedHealthyColor = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
  { offset: 0, color: '#389cff' },
  { offset: 1, color: '#177ddc' }
]);
const backgroundHealthyColor = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
  { offset: 0, color: 'rgba(84, 156, 235, 0.48)' },
  { offset: 1, color: 'rgba(24, 144, 255, 0.32)' }
]);

// Computed Statistics
const selectedCVDCount = computed(() => {
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

const formatSegmentLabel = (params, compactThreshold = 10) => {
  const ratio = Number(params.value) || 0;
  const raw = Number(params.data?.raw || 0);
  const ratioText = `${ratio.toFixed(1)}%`;
  const rawText = raw.toLocaleString();
  if (ratio < compactThreshold) return `${rawText} (${ratioText})`;
  return `${rawText}\n(${ratioText})`;
}

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
    animationDurationUpdate: 380,
    animationEasingUpdate: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#dbeafe',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937'
      },
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
        { name: 'CVD', itemStyle: { color: '#ff4d4f' } },
        { name: 'Healthy', itemStyle: { color: '#1890ff' } }
      ],
      top: 8,
      right: '8%',
      itemWidth: 14,
      itemHeight: 14,
      icon: 'roundRect',
      textStyle: {
        color: '#475569',
        fontSize: 11,
        fontWeight: 600
      },
      selectedMode: false
    },
    grid: {
      left: '18%',
      right: '8%',
      top: 48,
      bottom: 18
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
      axisLabel: {
        fontWeight: 700,
        fontSize: 11,
        color: '#475569',
        margin: 14
      }
    },
    series: [
      {
        name: 'CVD',
        type: 'bar',
        stack: 'total',
        barWidth: 46,
        barCategoryGap: '44%',
        label: {
          show: true,
          position: 'insideLeft',
          padding: [0, 0, 0, 6],
          color: '#fff',
          fontSize: 10.5,
          fontWeight: 700,
          textBorderColor: 'rgba(15, 23, 42, 0.22)',
          textBorderWidth: 2,
          formatter: (p) => formatSegmentLabel(p, 12)
        },
        data: [
          {
            value: getP(uCVD, totalU),
            raw: uCVD,
            itemStyle: {
              color: backgroundCvdColor,
              borderRadius: [10, 0, 0, 10]
            }
          },
          {
            value: getP(sCVD, totalS),
            raw: sCVD,
            itemStyle: {
              color: selectedCvdColor,
              borderRadius: [10, 0, 0, 10],
              shadowColor: 'rgba(255, 77, 79, 0.3)',
              shadowBlur: 8,
              shadowOffsetY: 2
            }
          }
        ]
      },
      {
        name: 'Healthy',
        type: 'bar',
        stack: 'total',
        barWidth: 46,
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          fontSize: 10.5,
          fontWeight: 700,
          textBorderColor: 'rgba(15, 23, 42, 0.16)',
          textBorderWidth: 2,
          formatter: (p) => formatSegmentLabel(p, 18)
        },
        data: [
          {
            value: getP(uNo, totalU),
            raw: uNo,
            itemStyle: {
              color: backgroundHealthyColor,
              borderRadius: [0, 10, 10, 0]
            }
          },
          {
            value: getP(sNo, totalS),
            raw: sNo,
            itemStyle: {
              color: selectedHealthyColor,
              borderRadius: [0, 10, 10, 0],
              shadowColor: 'rgba(24, 144, 255, 0.28)',
              shadowBlur: 8,
              shadowOffsetY: 2
            }
          }
        ]
      }
    ]
  };

  myChart.setOption(option, true);
};
watch(() => props.processObject, () => initChart(), { deep: true });
const handleResize = () => myChart?.resize()
onMounted(() => {
  window.addEventListener('resize', handleResize);
  initChart();
  if (typeof ResizeObserver !== 'undefined' && donutChartRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(donutChartRef.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  resizeObserver?.disconnect();
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
  const diff = Number((prevalenceRate.value - backgroundPrevalence.value).toFixed(2))
return {
  val: Math.abs(diff),
  isHigher: diff > 0,
  isEqual: diff === 0
}
});
</script>

<style scoped>
.summary-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.guidance-section {
  padding: 16px 18px 14px;
  background: #f8fbff;
  border-bottom: 1px solid #e6effb;
  height: auto;
  flex-shrink: 0;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
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

.section-subtitle {
  margin: 0 0 12px;
  font-size: 11px;
  color: #64748b;
}

.filter-status {
  font-size: 13px;
  color: #595959;
  margin-bottom: 10px;
}

.dynamic-narrative {
  font-size: 13px;
  line-height: 1.7;
  color: #262626;
  background: #fff;
  padding: 12px 14px;
  border-radius: 10px;
  border-left: 4px solid #1890ff;
  margin-bottom: 12px;
  min-height: 98px;
  height: auto;
  display: flex;
  align-items: flex-start;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric-card {
  text-align: center;
  padding: 10px 8px;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.metric-card .label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.metric-card .value {
  font-size: 18px;
  font-weight: 700;
}
.metric-card:hover { transform: translateY(-2px); }
.red { color: #cf1322; }
.green { color: #15803d; }
.blue { color: #096dd9; }
.purple { color: #722ed1; }

.chart-block {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 14px 0;
  border-top: 1px solid rgba(203, 213, 225, 0.5);
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 22%);
}

.chart-canvas {
  flex: 1;
  width: 100%;
  min-height: 250px;
}

.chart-legend-hint {
  text-align: center;
  padding: 8px 10px 12px;
  color: #94a3b8;
  background: #fff;
  font-size: 11px;
  line-height: 1.4;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .guidance-section {
    padding: 14px 14px 12px;
  }

  .metrics-grid {
    gap: 8px;
  }

  .chart-block {
    padding: 8px 10px 0;
  }

  .chart-canvas {
    min-height: 220px;
  }
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    height: auto;
    min-height: 62px;
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
}
</style>
