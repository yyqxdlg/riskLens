<template>
  <div class="summary-container">
    <div class="guidance-section">
      <div class="header-row">
        <span class="pulse-icon"></span>
        <h3 class="section-title">Live Analysis Guidance</h3>
      </div>

      <div class="analysis-box">
        <!-- <p class="filter-status">
          <strong>Active Scope:</strong> {{ activeFiltersDescription || 'General Population (No filters applied)' }}
        </p> -->
        
        <div class="dynamic-narrative">
          <p v-if="totalSelected > 0">
            You have isolated a subgroup of <strong>{{ totalSelected.toLocaleString() }}</strong> individuals. 
            The <strong>Inner Ring</strong> shows the risk composition of this specific group. 
            Compare it to the <strong>Outer Ring</strong> (Background) to see if your selected factors (like BMI or Age) 
            increase the concentration of Cardiovascular Disease (CVD).
          </p>
          <p v-else>
            Please select categories from the left or adjust the sliders to begin peer-group analysis.
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
      <small>* Inner Ring: Current Selection | Outer Ring: Total Background Population</small>
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
  activeFiltersDescription: String
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

const initChart = () => {
  if (!donutChartRef.value) return;
  if (myChart) myChart.dispose();

  myChart = echarts.init(donutChartRef.value);

  const sCVD = selectedCVDCount.value;
  const sNo = selectedHealthyCount.value;
  const uCVD = props.processObject?props.processObject.unselectedCVD.length :0;
  const uNo = props.processObject?props.processObject.unselectedNoCVD.length : 0;

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: <strong>{c}</strong> ({d}%)'
    },
    series: [
      {
        name: 'Inner: Selected Subgroup',
        type: 'pie',
        selectedMode: 'single',
        radius: ['30%', '45%'],
        label: {
          position: 'inner',
          fontSize: 10,
          formatter: '{d}%',
          color: '#fff'
        },
        labelLine: { show: false },
        data: [
          { value: sCVD, name: 'Selected CVD', itemStyle: { color: '#ff4d4f' } },
          { value: sNo, name: 'Selected Healthy', itemStyle: { color: '#1890ff' } }
        ]
      },
      {
        name: 'Outer: Background Data',
        type: 'pie',
        radius: ['70%', '85%'],
        itemStyle: { opacity: 0.3 }, // Faint background for context
        label: {
          formatter: '{b}: {c}\n{d}%',
          fontSize: 11
        },
        data: [
          { value: uCVD, name: 'Background CVD', itemStyle: { color: '#ff4d4f' } },
          { value: uNo, name: 'Background Healthy', itemStyle: { color: '#1890ff' } }
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
  font-size: 16px;
  color: #003a8c;
  text-transform: uppercase;
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