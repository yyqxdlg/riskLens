<template>
  <div>
    <a-modal v-model:open="open" width="700px"  style="top: 20px" :footer="null" @cancel="closeModal" :bodyStyle="bodyStyle">
      <template #title>
        
        <div class="custom-title"><BulbTwoTone style="padding-right: 3px;" /> Time Machine: Risk Trajectory Simulator</div>
      </template>
      <div class="simulator-wrapper">
        <div class="guidance-section">
          <div class="header-row">
            <div class="pulse-icon"></div>
            <h3 class="section-title">Clinical Projection</h3>
          </div>
          <div class="narrative-content">
            <p>{{ summaryText.en }}</p>
            <!-- <p class="cn-sub">{{ summaryText.cn }}</p> -->
          </div>
          <div class="metrics-grid">
          <div class="m-card">
            <span class="m-label">Peer Sample Size</span>
            <strong class="m-value">{{ stats.totalN.toLocaleString() }}</strong>
          </div>
          <div class="m-card">
            <span class="m-label">Initial Risk</span>
            <strong class="m-value text-blue">{{ stats.startRate }}%</strong>
          </div>
          <div class="m-card">
            <span class="m-label">Peak Life-stage Risk</span>
            <strong class="m-value text-purple">{{ stats.endRate }}%</strong>
          </div>
        </div>
        </div>
        <div ref="timeMachine" class="chart-container"></div>

        <div class="footer-hint">
          <p>* Analysis based on the NHANES 2011-2023 dataset. The trend is projected by filtering peers who share your current BMI, SBP, and Cholesterol profile across future age brackets.</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { onBeforeUnmount, nextTick, ref, watch } from 'vue';
import * as echarts from 'echarts';
import {BulbTwoTone} from '@ant-design/icons-vue'
const props = defineProps({
  modalState: Object,
  rawGroupData: Array,
});

const emit = defineEmits(["colseTimeModal"]);
const open = ref(false);
const timeMachine = ref(null);
let myChart = null;

// 响应式统计数据
const stats = ref({ totalN: 0, startRate: 0, endRate: 0 });
const summaryText = ref({ en: '', cn: '' });

// 严格遵循您的 Python 分组逻辑
const STANDARD_AGE_BINS = [
  { start: 18, end: 20, label: '18-20' }, { start: 20, end: 25, label: '20-25' },
  { start: 25, end: 30, label: '25-30' }, { start: 30, end: 35, label: '30-35' },
  { start: 35, end: 40, label: '35-40' }, { start: 40, end: 45, label: '40-45' },
  { start: 45, end: 50, label: '45-50' }, { start: 50, end: 55, label: '50-55' },
  { start: 55, end: 60, label: '55-60' }, { start: 60, end: 65, label: '60-65' },
  { start: 65, end: 70, label: '65-70' }, { start: 70, end: 75, label: '70-75' },
  { start: 75, end: 80, label: '75-80' }, { start: 80, end: 120, label: '80+' }
];

const closeModal = () => {
  open.value = false;
  emit('colseTimeModal');
};

// 仿真模拟逻辑
const runSimulation = (inputAge, currentFilters, allData) => {
  const age = Number(inputAge);
  const startIndex = STANDARD_AGE_BINS.findIndex(bin => age >= bin.start && age < bin.end);
  if (startIndex === -1 || !allData.length) return [];

  const targetBins = STANDARD_AGE_BINS.slice(startIndex);
  
  // 过滤出与用户当前生理特征一致的“同类人”
  const peerGroup = allData.filter(item => {
    const check = (key) => {
      const fv = currentFilters[key];
      if (!fv || (Array.isArray(fv) && fv.length === 0)) return true;
      return Array.isArray(fv) ? fv.includes(item.displayGroups[key]) : item.displayGroups[key] === fv;
    };
    return check('bmiGroup') && check('bpGroup') && check('lipidGroup') && check('diabetesLabel');
  });

  const result = [];
  targetBins.forEach(bin => {
    const subset = peerGroup.filter(i => i.rawValues.age >= bin.start && i.rawValues.age < bin.end);
    if (subset.length > 0) {
      const cvd = subset.filter(i => i.rawValues.CVD === 1).length;
      const total = subset.length;
      result.push({ label: bin.label, cvd, healthy: total - cvd, rate: ((cvd / total) * 100).toFixed(1) });
    }
  });
  return result;
};

