<template>
  <div class="top-filter">
    <template v-if="activeRows.length">
      <div v-for="row in activeRows" :key="row.key" class="filter-row">
        <span class="filter-label">{{ row.label }}:</span>
        <div class="chip-list">
          <span
            v-for="item in row.values"
            :key="`${row.key}-${item}`"
            class="chip"
            :class="`chip-${row.key}`"
          >
            <span>{{ item }}</span>
            <button
              type="button"
              class="chip-close"
              @click.stop="emit('remove', { key: row.key, value: item })"
              aria-label="Remove filter"
            >
              ×
            </button>
          </span>
        </div>
      </div>
    </template>
    <span v-else class="empty-text">No active filters. Enter values or brush bars to start.</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeFilters: {
    type: Object,
    default: () => ({
      ageGroup: [],
      bmiGroup: [],
      bpGroup: [],
      lipidGroup: [],
      diabetesLabel: []
    })
  }
})

const emit = defineEmits(['remove'])

const filterMeta = [
  { key: 'ageGroup', label: 'Age' },
  { key: 'bmiGroup', label: 'BMI' },
  { key: 'bpGroup', label: 'SBP' },
  { key: 'lipidGroup', label: 'CHOL' },
  { key: 'diabetesLabel', label: 'Diabetes' }
]

const activeRows = computed(() =>
  filterMeta
    .map(meta => ({
      ...meta,
      values: Array.isArray(props.activeFilters?.[meta.key]) ? props.activeFilters[meta.key] : []
    }))
    .filter(row => row.values.length > 0)
)
</script>

<style scoped>
.top-filter {
  width: 100%;
  min-height: 34px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.filter-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.chip-close {
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 999px;
  padding: 0;
  line-height: 1;
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
  cursor: pointer;
  font-size: 12px;
}

.chip-ageGroup {
  background: #ecfdf3;
  color: #166534;
  border-color: #bbf7d0;
}

.chip-bmiGroup {
  background: #ecfeff;
  color: #0f766e;
  border-color: #bae6fd;
}

.chip-bpGroup {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.chip-lipidGroup {
  background: #fff7ed;
  color: #c2410c;
  border-color: #fed7aa;
}

.chip-diabetesLabel {
  background: #f5f3ff;
  color: #6d28d9;
  border-color: #ddd6fe;
}

.empty-text {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}
</style>
