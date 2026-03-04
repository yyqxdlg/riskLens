<template>
  <section class="onboarding-shell">
    <div class="onboarding-panel">
      <div class="onboarding-header">
        <div>
          <p class="eyebrow">Interactive Intake</p>
          <h1 class="title">Build a profile before the dashboard loads</h1>
        </div>
        <a-button class="skip-all" @click="handleSkipAll">Skip to dashboard</a-button>
      </div>

      <div class="progress-row">
        <span class="progress-copy">Step {{ currentStepIndex + 1 }} / {{ steps.length }}</span>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressWidth }"></div>
        </div>
      </div>

      <div class="step-card">
        <div class="step-copy">
          <p class="step-label">{{ currentStep.label }}</p>
          <h2>{{ currentStep.prompt }}</h2>
          <p>{{ currentStep.help }}</p>
        </div>

        <div v-if="currentStep.type === 'numeric'" class="input-block">
          <div class="value-entry">
            <label :for="currentStep.key">{{ currentStep.inputLabel }}</label>
            <a-input
              :id="currentStep.key"
              v-model:value="draftValue"
              :placeholder="currentStep.placeholder"
              size="large"
              @pressEnter="handleAdvance"
            />
          </div>

          <div class="range-options">
            <button
              v-for="option in currentStep.options"
              :key="option.label"
              class="range-chip"
              :class="{ active: isOptionSelected(option) }"
              type="button"
              @click="selectOption(option)"
            >
              <span class="chip-title">{{ option.label }}</span>
              <span class="chip-subtitle">{{ option.description }}</span>
            </button>
          </div>
        </div>

        <div v-else class="range-options diabetes-options">
          <button
            v-for="option in currentStep.options"
            :key="option.label"
            class="range-chip"
            :class="{ active: isOptionSelected(option) }"
            type="button"
            @click="selectOption(option)"
          >
            <span class="chip-title">{{ option.label }}</span>
            <span class="chip-subtitle">{{ option.description }}</span>
          </button>
        </div>
      </div>

      <div class="selection-summary">
        <span>{{ currentSelectionSummary }}</span>
      </div>

      <div class="footer-actions">
        <a-button @click="goBack" :disabled="currentStepIndex === 0">Back</a-button>
        <div class="right-actions">
          <a-button @click="skipCurrent">Skip</a-button>
          <a-button type="primary" @click="handleAdvance">
            {{ currentStepIndex === steps.length - 1 ? 'Show dashboard' : 'Next' }}
          </a-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const emit = defineEmits(['complete'])

const steps = [
  {
    key: 'age',
    label: 'Age',
    type: 'numeric',
    prompt: 'How old are you?',
    help: 'Enter a specific age or choose a broad range. You can skip any step.',
    inputLabel: 'Exact age',
    placeholder: 'e.g. 39',
    range: [18, 95],
    options: [
      { label: '18-39', description: 'Young Adult', filterKey: 'ageGroup', filterValue: 'Young Adult' },
      { label: '40-59', description: 'Middle-Aged', filterKey: 'ageGroup', filterValue: 'Middle-Aged' },
      { label: '60-74', description: 'Senior', filterKey: 'ageGroup', filterValue: 'Senior' },
      { label: '75+', description: 'Elderly', filterKey: 'ageGroup', filterValue: 'Elderly' }
    ]
  },
  {
    key: 'bmi',
    label: 'BMI',
    type: 'numeric',
    prompt: 'What is your BMI?',
    help: 'A precise BMI will drive the marker line. Range selection keeps it category-based.',
    inputLabel: 'Exact BMI',
    placeholder: 'e.g. 23.4',
    range: [14.9, 68.9],
    options: [
      { label: '<18.5', description: 'Underweight', filterKey: 'bmiGroup', filterValue: 'Underweight' },
      { label: '18.5-24.9', description: 'Healthy', filterKey: 'bmiGroup', filterValue: 'Healthy' },
      { label: '25-29.9', description: 'Overweight', filterKey: 'bmiGroup', filterValue: 'Overweight' },
      { label: '30-34.9', description: 'Obese I', filterKey: 'bmiGroup', filterValue: 'Obese I' },
      { label: '35+', description: 'Severe Obesity', filterKey: 'bmiGroup', filterValue: 'Severe Obesity' }
    ]
  },
  {
    key: 'sbp',
    label: 'SBP',
    type: 'numeric',
    prompt: 'What is your systolic blood pressure?',
    help: 'Enter SBP directly or classify yourself by clinical blood-pressure bands.',
    inputLabel: 'Exact SBP',
    placeholder: 'e.g. 128',
    range: [80, 220],
    options: [
      { label: '<90', description: 'Low', filterKey: 'bpGroup', filterValue: 'Low' },
      { label: '90-119', description: 'Normal', filterKey: 'bpGroup', filterValue: 'Normal' },
      { label: '120-129', description: 'Elevated', filterKey: 'bpGroup', filterValue: 'Elevated' },
      { label: '130-139', description: 'Stage 1', filterKey: 'bpGroup', filterValue: 'Stage 1' },
      { label: '140-179', description: 'Stage 2', filterKey: 'bpGroup', filterValue: 'Stage 2' },
      { label: '180+', description: 'Crisis', filterKey: 'bpGroup', filterValue: 'Crisis' }
    ]
  },
  {
    key: 'chol',
    label: 'CHOL',
    type: 'numeric',
    prompt: 'What is your total cholesterol level?',
    help: 'Use the exact value if you know it. Otherwise choose the nearest diagnostic band.',
    inputLabel: 'Exact CHOL',
    placeholder: 'e.g. 210',
    range: [100, 450],
    options: [
      { label: '<200', description: 'Desirable', filterKey: 'lipidGroup', filterValue: 'Desirable' },
      { label: '200-239', description: 'Borderline', filterKey: 'lipidGroup', filterValue: 'Borderline' },
      { label: '240-399', description: 'High', filterKey: 'lipidGroup', filterValue: 'High' },
      { label: '400+', description: 'Extreme', filterKey: 'lipidGroup', filterValue: 'Extreme' }
    ]
  },
  {
    key: 'diabetes',
    label: 'Diabetes',
    type: 'choice',
    prompt: 'Do you currently have diabetes?',
    help: 'This can be skipped if you want to browse the population first.',
    options: [
      { label: 'No', description: 'Non-Diabetic', filterKey: 'diabetesLabel', filterValue: 'Non-Diabetic', inputValue: ['Non-Diabetic'] },
      { label: 'Yes', description: 'Diabetic', filterKey: 'diabetesLabel', filterValue: 'Diabetic', inputValue: ['Diabetic'] }
    ]
  }
]