const renderChart = (data) => {
  if (!timeMachine.value) return;

  // 1. 如果没有数据，清空图表并更新提示，防止 ECharts 找不到坐标轴报错
  if (!data || data.length === 0) {
    if (myChart) myChart.clear();
    stats.value = { totalN: 0, startRate: 0, endRate: 0 };
    summaryText.value = { en: 'No matching data found.', cn: '未找到匹配的同类数据。' };
    return;
  }

  // 2. 销毁旧实例并重新初始化，确保容器尺寸和坐标轴重置
  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(timeMachine.value);

  // --- Mastery 核心逻辑：捕捉真实峰值 (Peak Risk) ---
  const rates = data.map(d => Number(d.rate));
  const maxRate = Math.max(...rates); // 寻找整个序列中的最高风险点
  const maxIndex = rates.indexOf(maxRate);
  const peakLabel = data[maxIndex].label;

  // 更新 UI 统计数据
  stats.value.totalN = data.reduce((a, b) => a + b.cvd + b.healthy, 0);
  stats.value.startRate = data[0].rate;
  stats.value.endRate = maxRate.toFixed(1); // 这里的 endRate 现在指向真实的峰值风险点
  
  const increase = (stats.value.endRate - stats.value.startRate).toFixed(1);

  // 更新动态总结话语
  summaryText.value = {
    en: `As you age, your clinical profile shows a peak risk of ${stats.value.endRate}% during the ${peakLabel} stage. This escalation of ${increase}% accounts for biological aging and historical survival trends.`,
    cn: `随着年龄增长，您的临床特征显示风险在 ${peakLabel} 阶段达到峰值 ${stats.value.endRate}%。这一 ${increase}% 的升幅综合考虑了生物学衰老与历史生存偏倚。`
  };

  // 3. 构建 ECharts 配置 (恢复原配色)
  const option = {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' } 
    },
    legend: { 
      data: ['Healthy', 'CVD', 'Risk Trend'], 
      bottom: 5,
      textStyle: { fontSize: 10 }
    },
    grid: { 
      top: '15%', 
      left: '8%', 
      right: '8%', 
      bottom: '15%', 
      containLabel: true 
    },
    xAxis: { 
      type: 'category', 
      data: data.map(d => d.label),
      axisTick: { alignWithLabel: true }
    },
    yAxis: [
      { 
        type: 'value', 
        name: 'Population', 
        splitLine: { lineStyle: { type: 'dashed' } } 
      },
      { 
        type: 'value', 
        name: 'Risk %', 
        max: 100, 
        axisLabel: { formatter: '{value}%' },
        splitLine: { show: false } 
      }
    ],
    series: [
      {
        name: 'Healthy',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#1890ff' }, // 蓝色
        data: data.map(d => d.healthy)
      },
      {
        name: 'CVD',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#ff4d4f' }, // 红色
        data: data.map(d => d.cvd)
      },
      {
        name: 'Risk Trend',
        type: 'line',
        yAxisIndex: 1, // 使用右侧 Y 轴
        smooth: true,
        lineStyle: { width: 4, color: '#722ed1' }, // 紫色
        itemStyle: { color: '#722ed1', borderWidth: 2 },
        // 在峰值点增加自动标注
        markPoint: {
          data: [{ type: 'max', name: 'Peak', label: { formatter: '{c}%', color: '#fff' } }],
          symbolSize: 60,
          itemStyle: { color: '#722ed1' }
        },
        data: data.map(d => d.rate)
      }
    ]
  };

  myChart.setOption(option);
};
const bodyStyle = {
  'overflow-y': 'auto',
  'height': '500px',
}
// 监听与同步
watch(() => props.modalState, async (newVal) => {
  open.value = !!newVal?.open;
  if (open.value) {
    await nextTick();
    const data = runSimulation(newVal.userAge, newVal.otherInfo, props.rawGroupData);
    renderChart(data);
  }
}, { deep: true, immediate: true });

onBeforeUnmount(() => myChart?.dispose());
</script>

<style scoped>
.custom-title {
  font-weight: bold;    /* 加粗 */
  text-align: center;   /* 居中 */
  width: 100%;          /* 确保 div 撑满标题栏宽度 */
}
.simulator-wrapper {
  padding: 10px;
}
.simulator-guidance {
  display: flex;
  background: #f6ffed; /* 浅绿背景 */
  padding: 15px;
  border-radius: 8px;
  border-left: 5px solid #52c41a; /* 核心绿 */
  margin-bottom: 20px;
}
.narrative-content {
  font-size: 14px;
  line-height: 1.6;
  color: #262626;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #52c41a;
  margin-bottom: 15px;
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
  background: #52c41a; 
  border-radius: 50%;
  margin: 0 10px 0 0; 
  box-shadow: 0 0 0 rgba(82, 196, 26, 0.4);
  animation: pulse 2s infinite;
}
.section-title {
  margin: 0;
  font-size: 14px;
  color: #226028;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.narrative-content p { margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; }
.cn-sub { color: #64748b !important; font-size: 12px !important; margin-top: 4px !important; }

.metrics-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; 
}
.m-card {
  background: #fff; border: 1px solid #f0f0f0; padding: 12px;
  border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.m-label { display: block; font-size: 11px; color: #8c8c8c; text-transform: uppercase; margin-bottom: 5px; }
.m-value { font-size: 20px; font-weight: 800; }
.text-blue { color: #1890ff; }
.text-purple { color: #722ed1; }

.chart-container { height: 420px; width: 100%; }
.footer-hint { margin-top: 20px; text-align: center; color: #bfbfbf; font-size: 11px; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(82, 196, 26, 0); }
  100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
}
</style>