<template>
  <div class="about-page">
    <section class="hero-card">
      <div class="hero-badge">
        <InfoCircleOutlined />
        <span>About RiskLens</span>
      </div>
      <h1>RiskLens: Clinical Risk Sensemaking</h1>
      <p class="hero-copy">
        RiskLens is an interactive   visualization website for exploring cardiovascular-related health factors.
        Users can enter their own clinical measurements, review a heuristic profile score, compare themselves with the
        overall and filtered population, and inspect how changes in metrics affect the resulting profile.
      </p>
      <p class="hero-note">
        This project is designed for   data visualization purposes and does not provide medical advice or clinical diagnosis.
      </p>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon purple">
          <BulbOutlined />
        </div>
        <div>
          <p class="section-kicker">Project Overview</p>
          <h2>What this website does</h2>
        </div>
      </div>

      <div class="overview-grid">
        <div class="mini-card">
          <div class="mini-icon"><ProfileOutlined /></div>
          <h3>Clinical Fingerprinting</h3>
          <p>
            Enter core health metrics and generate a personal profile that summarizes the user’s clinical status.
          </p>
        </div>
        <div class="mini-card">
          <div class="mini-icon"><AimOutlined /></div>
          <h3>Peer Comparison</h3>
          <p>
            Compare personal values against the overall cohort and filtered subgroups to understand where the user fits within the population.
          </p>
        </div>
        <div class="mini-card">
          <div class="mini-icon"><RocketOutlined /></div>
          <h3>Risk Simulation</h3>
          <p>
            Explore how changes across life stages and metric values may affect the resulting   risk profile.
          </p>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon blue">
          <TeamOutlined />
        </div>
        <div>
          <p class="section-kicker">Team</p>
          <h2>Team Members & Workload Distribution</h2>
        </div>
      </div>

      <div class="team-grid">
        <div class="team-card">
          <div class="member-top">
            <div class="member-avatar">YZ</div>
            <div>
              <h3>YU ZHANG</h3>
              <p class="workload">Workload: 50%</p>
            </div>
          </div>
          <ul>
            <li>Literature review and background research</li>
            <li>Raw data download, cleaning, and preprocessing</li>
            <li>Project planning and design</li>
            <li>Implementation of the summary view, radar view, and risk simulator</li>
            <li>Bug fixing, testing</li>
          </ul>
        </div>

        <div class="team-card">
          <div class="member-top">
            <div class="member-avatar alt">LZ</div>
            <div>
              <h3>ZIFEI LIU</h3>
              <p class="workload">Workload: 50%</p>
            </div>
          </div>
          <ul>
            <li>Literature review and background research</li>
            <li>Project planning and design</li>
            <li>Implementation of the onboarding flow, range comparison, and user form modules</li>
            <li>UI refinement and layout optimization</li>
            <li>Bug fixing and testing</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon teal">
          <DatabaseOutlined />
        </div>
        <div>
          <p class="section-kicker">Data</p>
          <h2>Data Abstraction & Provenance</h2>
        </div>
      </div>

      <div class="two-col-grid">
        <div class="info-block">
          <div class="block-label">
            <ApartmentOutlined />
            <span>Data Abstraction</span>
          </div>
          <ul class="detail-list">
            <li>
              <strong>Data subjects:</strong>
              individual NHANES participants represented as person-level records in the analysis pipeline.
            </li>
            <li>
              <strong>Primary attributes:</strong>
              age, BMI, systolic blood pressure, total cholesterol, and diabetes status.
            </li>
            <li>
              <strong>Derived categories:</strong>
              age group, BMI category, blood pressure category, cholesterol category, and diabetes diagnosis status.
            </li>
            <li>
              <strong>Computed outputs:</strong>
              metric-level scores, overall profile score, risk category, subgroup comparison summaries, and simulation results.
            </li>
            <li>
              <strong>Visual abstraction:</strong>
              raw clinical values are transformed into interpretable categories, scores, and comparative views to support user sensemaking.
            </li>
          </ul>
        </div>

        <div class="info-block">
          <div class="block-label">
            <FileSearchOutlined />
            <span>Data Provenance</span>
          </div>
          <ul class="detail-list">
            <li>
              The project uses publicly available NHANES data provided by the
              <strong>Centers for Disease Control and Prevention (CDC)</strong>.
            </li>
            <li>
              Multiple NHANES survey-cycle files were downloaded, cleaned, merged, and transformed into the fields used by the interface.
            </li>
            <li>
              Thresholds shown in the system were adapted from public-health references and class discussion for   visualization purposes.
            </li>
            <li>
              The website is intended as an interpretive classroom visualization rather than a medical prediction system.
            </li>
            <li>
              All visual summaries depend on processed public datasets rather than live medical records.
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon orange">
          <NodeIndexOutlined />
        </div>
        <div>
          <p class="section-kicker">Tasks</p>
          <h2>Task Abstraction & Distribution</h2>
        </div>
      </div>

      <div class="task-version-block">
        <div class="task-version-head">
          <h3>Overall Version</h3>
          <p>The Overall task summary focuses on the core interactions implemented in the current system.</p>
        </div>
        <div class="task-grid">
          <div class="task-card">
            <div class="task-icon"><SearchOutlined /></div>
            <h3>Identify</h3>
            <p>Identify personal health status from entered clinical metrics.</p>
          </div>
          <div class="task-card">
            <div class="task-icon"><BarChartOutlined /></div>
            <h3>Compare</h3>
            <p>Compare personal values against the overall population and filtered peer groups.</p>
          </div>
          <div class="task-card">
            <div class="task-icon"><FundOutlined /></div>
            <h3>Inspect</h3>
            <p>Inspect how each metric contributes to the overall clinical profile score.</p>
          </div>
          <div class="task-card">
            <div class="task-icon"><SyncOutlined /></div>
            <h3>Simulate</h3>
            <p>Simulate how metric changes may alter the resulting profile over time.</p>
          </div>
        </div>
      </div>

      <div class="task-version-block alt">
        <div class="task-version-head">
          <h3>Munzner-style Version</h3>
          <p>This version rewrites the system tasks using a why–what–how task abstraction structure.</p>
        </div>
        <div class="task-scheme-grid">
          <div class="scheme-card">
            <h4>Why</h4>
            <ul class="detail-list compact">
              <li>Discover how a user’s measurements relate to broader cardiovascular-risk patterns.</li>
              <li>Compare the user with the overall cohort and filtered peer subgroups.</li>
              <li>Explore how changed measurements may shift the   risk profile over time.</li>
            </ul>
          </div>
          <div class="scheme-card">
            <h4>What</h4>
            <ul class="detail-list compact">
              <li>Person-level attributes: age, BMI, systolic blood pressure, cholesterol, and diabetes status.</li>
              <li>Derived categories, subgroup summaries, heuristic scores, and risk labels.</li>
              <li>Relations between the user, the overall population, and selected subgroups.</li>
            </ul>
          </div>
          <div class="scheme-card">
            <h4>How</h4>
            <ul class="detail-list compact">
              <li>Onboarding and direct form input collect the user profile.</li>
              <li>Summary, radar, and range views support comparison, filtering, and subgroup selection.</li>
              <li>The time-machine view supports what-if exploration across life stages and metric changes.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="task-version-block">
        <div class="task-version-head">
          <h3>User Task Version</h3>
          <p>This version presents the tasks from the user’s perspective and matches the current workflow more directly.</p>
        </div>
        <div class="task-user-grid">
          <div class="task-user-card">
            <h4>Enter and confirm my profile</h4>
            <p>Provide age, BMI, blood pressure, cholesterol, and diabetes information through onboarding or the form, then confirm the profile used for analysis.</p>
          </div>
          <div class="task-user-card">
            <h4>See where I fit</h4>
            <p>Understand where my values fall relative to the cohort through summary cards, radar comparison, and dashed markers in the aligned range view.</p>
          </div>
          <div class="task-user-card">
            <h4>Filter and compare subgroups</h4>
            <p>Click categories in the range comparison view, refine subgroup filters, and inspect how selected peers differ from the full population.</p>
          </div>
          <div class="task-user-card">
            <h4>Test what-if changes</h4>
            <p>Use the simulator and time-machine view to see how changing measurements or life stage may alter the   risk profile.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon red">
          <BarChartOutlined />
        </div>
        <div>
          <p class="section-kicker">Scoring</p>
          <h2>Clinical Scoring Logic</h2>
        </div>
      </div>

      <p class="section-copy">
        The following score table is a heuristic   summary used to support comparison and interpretation in the visualization.
        It is not intended as a clinical diagnosis or formal medical risk model.
      </p>

      <div class="logic-card">
        <div class="card-header">
          <h3>Individual Metric Scoring Weights</h3>
        </div>
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
                <td><span class="badge normal">≥ 40</span></td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
              <tr>
                <td class="dim-name">BMI</td>
                <td><span class="badge healthy">18.5–24.9</span></td>
                <td>—</td>
                <td><span class="badge warning">&lt;18.5 / 25–30</span></td>
                <td><span class="badge risk">30–35</span></td>
                <td><span class="badge critical">≥ 35</span></td>
              </tr>
              <tr>
                <td class="dim-name">SBP</td>
                <td><span class="badge healthy">&lt; 120</span></td>
                <td>—</td>
                <td><span class="badge warning">120–130</span></td>
                <td><span class="badge risk">130–180</span></td>
                <td><span class="badge critical">≥ 180</span></td>
              </tr>
              <tr>
                <td class="dim-name">Chol</td>
                <td><span class="badge healthy">&lt; 200</span></td>
                <td>—</td>
                <td><span class="badge warning">200–240</span></td>
                <td><span class="badge risk">240–400</span></td>
                <td><span class="badge critical">≥ 400</span></td>
              </tr>
              <tr>
                <td class="dim-name">Diabetes</td>
                <td><span class="badge healthy">No Diabetes</span></td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td><span class="badge critical">Diabetes</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="logic-card overall-card">
        <div class="card-header">
          <h3>Overall Risk Classification</h3>
        </div>
        <div class="table-wrapper">
          <table class="logic-table">
            <thead>
              <tr>
                <th>Risk Level</th>
                <th>Total Score</th>
                <th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong class="low-text">LOW RISK</strong></td>
                <td><span class="score-tag">&gt; 0</span></td>
                <td>Higher alignment with healthier population benchmarks.</td>
              </tr>
              <tr>
                <td><strong class="mid-text">MODERATE</strong></td>
                <td><span class="score-tag">= 0</span></td>
                <td>Mixed profile with warning-level deviations.</td>
              </tr>
              <tr>
                <td><strong class="high-text">HIGH RISK</strong></td>
                <td><span class="score-tag">&lt; 0</span></td>
                <td>Multiple risk-related deviations in the   scoring summary.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon gold">
          <MessageOutlined />
        </div>
        <div>
          <p class="section-kicker">Feedback</p>
          <h2>Feedback Incorporation & Design Decisions</h2>
        </div>
      </div>

      <div class="feedback-grid">
        <div class="feedback-card">
          <h3>Clarifying diabetes labels</h3>
          <p><strong>Feedback:</strong> Users asked whether the diabetes field referred to Type 1 or Type 2 diabetes.</p>
          <p><strong>Response:</strong> We present diabetes as a binary status only and avoid implying a more specific subtype classification.</p>
          <p><strong>Design reasoning:</strong> The dataset only records whether the participant has diabetes, not a reliable Type 1 / Type 2 distinction, so the interface should stay at the level supported by the data.</p>
        </div>

        <div class="feedback-card">
          <h3>Reduce input friction during onboarding</h3>
          <p><strong>Feedback:</strong> Entering every value at once felt heavy, especially for first-time visitors who may only know part of their measurements.</p>
          <p><strong>Response:</strong> We kept the step-by-step onboarding flow and skip behavior so users can enter known values gradually before reviewing the dashboard.</p>
          <p><strong>Design reasoning:</strong> Progressive input lowers cognitive load while still allowing confirm to convert entered values into the final subgroup filters.</p>
        </div>

        <div class="feedback-card">
          <h3>Built-in BMI calculator</h3>
          <p><strong>Feedback:</strong> Users may not know their BMI and would otherwise need to leave the website.</p>
          <p><strong>Response:</strong> We added a built-in BMI calculator directly into the user workflow.</p>
          <p><strong>Design reasoning:</strong> This reduces friction during input and keeps the interaction self-contained.</p>
        </div>

        <div class="feedback-card">
          <h3>Aligned subgroup bars across dimensions</h3>
          <p><strong>Feedback:</strong> The range comparison rows were harder to scan when dimensions had different category counts and bar positions shifted from row to row.</p>
          <p><strong>Response:</strong> We aligned all bars to the same slot structure, using the maximum number of categories and leaving unused slots empty on the right.</p>
          <p><strong>Design reasoning:</strong> This preserves consistent horizontal positions across age, BMI, blood pressure, cholesterol, and diabetes while still acknowledging that some dimensions have fewer categories.</p>
        </div>

        <div class="feedback-card">
          <h3>Show the user’s confirmed position more clearly</h3>
          <p><strong>Feedback:</strong> Users wanted a clearer cue for where their confirmed values land inside the subgroup comparison view.</p>
          <p><strong>Response:</strong> We added a centered dashed marker line that appears only for dimensions with an actual confirmed user input.</p>
          <p><strong>Design reasoning:</strong> This highlights the user’s current location without inventing defaults or showing misleading markers when no value was entered.</p>
        </div>

        <div class="feedback-card">
          <h3>Clarify confirm versus manual subgroup selection</h3>
          <p><strong>Feedback:</strong> Users needed chart clicking for free exploration, but also expected Confirm to fully reset the filters to match only the inputs they provided.</p>
          <p><strong>Response:</strong> We separated the two behaviors: chart clicks support exploratory subgroup selection, while Confirm overwrites filters using the entered inputs and clears dimensions that were left blank.</p>
          <p><strong>Design reasoning:</strong> This keeps casual exploration flexible but makes the confirmed profile deterministic and easier to understand.</p>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon green">
          <RocketOutlined />
        </div>
        <div>
          <p class="section-kicker">Future Work</p>
          <h2>Possible Extensions</h2>
        </div>
      </div>

      <div class="future-grid">
        <div class="future-card">
          <h3>More personalized peer positioning</h3>
          <p>
            Add clearer percentile-based or rank-based summaries to help users more directly understand where they fall within relevant peer groups.
          </p>
        </div>
        <div class="future-card">
          <h3>Expanded health variables</h3>
          <p>
            Incorporate additional clinical or lifestyle attributes, such as smoking, exercise, or family history, when reliable data support is available.
          </p>
        </div>
        <div class="future-card">
          <h3>Improved scoring transparency</h3>
          <p>
            Provide more detailed explanations of how each metric contributes to the total profile and allow users to inspect alternative weighting strategies.
          </p>
        </div>
        <div class="future-card">
          <h3>More polished deployment support</h3>
          <p>
            Further refine responsiveness, embedded demo support, and explanatory content for broader audiences and presentation settings.
          </p>
        </div>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon gray">
          <LinkOutlined />
        </div>
        <div>
          <p class="section-kicker">References</p>
          <h2>Citations, References & Project Links</h2>
        </div>
      </div>

      <div class="two-col-grid">
        <div class="info-block">
          <div class="block-label">
            <LinkOutlined />
            <span>Project Links</span>
          </div>
          <ul class="link-list">
            <li>
              <strong>Source Code:</strong>
              <a href="https://github.com/yyqxdlg/riskLens/tree/main" target="_blank" rel="noopener noreferrer">
                https://github.com/yyqxdlg/riskLens/tree/main
              </a>
            </li>
            <li>
              <strong>Used Data:</strong>
              <a href="https://wwwn.cdc.gov/nchs/nhanes/default.aspx" target="_blank" rel="noopener noreferrer">
                https://wwwn.cdc.gov/nchs/nhanes/default.aspx
              </a>
            </li>
            <li>
              <strong>Live Website / Demo Link:</strong>
              <a href="https://yyqxdlg.github.io/riskLens/" target="_blank" rel="noopener noreferrer">
                https://yyqxdlg.github.io/riskLens/
              </a>
            </li>
          </ul>
        </div>

        <div class="info-block">
          <div class="block-label">
            <BookOutlined />
            <span>References</span>
          </div>
          <ul class="link-list">
            <li>Centers for Disease Control and Prevention. National Health and Nutrition Examination Survey (NHANES).</li>
            <li>CDC guidance on body mass index (BMI) interpretation and related health categories.</li>
            <li>2017 ACC/AHA guideline references for systolic blood pressure categorization.</li>
          </ul>
        </div>
      </div>
    </section>

    <footer class="footer-note">
      RiskLens is an   visualization project built for course use. For medical decisions, please consult a licensed healthcare professional.
    </footer>
  </div>
