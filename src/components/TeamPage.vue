<template>
  <div class="team-page">
    <section class="hero-card">
      <div class="hero-badge">
        <TeamOutlined />
        <span>Project Team</span>
      </div>
      <h1>Meet the RiskLens Team</h1>
      <p class="hero-copy">
        This page introduces the project members, their responsibilities, and their contribution to the RiskLens website.
        The team worked collaboratively on research, design, implementation, refinement, testing, and final documentation.
      </p>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon blue">
          <UsergroupAddOutlined />
        </div>
        <div>
          <p class="section-kicker">Members</p>
          <h2>Team Members & Contact Information</h2>
        </div>
      </div>

      <div class="member-grid">
        <article class="member-card">
          <div class="member-top">
            <div class="photo-frame">
              <!-- 替换成你们自己的照片路径 -->
              <img src="@/assets/member-yuzhang.jpg" alt="YUZHANG photo" class="member-photo" />
            </div>

            <div class="member-meta">
              <h3>YU ZHANG</h3>
              <p class="member-role">Research, Data Processing, Summary / Radar / Simulator</p>
              <span class="workload-tag">Workload: 50%</span>
            </div>
          </div>

          <div class="info-block">
            <div class="info-row">
              <MailOutlined />
              <a href="mailto:your-email-1@example.com">yuz2@kth.se</a>
            </div>
          </div>

          <div class="detail-section">
            <h4>Main Contributions</h4>
            <ul>
              <li>Literature review and background research</li>
              <li>Raw data download, cleaning, and preprocessing</li>
              <li>Project planning and design</li>
              <li>Implementation of the summary view</li>
              <li>Implementation of the radar comparison view</li>
              <li>Implementation of the risk simulator</li>
              <li>Bug fixing, testing</li>
            </ul>
          </div>

          <div class="detail-section">
            <h4>Short Bio</h4>
            <p>
              Focused on transforming raw public-health data into a structured visualization pipeline and helping shape
              the analytical storytelling of RiskLens.
            </p>
          </div>
        </article>

        <article class="member-card">
          <div class="member-top">
            <div class="photo-frame">
              <!-- 替换成你们自己的照片路径 -->
              <img src="@/assets/member-liuzifei.jpg" alt="ZIFEI LIU photo" class="member-photo" />
            </div>

            <div class="member-meta">
              <h3>ZIFEI LIU</h3>
              <p class="member-role">Interaction Design, Onboarding, Range / Form / UI Polish</p>
              <span class="workload-tag">Workload: 50%</span>
            </div>
          </div>

          <div class="info-block">
            <div class="info-row">
              <MailOutlined />
              <a href="mailto:your-email-2@example.com">zifeil@kth.se</a>
            </div>
          </div>

          <div class="detail-section">
            <h4>Main Contributions</h4>
            <ul>
              <li>Literature review and background research</li>
              <li>Project planning and design</li>
              <li>Implementation of the onboarding flow</li>
              <li>Implementation of the range comparison module</li>
              <li>Implementation of the user form module</li>
              <li>UI refinement and layout optimization</li>
              <li>Bug fixing and testing</li>
            </ul>
          </div>

          <div class="detail-section">
            <h4>Short Bio</h4>
            <p>
              Focused on building a smooth user journey, improving interaction flow, and refining the visual presentation
              of the project’s comparison interface.
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading with-icon">
        <div class="heading-icon purple">
          <ProjectOutlined />
        </div>
        <div>
          <p class="section-kicker">Collaboration</p>
          <h2>How We Worked Together</h2>
        </div>
      </div>

      <div class="collab-grid">
        <div class="mini-card">
          <div class="mini-icon"><BulbOutlined /></div>
          <h3>Joint Design</h3>
          <p>
            Both team members contributed to project planning, concept refinement, and design discussion throughout the project.
          </p>
        </div>

        <div class="mini-card">
          <div class="mini-icon"><CodeOutlined /></div>
          <h3>Implementation</h3>
          <p>
            Development responsibilities were divided by module, while integration, debugging, and testing were handled collaboratively.
          </p>
        </div>

        <div class="mini-card">
          <div class="mini-icon"><CheckCircleOutlined /></div>
          <h3>Final Delivery</h3>
          <p>
            The final website, documentation, feedback incorporation, and presentation materials were completed through shared iteration.
          </p>
        </div>
      </div>
    </section>

    <footer class="footer-note">
      For project-related questions, please contact the team through the email addresses listed above.
    </footer>
  </div>
</template>

<script setup>
import {
  TeamOutlined,
  UsergroupAddOutlined,
  MailOutlined,
  ProjectOutlined,
  BulbOutlined,
  CodeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'
</script>

<style scoped>
.team-page {
  --primary: #722ed1;
  --text-main: #0f172a;
  --text-sub: #475569;
  --border: #e2e8f0;

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
  background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(24, 144, 255, 0.1);
  color: #1677ff;
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
}

.hero-copy {
  color: var(--text-sub);
  line-height: 1.78;
  font-size: 15px;
  max-width: 860px;
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

.heading-icon.blue {
  background: rgba(24, 144, 255, 0.12);
  color: #1677ff;
}

.heading-icon.purple {
  background: rgba(114, 46, 209, 0.12);
  color: #722ed1;
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

.member-grid,
.collab-grid {
  display: grid;
  gap: 18px;
}

.member-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.collab-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.member-card,
.mini-card {
  border: 1px solid var(--border);
  background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
  border-radius: 20px;
  padding: 20px;
}

.member-top {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
}

.photo-frame {
  width: 104px;
  height: 104px;
  border-radius: 22px;
  overflow: hidden;
  background: #f1f5f9;
  border: 1px solid #dbeafe;
  flex-shrink: 0;
}

.member-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 如果暂时没有照片，可以先用这个占位方案：
.photo-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #64748b;
}
*/

.member-meta h3 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
}

.member-role {
  margin: 0 0 10px;
  color: var(--text-sub);
  line-height: 1.6;
}

.workload-tag {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
  font-weight: 700;
  font-size: 13px;
}

.info-block {
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
}

.info-row a {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}

.info-row a:hover {
  text-decoration: underline;
}

.detail-section + .detail-section {
  margin-top: 18px;
}

.detail-section h4 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.detail-section p,
.detail-section li {
  color: var(--text-sub);
  line-height: 1.75;
}

.detail-section ul {
  margin: 0;
  padding-left: 18px;
}

.mini-icon {
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

.mini-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
}

.mini-card p {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.75;
}

.footer-note {
  text-align: center;
  color: #64748b;
  margin-top: 26px;
  line-height: 1.7;
  font-size: 14px;
}

@media (max-width: 960px) {
  .member-grid,
  .collab-grid {
    grid-template-columns: 1fr;
  }

  .hero-card h1 {
    font-size: 28px;
  }

  .section-heading h2 {
    font-size: 22px;
  }
}

@media (max-width: 640px) {
  .member-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>