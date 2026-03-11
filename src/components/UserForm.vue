<template>
  <div class="user-form">
    <a-form
      :model="formState"
      name="userForm"
      autocomplete="off"
      class="intake-form"
    >
      <div class="compact-grid">
        <div
          v-for="field in numericFields"
          :key="field.key"
          class="field-inline"
        >
          <span class="inline-label">{{ field.label }}:</span>
          <div class="inline-control-wrap">
            <a-input
              v-model:value="formState[field.key]"
              size="large"
              class="inline-control"
            />
            <!-- BMI calculator icon button — only on the BMI field -->
            <a-tooltip v-if="field.key === 'bmi'" title="Calculate BMI from height &amp; weight">
              <span
                class="bmi-icon-btn"
                size="small"
                @click="bmiModalOpen = true"
              >
                🧮
            </span>
            </a-tooltip>
            <a-tooltip :title="field.description" color="#108ee9">
              <InfoCircleTwoTone class="inline-tip" />
            </a-tooltip>
          </div>
        </div>

        <div class="field-inline">
          <span class="inline-label">Diabetes:</span>
          <div class="inline-control-wrap">
            <a-select
              v-model:value="formState.diabetesSelections"
              :options="diabetesOptions"
              size="large"
              class="inline-control"
            />
            <a-tooltip color="#108ee9" title="Diabetes status is a major cardiovascular risk factor.">
              <InfoCircleTwoTone class="inline-tip" />
            </a-tooltip>
          </div>
        </div>
      </div>

      <div class="action-row">
        <div class="action-group action-group-left">
          <a-tooltip color="#87d068" title="See how risk trends evolve for people like you over the next many years.">
            <a-button class="sim-btn" @click="openTimeMachine">
              Risk Simulator
            </a-button>
          </a-tooltip>
        </div>
        <div class="action-group action-group-right">
          <a-button class="confirm-btn" type="primary" @click="handleConfirm">Confirm</a-button>
          <a-button class="reset-btn" @click="handleReset">Reset</a-button>
        </div>
      </div>
    </a-form>
  </div>
  <!-- BMI Calculator Modal -->
  <BmiCalculatorModal
    :open="bmiModalOpen"
    @confirm="onBmiConfirm"
    @cancel="bmiModalOpen = false"
  />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue';
import {InfoCircleTwoTone}  from '@ant-design/icons-vue';
import BmiCalculatorModal from './BmiCalculatorModal.vue'

const props = defineProps({
  clearSignal: {
    type: Number,
    default: 0
  },
  initialFilters: {
    type: Object,
    default: () => ({
      ageGroup: [],
      bmiGroup: [],
      bpGroup: [],
      lipidGroup: [],
      diabetesLabel: []
    })
  },
  initialValues: {
    type: Object,
    default: () => ({
      age: null,
      bmi: null,
      sbp: null,
      chol: null,
      diabetes: null
    })
  }
})

const emit = defineEmits(['updateFilters', 'updateUserInputs', 'openTimeMachine'])
const bmiModalOpen = ref(false)

const onBmiConfirm = (value) => {
  formState.value.bmi = value
  bmiModalOpen.value = false
}
const numericFields = [
  { key: 'age', label: 'Age',description:'Your current age, which acts as a primary independent risk factor for cardiovascular health.' },
  { key: 'bmi', label: 'BMI',description: 'A measure of body composition that helps identify if your weight is in a healthy proportion to your height.' },
  { key: 'sbp', label: 'SBP' ,description:'The peak pressure in your arteries created when your heart beats and pumps blood.'},
  { key: 'chol', label: 'CHOL',description:'The total amount of fats (lipids) found in your blood, used to assess the risk of plaque buildup.' }
]

const diabetesOptions = [
  {label:'',value:''},
  { label: 'no', value: 'Non-Diabetic' },
  { label: 'yes', value: 'Diabetic' }
]

const emptyFormState = () => ({
  age: '',
  bmi: '',
  sbp: '',
  chol: '',
  diabetesSelections: ''
})
const formState = ref(emptyFormState())
let liveSyncTimer = null

const emptyFilters = () => ({
  ageGroup: [],
  bmiGroup: [],
  bpGroup: [],
  lipidGroup: [],
  diabetesLabel: []
})
const seededFilters = ref(emptyFilters())

