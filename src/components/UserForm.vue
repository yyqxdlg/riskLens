<template>
  <div>
    <a-form
      :model="formState"
      name="uesrForm"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      
    >
     <a-row :gutter="24">
      <a-col  flex="1">
        <a-form-item
          label="age"
          name="age"
        >
          <a-input v-model:value="formState.age" />
        </a-form-item>
      </a-col>
      <a-col flex="1">
        <a-form-item
          label="age"
          name="age"
        >
          <a-input v-model:value="formState.age" />
        </a-form-item>
      </a-col>
      <a-col flex="1">
        <a-form-item
          label="age"
          name="age"
        >
          <a-input v-model:value="formState.age" />
        </a-form-item>
      </a-col>
      <a-col flex="1">
        <a-form-item
          label="age"
          name="age"
        >
          <a-input v-model:value="formState.age" />
        </a-form-item>
      </a-col>
      <a-col flex="1">
        <a-form-item
          label="age"
          name="age"
        >
          <a-input v-model:value="formState.age" />
        </a-form-item>
      </a-col>
     
     </a-row>
     
    </a-form>
            
  </div>
</template>

<script setup>
import {ref} from 'vue'

  const formState = ref({
    age: '',
  })
</script>

<style lang="scss" scoped>

</style>