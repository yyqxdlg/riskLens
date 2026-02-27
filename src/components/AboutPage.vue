<template>
  <div class="risklens-intro-container">
    <header class="hero-section">
      <div class="pulse-container">
        <div class="pulse-icon"></div>
        <h1 class="main-title">RiskLens: Clinical Risk Sensemaking</h1>
      </div>
      <p class="hero-subtitle">
        Bridging the gap between raw clinical datasets and human-centric cardiovascular health insights.
      </p>
    </header>

    <section class="info-section">
      <h2 class="section-label">How It Works & Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="card-icon">🎯</div>
          <h3>Clinical Fingerprinting</h3>
          <p>Input your 5 core health metrics to generate a personalized radar profile. Compare your "fingerprint" against the NHANES population benchmarks in real-time.</p>
        </div>
        <div class="feature-card">
          <div class="card-icon">⏳</div>
          <h3>Risk Time Machine</h3>
          <p>Simulate how your current physiological profile evolves over life stages. Our simulator accounts for <strong>Survival Bias</strong> to pinpoint your true peak risk years.</p>
        </div>
        <div class="feature-card">
          <div class="card-icon">📊</div>
          <h3>Peer Benchmarking</h3>
          <p>Isolated from 25,000+ real records (NHANES 2011-2023), see exactly how you stand compared to peers with similar BMI, SBP, and Cholesterol levels.</p>
        </div>
      </div>
    </section>

    <section class="info-section">
      <h2 class="section-label">Data Sources & Clinical Categorization</h2>
      <p class="data-source-note">
        <strong>Data Source:</strong> National Health and Nutrition Examination Survey (NHANES) 2011-2023.
        Our system strictly adheres to global standards from <strong>AHA/ACC, CDC, and NIH</strong>.
      </p>

      <div class="standards-table-wrapper">
        <table class="standards-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Clinical Reference</th>
              <th>Categorization Logic</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="dim-name">Age</td>
              <td>Clinical Lifespan Stages</td>
              <td>
                <span class="tag">&lt;40: Young Adult</span>
                <span class="tag">40–59: Middle-Aged (Screening Window)</span>
                <span class="tag">60–74: Senior</span>
                <span class="tag"> &gt;75: Elderly</span>
              </td>
            </tr>
            <tr>
              <td class="dim-name">BMI</td>
              <td>CDC Standards</td>
              <td>
                <span class="tag green">&lt; 18.5: Underweight</span>
                <span class="tag green">18.5–24.9: Healthy</span>
                <span class="tag yellow">25.0–29.9: Overweight</span>
                <span class="tag red">30.0–34.9: Obese I</span>
                <span class="tag dark-red">≥ 35.0: Severe Obesity</span>
              </td>
            </tr>
            <tr>
              <td class="dim-name">Systolic BP</td>
              <td>2017 AHA/ACC Guidelines</td>
              <td>
                <span class="tag green">&lt; 120: Normal</span>
                <span class="tag yellow">120–129: Elevated</span>
                <span class="tag orange">130–139: Stage 1</span>
                <span class="tag red">140–179: Stage 2</span>
                <span class="tag dark-red">≥ 180: Crisis</span>
              </td>
            </tr>
            <tr>
              <td class="dim-name">Total Cholesterol</td>
              <td>NIH/ATP III Standards</td>
              <td>
                <span class="tag green">&lt; 200: Desirable</span>
                <span class="tag yellow">200–239: Borderline</span>
                <span class="tag red">240–399: High</span>
                <span class="tag dark-red">≥ 400: Extreme (Familial Risk)</span>
              </td>
            </tr>
            <tr>
              <td class="dim-name">Diabetes & CVD</td>
              <td>Binary Classification</td>
              <td>
                Mapped as 0 (Non-Diabetic/CVD) or 1 (Diabetic/CVD) to determine major risk attribution and historical peer patterns.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <footer class="intro-footer">
      <p>This tool is designed for educational visualization of population trends. Always consult a healthcare professional for clinical diagnosis.</p>
    </footer>
  </div>
</template>

<script setup>
// No logic needed for static intro, but kept for consistency
</script>

<style scoped>
.risklens-intro-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
  line-height: 1.6;
}

/* Hero Styles */
.hero-section {
  text-align: center;
  margin-bottom: 60px;
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
.hero-subtitle { font-size: 18px; color: #64748b; max-width: 700px; margin: 10px auto; }

/* Info Section */
.info-section { margin-bottom: 50px; }
.section-label { font-size: 14px; color: #52c41a; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 25px; border-bottom: 2px solid #f0fdf4; display: inline-block; }

/* Feature Cards */
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.feature-card { background: #fff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; transition: transform 0.3s ease; }
.feature-card:hover { transform: translateY(-5px); border-color: #b7eb8f; }
.card-icon { font-size: 24px; margin-bottom: 15px; }
.feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: #003a8c; }
.feature-card p { font-size: 14px; color: #475569; margin: 0; }

/* Table Styles */
.data-source-note { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #003a8c; margin-bottom: 20px; font-size: 14px; }
.standards-table-wrapper { overflow-x: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
.standards-table { width: 100%; border-collapse: collapse; text-align: left; }
.standards-table th { background: #f8fafc; padding: 15px; font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
.standards-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: top; }
.dim-name { font-weight: 700; color: #003a8c; width: 150px; }

/* Tags */
.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; font-size: 11px; font-weight: 700; margin: 2px; color: #475569; }
.tag.green { background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; }
.tag.yellow { background: #fffbe6; color: #d48806; border: 1px solid #ffe58f; }
.tag.orange { background: #fff7e6; color: #d46b08; border: 1px solid #ffd591; }
.tag.red { background: #fff1f0; color: #cf1322; border: 1px solid #ffa39e; }
.tag.dark-red { background: #430302; color: #fff; }

/* Footer */
.intro-footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(82, 196, 26, 0); }
  100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
}
</style>