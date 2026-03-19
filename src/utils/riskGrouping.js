export const EMPTY_FILTER_MAP = () => ({
  ageGroup: [],
  bmiGroup: [],
  bpGroup: [],
  lipidGroup: [],
  diabetesLabel: []
})

export const INPUT_LIMITS = {
  age: [0, 130],
  bmi: [10, 100],
  sbp: [50, 300],
  chol: [50, 700]
}

export const clampToRange = (value, min, max) => Math.min(max, Math.max(min, value))

export const normalizeNumericInput = (value, inputKey) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  const range = INPUT_LIMITS[inputKey]
  if (!range) return numeric
  return clampToRange(numeric, range[0], range[1])
}

export const resolveInputCategory = (dimKey, inputValue) => {
  if (inputValue === null || inputValue === undefined || inputValue === '') return null
  const numeric = Number(inputValue)
  if (!Number.isFinite(numeric)) return null

  if (dimKey === 'ageGroup') {
    if (numeric < 40) return 'Young Adult'
    if (numeric < 60) return 'Middle-Aged'
    if (numeric < 75) return 'Senior'
    return 'Elderly'
  }

  if (dimKey === 'bmiGroup') {
    if (numeric < 18.5) return 'Underweight'
    if (numeric < 25) return 'Healthy'
    if (numeric < 30) return 'Overweight'
    if (numeric < 35) return 'Obese I'
    return 'Severe Obesity'
  }

  if (dimKey === 'bpGroup') {
    if (numeric < 90) return 'Low'
    if (numeric < 120) return 'Normal'
    if (numeric < 130) return 'Elevated'
    if (numeric < 140) return 'Stage 1'
    if (numeric < 180) return 'Stage 2'
    return 'Crisis'
  }

  if (dimKey === 'lipidGroup') {
    if (numeric < 200) return 'Desirable'
    if (numeric < 240) return 'Borderline'
    if (numeric < 400) return 'High'
    return 'Extreme'
  }

  if (dimKey === 'diabetesLabel') {
    return numeric >= 0.5 ? 'Diabetic' : 'Non-Diabetic'
  }

  return null
}

export const resolveFilterForInput = (inputKey, inputValue) => {
  const mapping = {
    age: 'ageGroup',
    bmi: 'bmiGroup',
    sbp: 'bpGroup',
    chol: 'lipidGroup',
    diabetes: 'diabetesLabel'
  }

  const filterKey = mapping[inputKey]
  if (!filterKey) return null

  const normalizedValue = inputKey === 'diabetes'
    ? Number(inputValue)
    : normalizeNumericInput(inputValue, inputKey)

  const filterValue = resolveInputCategory(filterKey, normalizedValue)
  if (!filterValue) return null

  return { filterKey, filterValue, normalizedValue }
}