const RANGE_LIMITS = {
  age: [0, 130],      // 有记录的最长寿 122 岁
  bmi: [10, 100],     // BMI 10 以下基本不存活，100 以上极罕见
  sbp: [50, 300],     // 50 以下休克，300 以上极危重
  chol: [50, 700]     // 50 以下极罕见遗传病，700 以上也属极端
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const extractNumber = (input) => {
  if (input === null || input === undefined) return null
  const text = String(input).trim()
  if (!text) return null
  const matched = text.match(/-?\d+(\.\d+)?/)
  if (!matched) return null
  const value = Number(matched[0])
  return Number.isFinite(value) ? value : null
}

// const handleGetOlder = () => {
//   const age = extractNumber(formState.value.age)
//   if (age === null) return
//   const nextAge = Math.round(clamp(age + 5, RANGE_LIMITS.age[0], RANGE_LIMITS.age[1]))
//   formState.value.age = String(nextAge)
// }

const classifyFilters = () => {
  const next = { ...emptyFilters(), ...seededFilters.value }

  const ageRaw = extractNumber(formState.value.age)
  if (ageRaw !== null) {
    const age = clamp(ageRaw, RANGE_LIMITS.age[0], RANGE_LIMITS.age[1])
    if (age < 40) next.ageGroup = ['Young Adult']
    else if (age < 60) next.ageGroup = ['Middle-Aged']
    else if (age < 75) next.ageGroup = ['Senior']
    else next.ageGroup = ['Elderly']
  } else {
    next.ageGroup = []
  }

  const bmiRaw = extractNumber(formState.value.bmi)
  if (bmiRaw !== null) {
    const bmi = clamp(bmiRaw, RANGE_LIMITS.bmi[0], RANGE_LIMITS.bmi[1])
    if (bmi < 18.5) next.bmiGroup = ['Underweight']
    else if (bmi < 25) next.bmiGroup = ['Healthy']
    else if (bmi < 30) next.bmiGroup = ['Overweight']
    else if (bmi < 35) next.bmiGroup = ['Obese I']
    else next.bmiGroup = ['Severe Obesity']
  } else {
    next.bmiGroup = []
  }

  const sbpRaw = extractNumber(formState.value.sbp)
  if (sbpRaw !== null) {
    const sbp = clamp(sbpRaw, RANGE_LIMITS.sbp[0], RANGE_LIMITS.sbp[1])
    if (sbp < 90) next.bpGroup = ['Low']
    else if (sbp < 120) next.bpGroup = ['Normal']
    else if (sbp < 130) next.bpGroup = ['Elevated']
    else if (sbp < 140) next.bpGroup = ['Stage 1']
    else if (sbp < 180) next.bpGroup = ['Stage 2']
    else next.bpGroup = ['Crisis']
  } else {
    next.bpGroup = []
  }

  const cholRaw = extractNumber(formState.value.chol)
  if (cholRaw !== null) {
    const chol = clamp(cholRaw, RANGE_LIMITS.chol[0], RANGE_LIMITS.chol[1])
    if (chol < 200) next.lipidGroup = ['Desirable']
    else if (chol < 240) next.lipidGroup = ['Borderline']
    else if (chol < 400) next.lipidGroup = ['High']
    else next.lipidGroup = ['Extreme']
  } else {
    next.lipidGroup = []
  }

  const diabetesRaw = formState.value.diabetesSelections
  next.diabetesLabel = !diabetesRaw
    ? []                        // ← 改这里：清空时不再保留 seeded 值
    : diabetesRaw === 'Non-Diabetic'
      ? ['Non-Diabetic']
      : ['Diabetic']

  return next
}

const buildUserInputs = () => {
  const ageRaw = extractNumber(formState.value.age)
  const bmiRaw = extractNumber(formState.value.bmi)
  const sbpRaw = extractNumber(formState.value.sbp)
  const cholRaw = extractNumber(formState.value.chol)
  // const diabetesSelections = [...new Set(formState.value.diabetesSelections || [])]
  //   .filter(v => v === 'Non-Diabetic' || v === 'Diabetic')
  const diabetesRaw = formState.value.diabetesSelections

  return {
    age: ageRaw === null ? null : clamp(ageRaw, RANGE_LIMITS.age[0], RANGE_LIMITS.age[1]),
    bmi: bmiRaw === null ? null : clamp(bmiRaw, RANGE_LIMITS.bmi[0], RANGE_LIMITS.bmi[1]),
    sbp: sbpRaw === null ? null : clamp(sbpRaw, RANGE_LIMITS.sbp[0], RANGE_LIMITS.sbp[1]),
    chol: cholRaw === null ? null : clamp(cholRaw, RANGE_LIMITS.chol[0], RANGE_LIMITS.chol[1]),
    diabetes: !diabetesRaw ? []: diabetesRaw === 'Non-Diabetic' ? ['Non-Diabetic'] : ['Diabetic']
    
  }
}
const openTimeMachine = () => {
  const age = extractNumber(formState.value.age)
  if (!age) {
    message.error({ content: 'Age can not be empty', duration: 3 })
    return
  }
  if (age < 18) {
    message.warning({ content: 'Age below 18 has no data in the dataset, Time Machine will show no results', duration: 3 })
  }
  handleConfirm()
  emit('openTimeMachine', age)  // 直接传原始值
}

const emitCurrentState = () => {
  emit('updateFilters', classifyFilters())
  emit('updateUserInputs', buildUserInputs())
}

const toFormState = (values = {}) => ({
  age: values.age ?? values.age === 0 ? String(values.age ?? '') : '',
  bmi: values.bmi ?? values.bmi === 0 ? String(values.bmi ?? '') : '',
  sbp: values.sbp ?? values.sbp === 0 ? String(values.sbp ?? '') : '',
  chol: values.chol ?? values.chol === 0 ? String(values.chol ?? '') : '',
  diabetesSelections: Array.isArray(values.diabetes)
    ? (values.diabetes[0] || '')
    : (values.diabetes === 1 ? 'Diabetic' : values.diabetes === 0 ? 'Non-Diabetic' : '')
})

const normalizeFilters = (filters = {}) => ({
  ageGroup: [...(filters.ageGroup || [])],
  bmiGroup: [...(filters.bmiGroup || [])],
  bpGroup: [...(filters.bpGroup || [])],
  lipidGroup: [...(filters.lipidGroup || [])],
  diabetesLabel: [...(filters.diabetesLabel || [])]
})

const scheduleLiveEmit = () => {
  if (liveSyncTimer) clearTimeout(liveSyncTimer)
  liveSyncTimer = setTimeout(() => {
    emitCurrentState()
  }, 120)
}

  const handleConfirm = () => {
    emitCurrentState()
    scheduleLiveEmit()
  }
  const handleReset = () => {
    seededFilters.value = emptyFilters()
    formState.value = emptyFormState()
  }

// watch(
//   formState,
//   () => {
//     scheduleLiveEmit()
//   },
//   { deep: true }
// )

watch(
  () => props.initialValues,
  (nextValues) => {
    const nextState = toFormState(nextValues)
    if (JSON.stringify(nextState) === JSON.stringify(formState.value)) return
    formState.value = nextState
  },
  { deep: true, immediate: true }
)

watch(
  () => props.initialFilters,
  (nextFilters) => {
    seededFilters.value = normalizeFilters(nextFilters)
  },
  { deep: true, immediate: true }
)

watch(
  () => props.clearSignal,
  () => {
    seededFilters.value = emptyFilters()
    handleReset()
  }
)
onMounted(()=>{
  emitCurrentState()
})

onBeforeUnmount(() => {
  if (liveSyncTimer) clearTimeout(liveSyncTimer)
})
</script>

<style scoped>
.user-form {
  width: 100%;
  padding: 2px 0;
}

.intake-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compact-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px 14px;
  align-items: center;
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.inline-label {
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  line-height: 1;
}

.inline-control-wrap {
  min-width: auto;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.inline-tip {
  font-size: 14px;
}

:deep(.inline-control.ant-input),
:deep(.inline-control.ant-select) {
  width: 164px;
}

:deep(.ant-input),
:deep(.ant-select-selector) {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
  border-radius: 9px !important;
  color: #0f172a;
  height: 34px !important;
  line-height: 34px !important;
}

:deep(.ant-select-selection-item),
:deep(.ant-select-selection-placeholder) {
  line-height: 32px !important;
}

:deep(.ant-input:focus),
:deep(.ant-input-focused),
:deep(.ant-select-focused .ant-select-selector) {
  border-color: #60a5fa !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14) !important;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
}

.action-group {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-group-left {
  justify-content: flex-start;
}

.action-group-right {
  justify-content: flex-end;
}

.confirm-btn,
.reset-btn,
.sim-btn {
  height: 34px;
  border-radius: 9px;
  font-weight: 600;
  padding-inline: 18px;
  min-width: 118px;
}

.confirm-btn {
  background: linear-gradient(180deg, #2f7cff 0%, #1d4ed8 100%);
  border-color: #1d4ed8;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}

.confirm-btn:hover {
  background: linear-gradient(180deg, #2563eb 0%, #1e40af 100%);
  border-color: #1e40af;
}

.reset-btn,
.sim-btn {
  border-color: #bfd4ea;
  color: #1e3a5f;
  background: #f8fbff;
}

.reset-btn:hover,
.sim-btn:hover {
  border-color: #93c5fd;
  color: #1e40af;
  background: #f0f7ff;
}

.sim-btn {
  min-width: 144px;
  border-color: #fdba74;
  color: #c2410c;
  background: #fff7ed;
  box-shadow: 0 2px 8px rgba(251, 146, 60, 0.18);
}

.sim-btn:hover {
  border-color: #fb923c;
  color: #9a3412;
  background: #ffedd5;
}

@media (max-width: 1400px) {
  .compact-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .compact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .action-group-right {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .compact-grid {
    grid-template-columns: 1fr;
  }
}
/* BMI calculator icon button */
.bmi-icon-btn {
  flex-shrink: 0;
  border-radius: 7px;
  border-color: #bae6fd;
  background: #f0f9ff;
  color: #0369a1;
  font-size: 14px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, border-color 0.18s;
}

.bmi-icon-btn:hover {
  background: #e0f2fe;
  border-color: #7dd3fc;
}

</style>
