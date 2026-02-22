  <template>
  <div>
   <div class="topFilter">
      <div v-for="(value, key, index) in activeFiltersData" :key="key" class="filterContainer" >
        <div class="filterLable"  v-if="value.length">
          {{lableArray[index]}}:
        </div>
        <div class="filerContentBox" v-if="value.length">
          <div v-for="sItem in value" :key="'sItem'+sItem" class="filterItem">
            <a-tag :bordered="false" :color="colorArray[index]">{{sItem}}</a-tag>
          </div>
        </div>
      </div>
    </div>
            
  </div>
</template>

<script setup>
import {ref, watch} from 'vue'
  const props = defineProps({  
    activeFilters: Object,
  })
  // const activeFiltersData = ref({
  //   ageGroup: ['Middle-Aged', 'Senior', 'Elderly'],   // 可能包含: {"Middle-Aged", "Senior"}
  //   bmiGroup: ['Obese I'],   // 可能包含: {"Obese I"}
  //   bpGroup: ['Normal', 'Elevated'],     // 
  //   lipidGroup: ['Desirable', 'Borderline', 'Extreme'],
  //   diabetesLabel: ['Diabetic'],
  // });
  const activeFiltersData = ref(props.activeFilters)
  console.log(activeFiltersData.value, 'activeFiltersData')
  const lableArray = ['Age', 'BMI', 'SBP', 'CHOL', 'DIABETES']
  const colorArray = ['green', 'cyan', 'blue', 'volcano' , 'purple']
  watch(() => props.activeFilters, (newValue) => {
    if(newValue && !newValue.ageGroup.length && !newValue.bmiGroup.length&& !newValue.bpGroup.length&& !newValue.lipidGroup.length&& !newValue.diabetesLabel.length){
      activeFiltersData.value = {
        ageGroup: ['Young Adult','Middle-Aged', 'Senior', 'Elderly'],   // 可能包含: {"Middle-Aged", "Senior"}
        bmiGroup: ['Underweight', 'Healthy', 'Overweight', 'Obese I', 'Severe Obesity'],   // 可能包含: {"Obese I"}
        bpGroup: ['Low', 'Normal', 'Elevated', 'Stage 1', 'Stage 2','Crisis'],     // 
        lipidGroup: ['Desirable', 'Borderline','High', 'Extreme'],
        diabetesLabel: ['Non-Diabetic', 'Diabetic'],
      };
    }else{
      activeFiltersData.value = newValue;
    }
    
    
  })
</script>

<style scoped>
.topFilter{
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
}
.filterContainer{
  display: flex;
  align-items: center;
  margin: 5px;
}
.filerContentBox{
  display: flex;
}
.filterItem{
  margin: 3px 0 3px 5px;
}
</style>