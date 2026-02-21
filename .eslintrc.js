module.exports = {
  env: {
    node: true,
    // 关键：允许在 setup 语法糖中使用 defineProps 等宏
    'vue/setup-compiler-macros': true, 
  },
  // 确保你有 vue3 的插件
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
  ],
};