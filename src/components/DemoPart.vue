<template>
  <div class="demo-page">
    <section class="hero-card">
      <p class="eyebrow">Final Deliverable</p>
      <h1>Demo Video</h1>
      <p class="hero-copy">
        This page hosts the 2-minute demonstration video for RiskLens. The demo walks through the onboarding flow,
        clinical profile scoring, subgroup comparison, and risk simulation features.
      </p>
    </section>

    <section class="content-card">
      <div class="video-embed">
        <iframe
          src="https://www.youtube.com/embed/FrZ4SGGgHPE"
          title="RiskLens Demo Video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>

      <div class="link-grid">
        <div class="link-card">
          <h3>Temporary Live Link</h3>
          <p>Current deployed project website:</p>
          <a
            href="https://yyqxdlg.github.io/riskLens/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://yyqxdlg.github.io/riskLens/
          </a>
        </div>

        <div class="link-card">
          <h3>What the demo will show</h3>
          <ul>
            <li>Entering user metrics through onboarding and form inputs</li>
            <li>Viewing the clinical profile score and category summary</li>
            <li>Comparing personal metrics with the filtered population</li>
            <li>Exploring the risk simulator and subgroup views</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 36px 20px 48px;
  color: #1e293b;
}

.hero-card,
.content-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.hero-card {
  padding: 28px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: #722ed1;
}

.hero-card h1 {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
}

.hero-copy {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: #475569;
  max-width: 760px;
}

.content-card {
  padding: 28px;
}

.video-placeholder {
  min-height: 280px;
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px;
  margin-bottom: 24px;
}

.video-badge {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.4px;
  color: #722ed1;
  background: rgba(114, 46, 209, 0.08);
  padding: 8px 12px;
  border-radius: 999px;
  margin-bottom: 14px;
}

.video-placeholder h2 {
  margin: 0 0 10px;
  font-size: 24px;
  color: #0f172a;
}

.video-placeholder p {
  margin: 0;
  max-width: 620px;
  color: #475569;
  line-height: 1.7;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.link-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  background: #fcfcff;
}

.link-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #0f172a;
}

.link-card p,
.link-card li {
  color: #475569;
  line-height: 1.7;
}

.link-card a {
  color: #2563eb;
  word-break: break-all;
  text-decoration: none;
  font-weight: 600;
}

.link-card a:hover {
  text-decoration: underline;
}

.link-card ul {
  margin: 0;
  padding-left: 18px;
}

@media (max-width: 768px) {
  .link-grid {
    grid-template-columns: 1fr;
  }

  .hero-card h1 {
    font-size: 28px;
  }
}

.video-embed {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
  margin-bottom: 24px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.video-embed iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
</style>