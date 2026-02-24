const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/riskLens/'
    : '/',
    
  // 如果你想让打包后的文件直接输出到 docs 文件夹而不是 dist
  // 这样你提交代码后，GitHub Pages 就能直接识别
  outputDir: 'docs'
})