const emptyAnswers = () => ({
  age: { mode: 'skip', raw: '', option: null },
  bmi: { mode: 'skip', raw: '', option: null },
  sbp: { mode: 'skip', raw: '', option: null },
  chol: { mode: 'skip', raw: '', option: null },
  diabetes: { mode: 'skip', raw: '', option: null }
})

const currentStepIndex = ref(0)
const answers = ref(emptyAnswers())
const draftValue = ref('')

const currentStep = computed(() => steps[currentStepIndex.value])
const progressWidth = computed(() => `${((currentStepIndex.value + 1) / steps.length) * 100}%`)

watch(
  currentStep,
  (step) => {
    const answer = answers.value[step.key]
    draftValue.value = answer?.mode === 'exact' ? answer.raw : ''
  },
  { immediate: true }
)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const extractNumber = (input) => {
  const text = String(input ?? '').trim()
  if (!text) return null
  const match = text.match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

const exactFilterForStep = (step, numericValue) => {
  if (step.key === 'age') {
    if (numericValue < 40) return { filterKey: 'ageGroup', filterValue: 'Young Adult' }
    if (numericValue < 60) return { filterKey: 'ageGroup', filterValue: 'Middle-Aged' }
    if (numericValue < 75) return { filterKey: 'ageGroup', filterValue: 'Senior' }
    return { filterKey: 'ageGroup', filterValue: 'Elderly' }
  }
  if (step.key === 'bmi') {
    if (numericValue < 18.5) return { filterKey: 'bmiGroup', filterValue: 'Underweight' }
    if (numericValue < 25) return { filterKey: 'bmiGroup', filterValue: 'Healthy' }
    if (numericValue < 30) return { filterKey: 'bmiGroup', filterValue: 'Overweight' }
    if (numericValue < 35) return { filterKey: 'bmiGroup', filterValue: 'Obese I' }
    return { filterKey: 'bmiGroup', filterValue: 'Severe Obesity' }
  }
  if (step.key === 'sbp') {
    if (numericValue < 90) return { filterKey: 'bpGroup', filterValue: 'Low' }
    if (numericValue < 120) return { filterKey: 'bpGroup', filterValue: 'Normal' }
    if (numericValue < 130) return { filterKey: 'bpGroup', filterValue: 'Elevated' }
    if (numericValue < 140) return { filterKey: 'bpGroup', filterValue: 'Stage 1' }
    if (numericValue < 180) return { filterKey: 'bpGroup', filterValue: 'Stage 2' }
    return { filterKey: 'bpGroup', filterValue: 'Crisis' }
  }
  if (step.key === 'chol') {
    if (numericValue < 200) return { filterKey: 'lipidGroup', filterValue: 'Desirable' }
    if (numericValue < 240) return { filterKey: 'lipidGroup', filterValue: 'Borderline' }
    if (numericValue < 400) return { filterKey: 'lipidGroup', filterValue: 'High' }
    return { filterKey: 'lipidGroup', filterValue: 'Extreme' }
  }
  return null
}

const isOptionSelected = (option) => answers.value[currentStep.value.key]?.option?.label === option.label

const selectOption = (option) => {
  answers.value[currentStep.value.key] = {
    mode: 'range',
    raw: '',
    option
  }
  draftValue.value = ''
}

const commitDraftIfNeeded = () => {
  const step = currentStep.value
  if (step.type !== 'numeric') return
  const parsed = extractNumber(draftValue.value)
  if (parsed === null) return
  const bounded = clamp(parsed, step.range[0], step.range[1])
  answers.value[step.key] = {
    mode: 'exact',
    raw: String(bounded),
    option: null
  }
}

const skipCurrent = () => {
  answers.value[currentStep.value.key] = { mode: 'skip', raw: '', option: null }
  draftValue.value = ''
  advance()
}

const goBack = () => {
  if (currentStepIndex.value === 0) return
  currentStepIndex.value -= 1
}

const advance = () => {
  if (currentStepIndex.value === steps.length - 1) {
    emit('complete', buildPayload())
    return
  }
  currentStepIndex.value += 1
}

const handleAdvance = () => {
  commitDraftIfNeeded()
  advance()
}

const buildPayload = () => {
  const filters = {
    ageGroup: [],
    bmiGroup: [],
    bpGroup: [],
    lipidGroup: [],
    diabetesLabel: []
  }
  const userInputs = {
    age: null,
    bmi: null,
    sbp: null,
    chol: null,
    diabetes: null
  }

  steps.forEach((step) => {
    const answer = answers.value[step.key]
    if (!answer || answer.mode === 'skip') return

    if (answer.mode === 'exact' && step.type === 'numeric') {
      const numericValue = Number(answer.raw)
      userInputs[step.key] = numericValue
      const filter = exactFilterForStep(step, numericValue)
      if (filter) filters[filter.filterKey] = [filter.filterValue]
      return
    }

    if (answer.mode === 'range' && answer.option) {
      filters[answer.option.filterKey] = [answer.option.filterValue]
      if (step.key === 'diabetes') {
        userInputs.diabetes = answer.option.inputValue
      }
    }
  })

  return { filters, userInputs }
}

const handleSkipAll = () => {
  emit('complete', {
    filters: {
      ageGroup: [],
      bmiGroup: [],
      bpGroup: [],
      lipidGroup: [],
      diabetesLabel: []
    },
    userInputs: {
      age: null,
      bmi: null,
      sbp: null,
      chol: null,
      diabetes: null
    }
  })
}

const currentSelectionSummary = computed(() => {
  const answer = answers.value[currentStep.value.key]
  if (!answer || answer.mode === 'skip') return 'No answer recorded for this step yet.'
  if (answer.mode === 'exact') return `Exact input captured: ${answer.raw}`
  return `Selected range: ${answer.option?.description || answer.option?.label}`
})
</script>

<style scoped>
.onboarding-shell {
  min-height: calc(100vh - 86px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 14px 28px;
}

.onboarding-panel {
  width: min(920px, 100%);
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(37, 99, 235, 0.09), transparent 45%),
    radial-gradient(100% 100% at 100% 0%, rgba(14, 165, 233, 0.08), transparent 45%),
    #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  padding: 28px;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 700;
}

.title {
  margin: 0;
  font-size: 34px;
  line-height: 1.05;
  color: #0f172a;
  max-width: 600px;
}

.skip-all {
  border-radius: 999px;
}

.progress-row {
  margin-top: 26px;
}

.progress-copy {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
  transition: width 260ms ease;
}

.step-card {
  margin-top: 26px;
  padding: 26px;
  border-radius: 22px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.step-label {
  margin: 0 0 8px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #1d4ed8;
  font-weight: 700;
}

.step-copy h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.12;
  color: #111827;
}

.step-copy p:last-child {
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: #526277;
  max-width: 640px;
}

.input-block {
  margin-top: 26px;
}

.value-entry {
  display: grid;
  gap: 10px;
}

.value-entry label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.range-options {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 12px;
}

.range-chip {
  text-align: left;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #ffffff;
  border-radius: 18px;
  padding: 16px 14px;
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.range-chip:hover {
  border-color: rgba(37, 99, 235, 0.42);
  transform: translateY(-1px);
}

.range-chip.active {
  border-color: #2563eb;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.95) 0%, #ffffff 100%);
}

.chip-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.chip-subtitle {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.selection-summary {
  margin-top: 18px;
  min-height: 22px;
  font-size: 14px;
  color: #475569;
}

.footer-actions {
  margin-top: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 900px) {
  .onboarding-panel {
    padding: 22px;
  }

  .onboarding-header,
  .footer-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .title {
    font-size: 28px;
  }

  .step-copy h2 {
    font-size: 24px;
  }

  .right-actions {
    width: 100%;
  }

  .right-actions :deep(.ant-btn) {
    flex: 1;
  }
}
</style>
