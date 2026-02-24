<template>
  <div class="user-form">
    <a-form
      :model="formState"
      name="userForm"
      :label-col="{ span: 7 }"
      :wrapper-col="{ span: 17 }"
      autocomplete="off"
      class="user-form-grid"
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
        <a-button size="small" class="action-btn action-btn-primary" @click="handleGetOlder">Get Older (+5y)</a-button>
        <a-button size="small" class="action-btn" @click="emit('openTimeMachine')">Health Time Machine</a-button>
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

const emit = defineEmits(['updateFilters', 'updateUserInputs', 'openTimeMachine'])

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

const buildUserInputs = () => {
  const ageRaw = extractNumber(formState.value.age)
  const bmiRaw = extractNumber(formState.value.bmi)
  const sbpRaw = extractNumber(formState.value.sbp)
  const cholRaw = extractNumber(formState.value.chol)
  const diabetesSelections = [...new Set(formState.value.diabetesSelections || [])]
    .filter(v => v === 'Non-Diabetic' || v === 'Diabetic')

  return {
    age: ageRaw === null ? null : clamp(ageRaw, RANGE_LIMITS.age[0], RANGE_LIMITS.age[1]),
    bmi: bmiRaw === null ? null : clamp(bmiRaw, RANGE_LIMITS.bmi[0], RANGE_LIMITS.bmi[1]),
    sbp: sbpRaw === null ? null : clamp(sbpRaw, RANGE_LIMITS.sbp[0], RANGE_LIMITS.sbp[1]),
    chol: cholRaw === null ? null : clamp(cholRaw, RANGE_LIMITS.chol[0], RANGE_LIMITS.chol[1]),
    diabetes: diabetesSelections.length === 1
      ? (diabetesSelections[0] === 'Diabetic' ? 1 : 0)
      : null
  }
}

watch(
  formState,
  () => {
    emit('updateFilters', classifyFilters())
    emit('updateUserInputs', buildUserInputs())
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
.user-form {
  width: 100%;
}

.ant-form-item {
  margin-bottom: 9px;
}

:deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.actions-row {
  margin-top: 4px;
  display: flex;
  gap: 9px;
}

.action-btn {
  border-radius: 10px;
  border-color: #bfd4ea;
  color: #1e3a5f;
  background: #f8fbff;
  font-weight: 600;
}

.action-btn:hover {
  border-color: #93c5fd;
  color: #1e40af;
  background: #f0f7ff;
}

.action-btn-primary {
  border-color: #93c5fd;
  color: #1d4ed8;
  background: #eff6ff;
}

.action-btn-primary:hover {
  border-color: #60a5fa;
  color: #1e3a8a;
  background: #e0edff;
}

:deep(.ant-input) {
  background: #ffffff !important;
  border-color: #cbd5e1;
  border-radius: 10px;
  height: 38px;
  color: #0f172a;
}

:deep(.ant-input:focus),
:deep(.ant-input-focused) {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.14);
}

:deep(.ant-checkbox-group) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

:deep(.ant-checkbox-wrapper) {
  margin-inline-start: 0 !important;
  padding: 3px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
}

@media (max-width: 900px) {
  .actions-row {
    flex-wrap: wrap;
  }
}
</style>
