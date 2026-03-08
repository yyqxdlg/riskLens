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
          <p>Input your 5 core health metrics to generate a personalized radar profile. Compare your "fingerprint" against the NHANES population benchmarks.</p>
        </div>
        <div class="feature-card">
          <div class="card-icon">⏳</div>
          <h3>Risk Time Machine</h3>
          <p>Simulate how your physiological profile evolves over life stages. Our simulator accounts for <strong>Survival Bias</strong> to pinpoint peak risk years.</p>
        </div>
        <div class="feature-card">
          <div class="card-icon">📊</div>
          <h3>Peer Benchmarking</h3>
          <p>Isolated from 25,000+ real records, see exactly how you stand compared to peers with similar BMI, SBP, and Cholesterol levels.</p>
        </div>
      </div>
    </section>

    <section class="info-section">
      <h2 class="section-label">Data Sources & Clinical Categorization</h2>
      <p class="data-source-note">
        <strong>Data Source:</strong> NHANES 2011-2023. Our system strictly adheres to global standards from <strong>AHA/ACC, CDC, and NIH</strong>.
      </p>

      <div class="logic-card">
        <div class="table-wrapper">
          <table class="logic-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Clinical Reference</th>
                <th>Detailed Categorization Logic</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dim-name">Age</td>
                <td>Clinical Lifespan Stages</td>
                <td>
                  <span class="tag green">&lt;40: Young Adult</span>
                  <span class="tag">40–59: Middle-Aged (Screening)</span>
                  <span class="tag">60–74: Senior</span>
                  <span class="tag"> &gt;75: Elderly</span>
                </td>
              </tr>
              <tr>
                <td class="dim-name">BMI</td>
                <td>CDC Standards</td>
                <td>
                  <span class="tag yellow">&lt; 18.5: Underweight</span>
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
                <td class="dim-name">Total Chol</td>
                <td>NIH/ATP III Standards</td>
                <td>
                  <span class="tag green">&lt; 200: Desirable</span>
                  <span class="tag yellow">200–239: Borderline</span>
                  <span class="tag red">240–399: High</span>
                  <span class="tag dark-red">≥ 400: Extreme (Familial Risk)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="info-section">
      <h2 class="section-label">System Scoring Engine</h2>
      <p class="data-source-note">
        The following weights are used to calculate your <strong>Total Health Score</strong> and determine the risk level (Low, Moderate, High).
      </p>

      <div class="logic-card">
        <div class="card-header"><h3>Individual Metric Scoring Weights</h3></div>
        <div class="table-wrapper">
          <table class="logic-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Healthy (+1)</th>
                <th>Normal (0)</th>
                <th>Warning (-1)</th>
                <th>Risk (-2)</th>
                <th>Critical (-3)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dim-name">Age</td>
                <td><span class="badge healthy">&lt; 40</span></td>
                <td><span class="badge normal">40 - 85</span></td>
                <td>—</td><td>—</td><td>—</td>
              </tr>
              <tr>
                <td class="dim-name">BMI</td>
                <td><span class="badge healthy">18.5-24.9</span></td><td>—</td>
                <td><span class="badge warning">&lt;18.5/25-30</span></td>
                <td><span class="badge critical">30-35</span></td>
                <td><span class="badge critical">≥ 35</span></td>
              </tr>
              <tr>
                <td class="dim-name">SBP</td>
                <td><span class="badge healthy">&lt; 120</span></td><td>—</td>
                <td><span class="badge warning">120-130</span></td>
                <td><span class="badge critical">130-180</span></td>
                <td><span class="badge critical">≥ 180</span></td>
              </tr>
              <tr>
                <td class="dim-name">Chol</td>
                <td><span class="badge healthy">&lt; 200</span></td><td>—</td>
                <td><span class="badge warning">200-240</span></td>
                <td><span class="badge critical">240-400</span></td>
                <td><span class="badge critical">≥ 400</span></td>
              </tr>
              <tr>
                <td class="dim-name">Diabetes</td>
                <td><span class="badge healthy">Non-DM</span></td><td>—</td><td>—</td><td>—</td>
                <td><span class="badge critical">Diabetic</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="logic-card" style="margin-top:20px;">
        <div class="card-header"><h3>Overall Risk Classification</h3></div>
        <div class="table-wrapper">
          <table class="logic-table">
            <thead>
              <tr>
                <th>Risk Level</th>
                <th>Total Score</th>
                
                <th>Clinical Insight</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b style="color:var(--success-green)">LOW RISK</b></td>
                <td><span class="score-tag">&gt; 0</span></td>
               
                <td>High alignment with healthy population benchmarks.</td>
              </tr>
              <tr>
                <td><b style="color:var(--warning-gold)">MODERATE</b></td>
                <td><span class="score-tag">= 0</span></td>
               
                <td>Mild deviations detected; focus on warning metrics.</td>
              </tr>
              <tr>
                <td><b style="color:var(--error-red)">HIGH RISK</b></td>
                <td><span class="score-tag">&lt; 0</span></td>
              
                <td>Multiple critical deviations requiring attention.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <footer class="intro-footer">
      <p>This tool is for educational visualization. Always consult a healthcare professional for clinical diagnosis.</p>
    </footer>
  </div>
