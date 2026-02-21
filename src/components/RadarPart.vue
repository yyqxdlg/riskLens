<template>
  <div>
    RadarPart
    <a-button @click="sendData">test</a-button>        
  </div>
</template>

<script setup>
const props = defineProps({
  tableData: Array,
})
const emit = defineEmits(['updateCount'])
const sendData = () => {
  // 触发事件
  emit('updateCount', 100);
};
console.log(props.tableData)

</script>

<style lang="scss" scoped>

</style>