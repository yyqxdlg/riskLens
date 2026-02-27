<template>
  <div class="team-page-container">
    <header class="team-header">
      <div class="pulse-container">
        <div class="pulse-icon"></div>
        <h1 class="main-title">Team Engineering Group</h1>
      </div>
      <p class="team-subtitle">
        Collaborators in clinical data visualization & software engineering. (KTH Project Group 2025)
      </p>
    </header>

    <section class="photo-section">
      <div class="fingerprint-bg">
        <svg viewBox="0 0 500 500" class="fingerprint-svg">
          <path d="M250,50c-110.5,0-200,89.5-200,200s89.5,200,200,200s200-89.5,200-200S360.5,50,250,50z M250,400c-82.8,0-150-67.2-150-150s67.2-150,150-150s150,67.2,150,150S332.8,400,250,400z" />
          <path d="M250,100c-82.8,0-150,67.2-150,150s67.2,150,150,150s150-67.2,150-150S332.8,100,250,100z M250,350c-55.2,0-100-44.8-100-100s44.8-100,100-100s100,44.8,100,100S305.2,350,250,350z" opacity="0.5"/>
        </svg>
      </div>

      <div class="photo-wrapper">
        <img 
          src="@/assets/team-photo.svg" 
          alt="RiskLens Project Team SVG" 
          class="team-photo-svg"
        />
        <div class="photo-caption">
          <span>KTH Royal Institute of Technology, Stockholm</span>
        </div>
      </div>
    </section>

    <footer class="team-footer">
      <p>Data visualization engineering by KTH Information Visualization Group 7.</p>
    </footer>
  </div>
</template>

<style scoped>
.team-page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #1e293b;
  position: relative;
  overflow: hidden;
}

/* Hero Title Styles (与 AboutPage 保持一致) */
.team-header {
  text-align: center;
  margin-bottom: 50px;
  position: relative;
  z-index: 5;
}
.pulse-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.pulse-icon {
  width: 12px; height: 12px; background: #52c41a; border-radius: 50%;
  margin-right: 15px; box-shadow: 0 0 0 rgba(82, 196, 26, 0.4);
  animation: pulse 2s infinite;
}
.main-title { font-size: 32px; font-weight: 800; color: #003a8c; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
.team-subtitle { font-size: 16px; color: #64748b; max-width: 700px; margin: 10px auto; }

/* Photo Section & Fingerprint Background */
.photo-section {
  position: relative;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fingerprint-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  opacity: 0.04; /* 极淡的紫色背景装饰 */
  z-index: 1;
}
.fingerprint-svg {
  width: 100%;
  height: 100%;
  fill: #722ed1; /* 延续紫色的生理画像主题 */
}

/* The SVG Photo Frame */
.photo-wrapper {
  position: relative;
  z-index: 5;
  background: #fff;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); /* mastery 级别的质感阴影 */
  border: 1px solid #f0f0f0;
  transition: transform 0.3s ease;
  max-width: 900px; /* 限制 SVG 文件的最大显示宽度 */
  min-width: 700px;
}
.photo-wrapper:hover {
  transform: translateY(-5px); /* 悬停浮动效果 */
}
.team-photo-svg {
  width: 100%;
  height: auto; /* 自动调整高度以保持比例 */
  display: block;
  border-radius: 8px; /* 给 SVG 加上一点圆角，更显高级 */
}
.photo-caption {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

/* Footer Hint */
.team-footer {
  text-align: center;
  margin-top: 50px;
  color: #bfbfbf;
  font-size: 11px;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(82, 196, 26, 0); }
  100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
}
</style>