</template>

<style scoped>
/* 核心颜色变量 */
.risklens-intro-container {
  --primary-purple: #722ed1;
  --success-green: #52c41a;
  --warning-gold: #faad14;
  --error-red: #ff4d4f;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --bg-light: #f8fafc;
  --border-color: #e2e8f0;

  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-main);
}

/* Hero Section */
.hero-section { text-align: center; margin-bottom: 50px; }
.pulse-container { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
.pulse-icon {
  width: 12px; height: 12px; background: var(--success-green); border-radius: 50%;
  margin-right: 15px; box-shadow: 0 0 0 rgba(82, 196, 26, 0.4);
  animation: pulse 2s infinite;
}
.main-title { font-size: 28px; font-weight: 800; color: #003a8c; margin: 0; text-transform: uppercase; }
.hero-subtitle { font-size: 16px; color: var(--text-muted); max-width: 600px; margin: 10px auto; }

/* Info Sections */
.info-section { margin-bottom: 50px; }
.section-label { 
  font-size: 13px; color: var(--primary-purple); font-weight: 800; 
  text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; 
  display: block; border-left: 4px solid var(--primary-purple); padding-left: 12px;
}

/* Feature Cards */
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.feature-card { 
  background: #fff; padding: 20px; border-radius: 12px; 
  border: 1px solid var(--border-color); 
}
.feature-card h3 { font-size: 16px; font-weight: 700; color: #003a8c; margin-bottom: 8px; }
.feature-card p { font-size: 13px; color: var(--text-muted); margin: 0; }

/* Table Cards */
.data-source-note { 
  background: var(--bg-light); padding: 12px; border-radius: 8px; 
  border-left: 4px solid #003a8c; margin-bottom: 20px; font-size: 13px; 
}
.logic-card { 
  background: #fff; border: 1px solid var(--border-color); 
  border-radius: 12px; overflow: hidden; 
}
.card-header { background: #fafafa; padding: 10px 20px; border-bottom: 1px solid var(--border-color); }
.card-header h3 { font-size: 14px; font-weight: 700; margin: 0; }

.logic-table { width: 100%; border-collapse: collapse; text-align: left; }
.logic-table th { background: #fdfdfd; padding: 12px 20px; font-size: 11px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border-color); }
.logic-table td { padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: top; }
.dim-name { font-weight: 700; color: #003a8c; }

/* Tags & Badges */
.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; font-size: 10px; font-weight: 700; margin: 2px; }
.tag.green { background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; }
.tag.yellow { background: #fffbe6; color: #d48806; border: 1px solid #ffe58f; }
.tag.orange { background: #fff7e6; color: #d46b08; border: 1px solid #ffd591; }
.tag.red { background: #fff1f0; color: #cf1322; border: 1px solid #ffa39e; }
.tag.dark-red { background: #430302; color: #fff; }

.badge { padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; display: inline-block; }
.healthy { background: #f6ffed; color: var(--success-green); border: 1px solid #b7eb8f; }
.warning { background: #fffbe6; color: var(--warning-gold); border: 1px solid #ffe58f; }
.critical { background: #fff1f0; color: var(--error-red); border: 1px solid #ffa39e; }
.normal { background: #f9f0ff; color: var(--primary-purple); border: 1px solid #d3adf7; }
.score-tag { font-family: monospace; font-weight: 800; }

/* Intro Footer */
.intro-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: 12px; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(82, 196, 26, 0); }
  100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
}
</style>