</template>

<script setup>
import {
  InfoCircleOutlined,
  BulbOutlined,
  TeamOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  BarChartOutlined,
  MessageOutlined,
  RocketOutlined,
  LinkOutlined,
  BookOutlined,
  ProfileOutlined,
  AimOutlined,
  ApartmentOutlined,
  FileSearchOutlined,
  SearchOutlined,
  FundOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
</script>

<style scoped>
.about-page {
  --primary: #722ed1;
  --primary-soft: rgba(114, 46, 209, 0.08);
  --text-main: #0f172a;
  --text-sub: #475569;
  --border: #e2e8f0;
  --bg-soft: #f8fafc;
  --success: #52c41a;
  --warning: #faad14;
  --risk: #ff7a45;
  --critical: #ff4d4f;

  max-width: 1080px;
  margin: 0 auto;
  padding: 36px 20px 56px;
  color: var(--text-main);
  font-family: 'Inter', system-ui, sans-serif;
}

.hero-card,
.section-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.hero-card {
  padding: 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #faf7ff 100%);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(114, 46, 209, 0.1);
  color: var(--primary);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 16px;
}

.hero-card h1 {
  margin: 0 0 14px;
  font-size: 34px;
  font-weight: 800;
  color: var(--text-main);
}

.hero-copy,
.hero-note,
.section-copy {
  color: var(--text-sub);
  line-height: 1.78;
  font-size: 15px;
}

.hero-note {
  margin-top: 12px;
}

.section-card {
  padding: 26px;
  margin-bottom: 22px;
}

.section-heading {
  margin-bottom: 18px;
}

.with-icon {
  display: flex;
  align-items: center;
  gap: 14px;
}

.heading-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.heading-icon.purple {
  background: rgba(114, 46, 209, 0.12);
  color: #722ed1;
}

.heading-icon.blue {
  background: rgba(24, 144, 255, 0.12);
  color: #1677ff;
}

.heading-icon.teal {
  background: rgba(19, 194, 194, 0.12);
  color: #08979c;
}

.heading-icon.orange {
  background: rgba(250, 140, 22, 0.12);
  color: #d46b08;
}

.heading-icon.red {
  background: rgba(255, 77, 79, 0.12);
  color: #cf1322;
}

.heading-icon.gold {
  background: rgba(250, 173, 20, 0.14);
  color: #d48806;
}

.heading-icon.green {
  background: rgba(82, 196, 26, 0.12);
  color: #389e0d;
}

.heading-icon.gray {
  background: rgba(100, 116, 139, 0.12);
  color: #475569;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--primary);
}

.section-heading h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.overview-grid,
.team-grid,
.task-grid,
.two-col-grid,
.future-grid,
.feedback-grid {
  display: grid;
  gap: 18px;
}

.overview-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.team-grid,
.two-col-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.task-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.future-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.feedback-grid {
  grid-template-columns: 1fr;
}

.mini-card,
.team-card,
.task-card,
.info-block,
.future-card,
.feedback-card {
  border: 1px solid var(--border);
  background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
  border-radius: 18px;
  padding: 18px;
}

.mini-card {
  position: relative;
  overflow: hidden;
}

.mini-icon,
.task-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(114, 46, 209, 0.09);
  color: #722ed1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 12px;
}

