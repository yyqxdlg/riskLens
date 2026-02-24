<template>
  <div>
    <a-form
      :model="formState"
      name="userForm"
      :label-col="{ span: 7 }"
      :wrapper-col="{ span: 17 }"
      autocomplete="off"
    >
      <a-row :gutter="18">
        <a-col v-for="field in numericFields" :key="field.key" flex="1">
        <a-form-item
          :label="field.label"
          :name="field.key"
        >
          <a-input
            v-model:value="formState[field.key]"
          />
        </a-form-item>
        </a-col>
        <a-col flex="1.2">
          <a-form-item label="Diabetes" name="diabetesSelections">
            <a-checkbox-group
              v-model:value="formState.diabetesSelections"
              :options="diabetesOptions"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <div class="actions-row">
        <a-button size="small" @click="handleGetOlder">get older (+5y)</a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  clearSignal: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['updateFilters'])

const numericFields = [
  { key: 'age', label: 'Age' },
  { key: 'bmi', label: 'BMI' },
  { key: 'sbp', label: 'SBP' },
  { key: 'chol', label: 'CHOL' }
]

const diabetesOptions = [
  { label: 'Non-DM', value: 'Non-Diabetic' },
  { label: 'DM', value: 'Diabetic' }
]

const emptyFormState = () => ({
  age: '',
  bmi: '',
  sbp: '',
  chol: '',
  diabetesSelections: []
})
const formState = ref(emptyFormState())

const emptyFilters = () => ({
  ageGroup: [],
  bmiGroup: [],
  bpGroup: [],
  lipidGroup: [],
  diabetesLabel: []
})

const RANGE_LIMITS = {
  age: [18, 95],
  bmi: [14.9, 68.9],
  sbp: [80, 220],
  chol: [100, 450]
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

const handleGetOlder = () => {
  const age = extractNumber(formState.value.age)
  if (age === null) return
  const nextAge = Math.round(clamp(age + 5, RANGE_LIMITS.age[0], RANGE_LIMITS.age[1]))
  formState.value.age = String(nextAge)
}

const classifyFilters = () => {
  const next = emptyFilters()

  const ageRaw = extractNumber(formState.value.age)
  if (ageRaw !== null) {
    const age = clamp(ageRaw, RANGE_LIMITS.age[0], RANGE_LIMITS.age[1])
    if (age < 40) next.ageGroup = ['Young Adult']
    else if (age < 60) next.ageGroup = ['Middle-Aged']
    else if (age < 75) next.ageGroup = ['Senior']
    else next.ageGroup = ['Elderly']
  }

  const bmiRaw = extractNumber(formState.value.bmi)
  if (bmiRaw !== null) {
    const bmi = clamp(bmiRaw, RANGE_LIMITS.bmi[0], RANGE_LIMITS.bmi[1])
    if (bmi < 18.5) next.bmiGroup = ['Underweight']
    else if (bmi < 25) next.bmiGroup = ['Healthy']
    else if (bmi < 30) next.bmiGroup = ['Overweight']
    else if (bmi < 35) next.bmiGroup = ['Obese I']
    else next.bmiGroup = ['Severe Obesity']
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
  }

  const cholRaw = extractNumber(formState.value.chol)
  if (cholRaw !== null) {
    const chol = clamp(cholRaw, RANGE_LIMITS.chol[0], RANGE_LIMITS.chol[1])
    if (chol < 200) next.lipidGroup = ['Desirable']
    else if (chol < 240) next.lipidGroup = ['Borderline']
    else if (chol < 400) next.lipidGroup = ['High']
    else next.lipidGroup = ['Extreme']
  }

  const diabetesSelections = [...new Set(formState.value.diabetesSelections || [])]
    .filter(v => v === 'Non-Diabetic' || v === 'Diabetic')
  if (diabetesSelections.length === 1) {
    next.diabetesLabel = diabetesSelections
  }

  return next
}

watch(
  formState,
  () => {
    emit('updateFilters', classifyFilters())
  },
  { deep: true, immediate: true }
)

watch(
  () => props.clearSignal,
  () => {
    formState.value = emptyFormState()
  }
)
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 8px;
}

.actions-row {
  margin-top: 2px;
  display: flex;
  gap: 8px;
}

:deep(.ant-input) {
  background: #ffffff !important;
}

:deep(.ant-checkbox-group) {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}
</style>
