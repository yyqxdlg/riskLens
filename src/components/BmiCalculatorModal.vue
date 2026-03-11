<template>
  <a-modal
    :open="open"
    title="BMI Calculator"
    width="420px"
    :footer="null"
    @cancel="emit('cancel')"
  >
    <!-- Unit Toggle -->
    <div class="unit-toggle">
      <a-segmented
        v-model:value="unit"
        :options="[
          { label: 'Metric (kg / cm)', value: 'metric' },
          { label: 'Imperial (lb / ft)', value: 'imperial' }
        ]"
        size="small"
        block
      />
    </div>

    <!-- Height -->
    <div class="calc-field">
      <span class="calc-label">Height</span>
      <div class="input-row">
        <template v-if="unit === 'metric'">
          <a-input-number
            v-model:value="heightCm"
            :min="50" :max="280"
            placeholder="e.g. 170"
            size="large"
            class="num-input"
          />
          <span class="unit-tag">cm</span>
        </template>
        <template v-else>
          <a-input-number
            v-model:value="heightFt"
            :min="1" :max="9"
            placeholder="ft"
            size="large"
            class="num-input num-input-sm"
          />
          <span class="unit-tag">ft</span>
          <a-input-number
            v-model:value="heightIn"
            :min="0" :max="11"
            placeholder="in"
            size="large"
            class="num-input num-input-sm"
          />
          <span class="unit-tag">in</span>
        </template>
      </div>
    </div>

    <!-- Weight -->
    <div class="calc-field">
      <span class="calc-label">Weight</span>
      <div class="input-row">
        <a-input-number
          v-model:value="weight"
          :min="1" :max="500"
          :placeholder="unit === 'metric' ? 'e.g. 65' : 'e.g. 143'"
          size="large"
          class="num-input"
        />
        <span class="unit-tag">{{ unit === 'metric' ? 'kg' : 'lb' }}</span>
      </div>
    </div>

    <!-- Result Card -->
    <div class="bmi-result" :class="bmiClass">
      <div class="bmi-number">
        {{ bmiValue !== null ? bmiValue.toFixed(1) : '—' }}
      </div>
      <div class="bmi-label-col">
        <span class="bmi-category" v-if="bmiValue !== null">{{ bmiCategory }}</span>
        <span class="bmi-hint" v-else>Enter height &amp; weight to calculate</span>
        <span class="bmi-ref" v-if="bmiValue !== null">CDC Standards</span>
      </div>
    </div>

    <!-- Reference Bar -->
    <div class="bar-section" v-if="bmiValue !== null">
      <div class="bar-labels">
        <span>Underweight</span>
        <span>Healthy</span>
        <span>Overweight</span>
        <span>Obese I</span>
        <span>Severe</span>
      </div>
      <div class="bmi-bar">
        <div class="seg seg-under"></div>
        <div class="seg seg-healthy"></div>
        <div class="seg seg-over"></div>
        <div class="seg seg-obese1"></div>
        <div class="seg seg-obese2"></div>
        <div class="bmi-marker" :style="{ left: markerPercent + '%' }"></div>
      </div>
      <div class="bar-ticks">
        <span class="tick-left">10</span>
        <span class="tick-mid" style="left:21%">18.5</span>
        <span class="tick-mid" style="left:37.5%">25</span>
        <span class="tick-mid" style="left:50%">30</span>
        <span class="tick-mid" style="left:62.5%">35</span>
        <span class="tick-right">50+</span>
      </div>
    </div>

    <!-- Category legend tags — matches AboutPage.vue -->
    <div class="tag-row" v-if="bmiValue !== null">
      <span class="tag tag-yellow">&lt; 18.5: Underweight</span>
      <span class="tag tag-green">18.5–24.9: Healthy</span>
      <span class="tag tag-yellow">25–29.9: Overweight</span>
      <span class="tag tag-red">30–34.9: Obese I</span>
      <span class="tag tag-darkred">≥ 35: Severe Obesity</span>
    </div>

    <!-- Actions -->
    <div class="modal-actions">
      <a-button @click="emit('cancel')">Cancel</a-button>
      <a-button
        type="primary"
        :disabled="bmiValue === null"
        @click="handleConfirm"
      >
        Use BMI {{ bmiValue !== null ? bmiValue.toFixed(1) : '' }}
      </a-button>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])

const unit     = ref('metric')
const heightCm = ref(null)
const heightFt = ref(null)
const heightIn = ref(null)
const weight   = ref(null)
const bmiValue = ref(null)

// Hard physiological limits
const LIMITS = {
  heightCm: [50,  280],
  heightFt: [1,   9],
  heightIn: [0,   11],
  weight:   [1,   500]   // lb and kg share the same upper cap (500 is already extreme)
}

const clampRef = (r, min, max) => {
  if (r.value == null) return
  if (r.value > max) r.value = max
  if (r.value < min) r.value = min
}