.mini-card h3,
.team-card h3,
.task-card h3,
.info-block h3,
.future-card h3,
.feedback-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: var(--text-main);
}

.mini-card p,
.task-card p,
.info-block li,
.team-card li,
.link-list li,
.future-card p,
.feedback-card p {
  color: var(--text-sub);
  line-height: 1.75;
}

.task-version-block {
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px;
  background: #fff;
}

.task-version-block + .task-version-block {
  margin-top: 18px;
}

.task-version-block.alt {
  background: linear-gradient(180deg, #ffffff 0%, #fcfaff 100%);
}

.task-version-head {
  margin-bottom: 16px;
}

.task-version-head h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
}

.task-version-head p {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.65;
}

.task-scheme-grid,
.task-user-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.task-user-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.scheme-card,
.task-user-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  background: #fff;
}

.scheme-card h4,
.task-user-card h4 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
}

.task-user-card p {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.65;
}

.detail-list.compact li {
  margin-bottom: 10px;
}

.team-card ul,
.info-block ul,
.link-list {
  margin: 0;
  padding-left: 18px;
}

.member-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.member-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
}

.member-avatar.alt {
  background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.workload {
  margin: 0;
  font-weight: 700;
  color: #003a8c;
}

.block-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 12px;
  margin-bottom: 14px;
  color: #334155;
  font-weight: 700;
  font-size: 13px;
}