const recalc = () => {
  // Clamp every field to its physiological max before computing
  clampRef(heightCm, ...LIMITS.heightCm)
  clampRef(heightFt, ...LIMITS.heightFt)
  clampRef(heightIn, ...LIMITS.heightIn)
  clampRef(weight,   ...LIMITS.weight)

  let heightM  = null
  let weightKg = null

  if (unit.value === 'metric') {
    if (heightCm.value != null && heightCm.value > 0) heightM  = heightCm.value / 100
    if (weight.value   != null && weight.value   > 0) weightKg = weight.value
  } else {
    const totalInches = (heightFt.value ?? 0) * 12 + (heightIn.value ?? 0)
    if (totalInches > 0)                           heightM  = totalInches * 0.0254
    if (weight.value != null && weight.value > 0)  weightKg = weight.value * 0.453592
  }

  if (heightM && weightKg) {
    bmiValue.value = Math.round((weightKg / (heightM * heightM)) * 10) / 10
  } else {
    bmiValue.value = null
  }
}

// Watch every input — any change triggers clamp + recalc immediately
watch([heightCm, heightFt, heightIn, weight], recalc)

// Reset when unit changes
watch(unit, () => {
  heightCm.value = null
  heightFt.value = null
  heightIn.value = null
  weight.value   = null
  bmiValue.value = null
})

// Reset when modal opens
watch(() => props.open, (val) => {
  if (val) {
    unit.value     = 'metric'
    heightCm.value = null
    heightFt.value = null
    heightIn.value = null
    weight.value   = null
    bmiValue.value = null
  }
})

// CDC categories — identical to AboutPage.vue
const bmiCategory = computed(() => {
  if (bmiValue.value === null) return ''
  if (bmiValue.value < 18.5)  return 'Underweight'
  if (bmiValue.value < 25)    return 'Healthy'
  if (bmiValue.value < 30)    return 'Overweight'
  if (bmiValue.value < 35)    return 'Obese I'
  return 'Severe Obesity'
})

// Result card class — maps to AboutPage.vue tag colours
const bmiClass = computed(() => {
  if (bmiValue.value === null) return 'result-empty'
  if (bmiValue.value < 18.5)  return 'result-yellow'
  if (bmiValue.value < 25)    return 'result-green'
  if (bmiValue.value < 30)    return 'result-yellow'
  if (bmiValue.value < 35)    return 'result-red'
  return 'result-darkred'
})

// Map BMI 10–50 → 0–100% on the bar
const markerPercent = computed(() => {
  if (bmiValue.value === null) return 0
  return ((Math.min(50, Math.max(10, bmiValue.value)) - 10) / 40) * 100
})

const handleConfirm = () => {
  if (bmiValue.value === null) return
  emit('confirm', bmiValue.value.toFixed(1))
}
</script>

<style scoped>
.unit-toggle { margin-bottom: 18px; }

.calc-field { margin-bottom: 14px; }

.calc-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.input-row { display: flex; align-items: center; gap: 8px; }

.num-input    { width: 100%; }
.num-input-sm { width: 82px; }

.unit-tag { font-size: 13px; color: #64748b; font-weight: 600; flex-shrink: 0; }

/* ── Result card — exact AboutPage.vue tag colour values ── */
.bmi-result {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  margin: 18px 0 14px;
  transition: background 0.2s, border-color 0.2s;
}

.result-empty   { background: #f8fafc; border-color: #e2e8f0; }
.result-yellow  { background: #fffbe6; border-color: #ffe58f; }
.result-green   { background: #f6ffed; border-color: #b7eb8f; }
.result-red     { background: #fff1f0; border-color: #ffa39e; }
.result-darkred { background: #430302; border-color: #7f1d1d; }

.bmi-number {
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
  min-width: 68px;
  color: #0f172a;
}
.result-darkred .bmi-number { color: #fff; }

.bmi-label-col { display: flex; flex-direction: column; gap: 3px; }

.bmi-category { font-size: 15px; font-weight: 700; }
.result-yellow  .bmi-category { color: #d48806; }
.result-green   .bmi-category { color: #389e0d; }
.result-red     .bmi-category { color: #cf1322; }
.result-darkred .bmi-category { color: #fecaca; }

.bmi-ref  { font-size: 11px; color: #94a3b8; font-weight: 500; }
.result-darkred .bmi-ref { color: #fca5a5; }

.bmi-hint { font-size: 13px; color: #94a3b8; }

/* ── Reference bar ── */
.bar-section { margin-bottom: 14px; }

.bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.bmi-bar {
  position: relative;
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: visible;
}

.seg { flex: 1; height: 100%; }

.seg-under   { background: #ffe58f; border-radius: 999px 0 0 999px; }
.seg-healthy { background: #b7eb8f; }
.seg-over    { background: #ffe58f; }
.seg-obese1  { background: #ffa39e; }
.seg-obese2  { background: #430302; border-radius: 0 999px 999px 0; }

.bmi-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #1e293b;
  border: 2.5px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  transition: left 0.22s ease;
  z-index: 2;
}

.bar-ticks {
  position: relative;
  height: 14px;
  margin-top: 2px;
  font-size: 10px;
  color: #94a3b8;
}

.tick-left  { position: absolute; left: 0; }
.tick-right { position: absolute; right: 0; }
.tick-mid   { position: absolute; transform: translateX(-50%); }

/* ── Legend tags — copied from AboutPage.vue ── */
.tag-row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 18px; }

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.tag-green   { background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; }
.tag-yellow  { background: #fffbe6; color: #d48806; border: 1px solid #ffe58f; }
.tag-red     { background: #fff1f0; color: #cf1322; border: 1px solid #ffa39e; }
.tag-darkred { background: #430302; color: #fff; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
</style>