.detail-list {
  margin: 0;
  padding-left: 18px;
}

.logic-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  margin-top: 18px;
}

.card-header {
  padding: 14px 18px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.table-wrapper {
  overflow-x: auto;
}

.logic-table {
  width: 100%;
  border-collapse: collapse;
}

.logic-table th,
.logic-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
  font-size: 14px;
}

.logic-table th {
  background: #fcfcff;
  color: #475569;
  font-weight: 800;
}

.dim-name {
  font-weight: 800;
  color: #003a8c;
}

.badge,
.score-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
}

.badge.healthy {
  color: #389e0d;
  background: rgba(82, 196, 26, 0.12);
  border: 1px solid rgba(82, 196, 26, 0.35);
}

.badge.normal {
  color: #722ed1;
  background: rgba(114, 46, 209, 0.1);
  border: 1px solid rgba(114, 46, 209, 0.25);
}

.badge.warning {
  color: #d48806;
  background: rgba(250, 173, 20, 0.14);
  border: 1px solid rgba(250, 173, 20, 0.35);
}

.badge.risk {
  color: #d9480f;
  background: rgba(255, 122, 69, 0.14);
  border: 1px solid rgba(255, 122, 69, 0.35);
}

.badge.critical {
  color: #cf1322;
  background: rgba(255, 77, 79, 0.12);
  border: 1px solid rgba(255, 77, 79, 0.35);
}

.score-tag {
  color: #0f172a;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
}

.low-text {
  color: #389e0d;
}

.mid-text {
  color: #d48806;
}

.high-text {
  color: #cf1322;
}

.feedback-card {
  border-left: 4px solid #722ed1;
  background: linear-gradient(180deg, #ffffff 0%, #faf7ff 100%);
}

.feedback-card p {
  margin: 8px 0 0;
}

.link-list a {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}

.link-list a:hover {
  text-decoration: underline;
}

.footer-note {
  text-align: center;
  color: #64748b;
  margin-top: 26px;
  line-height: 1.7;
  font-size: 14px;
}

@media (max-width: 960px) {
  .overview-grid,
  .task-grid,
  .team-grid,
  .two-col-grid,
  .future-grid,
  .task-scheme-grid,
  .task-user-grid {
    grid-template-columns: 1fr;
  }

  .hero-card h1 {
    font-size: 28px;
  }

  .section-heading h2 {
    font-size: 22px;
  }
}
</style>