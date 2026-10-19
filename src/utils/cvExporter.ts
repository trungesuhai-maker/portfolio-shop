import { CVDocument } from '../types/cv';
import { POPULAR_TOOLS } from '../data/popularTools';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateCVStandaloneHTML(cv: CVDocument): string {
  const { personalInfo, sectionTitles, layoutOrder } = cv;

  // Resolve tool SVGs
  const toolsHtml = cv.tools.map(tool => {
    let iconSvg = '';
    const preset = POPULAR_TOOLS.find(p => p.id === tool.iconName || p.name.toLowerCase() === tool.name.toLowerCase());
    if (preset) {
      iconSvg = preset.iconSvg;
    } else if (tool.logoUrl) {
      iconSvg = `<img src="${tool.logoUrl}" alt="${escapeHtml(tool.name)}" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;" />`;
    } else {
      iconSvg = `<div style="width: 24px; height: 24px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border-radius: 4px;">${escapeHtml(tool.name.slice(0, 2).toUpperCase())}</div>`;
    }

    return `
      <div class="tool-badge">
        <div class="tool-icon">${iconSvg}</div>
        <span class="tool-name">${escapeHtml(tool.name)}</span>
        ${tool.level ? `<span class="tool-level">${escapeHtml(tool.level)}</span>` : ''}
      </div>
    `;
  }).join('');

  // Experience HTML
  const experiencesHtml = cv.experiences.map(exp => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-header">
        <div>
          <h3 class="item-title">${escapeHtml(exp.role)}</h3>
          <div class="item-company">${escapeHtml(exp.company)} ${exp.location ? `• <span>${escapeHtml(exp.location)}</span>` : ''}</div>
        </div>
        <div class="item-period">${escapeHtml(exp.period)}</div>
      </div>
      <p class="item-desc">${escapeHtml(exp.description)}</p>
      ${exp.bullets && exp.bullets.length > 0 ? `
        <ul class="item-bullets">
          ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('');

  // Education HTML
  const educationsHtml = cv.educations.map(edu => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-header">
        <div>
          <h3 class="item-title">${escapeHtml(edu.degree)}</h3>
          <div class="item-company">${escapeHtml(edu.school)}</div>
        </div>
        <div class="item-period">${escapeHtml(edu.period)}</div>
      </div>
      ${edu.honors ? `<p class="item-honors">★ ${escapeHtml(edu.honors)}</p>` : ''}
    </div>
  `).join('');

  // Projects HTML
  const projectsHtml = cv.projects.map(proj => `
    <div class="project-card">
      <div class="project-header">
        <h3 class="item-title">${escapeHtml(proj.name)}</h3>
        ${proj.period ? `<span class="item-period">${escapeHtml(proj.period)}</span>` : ''}
      </div>
      <div class="project-role">${escapeHtml(proj.role)}</div>
      <p class="item-desc">${escapeHtml(proj.description)}</p>
      ${proj.tags && proj.tags.length > 0 ? `
        <div class="tag-cloud">
          ${proj.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  // Skills HTML
  const skillsHtml = cv.skills.map(skill => `
    <div class="skill-item">
      <div class="skill-info">
        <span class="skill-name">${escapeHtml(skill.name)}</span>
        <span class="skill-percent">${skill.level}%</span>
      </div>
      <div class="skill-bar-bg">
        <div class="skill-bar-fill" style="width: ${skill.level}%;"></div>
      </div>
    </div>
  `).join('');

  // Languages HTML
  const languagesHtml = cv.languages.map(lang => `
    <div class="lang-item">
      <div class="lang-info">
        <span class="lang-name">${escapeHtml(lang.name)}</span>
        <span class="lang-level">${escapeHtml(lang.level)}</span>
      </div>
      <div class="stars">
        ${Array.from({ length: 5 }).map((_, i) => `
          <span class="star ${i < lang.proficiency ? 'filled' : ''}">★</span>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Certifications HTML
  const certsHtml = cv.certifications.map(cert => `
    <div class="cert-item">
      <div class="cert-name">${escapeHtml(cert.name)}</div>
      <div class="cert-meta">${escapeHtml(cert.issuer)} • ${escapeHtml(cert.year)}</div>
    </div>
  `).join('');

  // Sidebar sections renderer based on layoutOrder
  const renderSidebarSection = (type: string) => {
    switch (type) {
      case 'contact':
        return `
          <section class="cv-section sidebar-section">
            <h2 class="sidebar-section-title">${escapeHtml(sectionTitles.contact)}</h2>
            <div class="contact-list">
              ${personalInfo.email ? `
                <div class="contact-item">
                  <span class="contact-icon">✉</span>
                  <span>${escapeHtml(personalInfo.email)}</span>
                </div>
              ` : ''}
              ${personalInfo.phone ? `
                <div class="contact-item">
                  <span class="contact-icon">✆</span>
                  <span>${escapeHtml(personalInfo.phone)}</span>
                </div>
              ` : ''}
              ${personalInfo.location ? `
                <div class="contact-item">
                  <span class="contact-icon">📍</span>
                  <span>${escapeHtml(personalInfo.location)}</span>
                </div>
              ` : ''}
              ${personalInfo.website ? `
                <div class="contact-item">
                  <span class="contact-icon">🌐</span>
                  <span>${escapeHtml(personalInfo.website)}</span>
                </div>
              ` : ''}
              ${personalInfo.linkedin ? `
                <div class="contact-item">
                  <span class="contact-icon">in</span>
                  <span>${escapeHtml(personalInfo.linkedin)}</span>
                </div>
              ` : ''}
              ${personalInfo.github ? `
                <div class="contact-item">
                  <span class="contact-icon">⌥</span>
                  <span>${escapeHtml(personalInfo.github)}</span>
                </div>
              ` : ''}
            </div>
          </section>
        `;
      case 'profile':
        return `
          <section class="cv-section sidebar-section">
            <h2 class="sidebar-section-title">${escapeHtml(sectionTitles.profile)}</h2>
            <p class="profile-text">${escapeHtml(cv.profileSummary)}</p>
          </section>
        `;
      case 'skills':
        return `
          <section class="cv-section sidebar-section">
            <h2 class="sidebar-section-title">${escapeHtml(sectionTitles.skills)}</h2>
            <div class="skills-list">${skillsHtml}</div>
          </section>
        `;
      case 'languages':
        return `
          <section class="cv-section sidebar-section">
            <h2 class="sidebar-section-title">${escapeHtml(sectionTitles.languages)}</h2>
            <div class="languages-list">${languagesHtml}</div>
          </section>
        `;
      case 'certifications':
        return `
          <section class="cv-section sidebar-section">
            <h2 class="sidebar-section-title">${escapeHtml(sectionTitles.certifications)}</h2>
            <div class="certs-list">${certsHtml}</div>
          </section>
        `;
      default:
        return '';
    }
  };

  // Main sections renderer based on layoutOrder
  const renderMainSection = (type: string) => {
    switch (type) {
      case 'experience':
        return `
          <section class="cv-section main-section">
            <h2 class="main-section-title">
              <span class="title-bar"></span>
              ${escapeHtml(sectionTitles.experience)}
            </h2>
            <div class="timeline">${experiencesHtml}</div>
          </section>
        `;
      case 'tools':
        return `
          <section class="cv-section main-section">
            <h2 class="main-section-title">
              <span class="title-bar"></span>
              ${escapeHtml(sectionTitles.tools)}
            </h2>
            <div class="tools-grid">${toolsHtml}</div>
          </section>
        `;
      case 'projects':
        return `
          <section class="cv-section main-section">
            <h2 class="main-section-title">
              <span class="title-bar"></span>
              ${escapeHtml(sectionTitles.projects)}
            </h2>
            <div class="projects-grid">${projectsHtml}</div>
          </section>
        `;
      case 'education':
        return `
          <section class="cv-section main-section">
            <h2 class="main-section-title">
              <span class="title-bar"></span>
              ${escapeHtml(sectionTitles.education)}
            </h2>
            <div class="timeline">${educationsHtml}</div>
          </section>
        `;
      default:
        return '';
    }
  };

  const renderedSidebar = (layoutOrder.sidebar || ['contact', 'profile', 'skills', 'languages', 'certifications'])
    .map(type => renderSidebarSection(type))
    .join('');

  const renderedMain = (layoutOrder.main || ['experience', 'tools', 'projects', 'education'])
    .map(type => renderMainSection(type))
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(personalInfo.fullName)} - ${escapeHtml(personalInfo.jobTitle)} | CV</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .cv-container {
      max-width: 900px;
      margin: 30px auto;
      background: #ffffff;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      min-height: 1200px;
    }
    /* LEFT SIDEBAR */
    .sidebar {
      width: 35%;
      background: #0f172a;
      color: #e2e8f0;
      padding: 36px 28px;
      flex-shrink: 0;
    }
    .avatar-wrapper {
      text-align: center;
      margin-bottom: 24px;
    }
    .avatar-img {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #334155;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: inline-block;
    }
    .sidebar-section {
      margin-bottom: 28px;
    }
    .sidebar-section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #38bdf8;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .contact-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 12.5px;
      color: #cbd5e1;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      word-break: break-word;
    }
    .contact-icon {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: #1e293b;
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .profile-text {
      font-size: 12.5px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    .skills-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .skill-info {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 4px;
    }
    .skill-percent {
      color: #38bdf8;
    }
    .skill-bar-bg {
      height: 6px;
      background: #1e293b;
      border-radius: 999px;
      overflow: hidden;
    }
    .skill-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      border-radius: 999px;
    }
    .languages-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .lang-info {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #f1f5f9;
      font-weight: 600;
    }
    .lang-level {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 400;
    }
    .stars {
      color: #334155;
      font-size: 13px;
      letter-spacing: 2px;
    }
    .star.filled {
      color: #fbbf24;
    }
    .cert-item {
      margin-bottom: 10px;
    }
    .cert-name {
      font-size: 12px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .cert-meta {
      font-size: 11px;
      color: #94a3b8;
    }

    /* RIGHT MAIN CONTENT */
    .main-content {
      width: 65%;
      padding: 40px 36px;
      background: #ffffff;
    }
    .header-banner {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .full-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1.15;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .job-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #0284c7;
    }
    .main-section {
      margin-bottom: 30px;
    }
    .main-section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .title-bar {
      width: 4px;
      height: 18px;
      background: #0284c7;
      border-radius: 2px;
    }
    .timeline {
      position: relative;
      padding-left: 20px;
      border-left: 2px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .timeline-item {
      position: relative;
    }
    .timeline-dot {
      position: absolute;
      left: -26px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #0284c7;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 2px #0284c7;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .item-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .item-company {
      font-size: 12.5px;
      font-weight: 600;
      color: #475569;
    }
    .item-period {
      font-size: 11.5px;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .item-desc {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.55;
      margin-top: 4px;
    }
    .item-bullets {
      margin-top: 6px;
      padding-left: 18px;
      font-size: 12px;
      color: #334155;
      line-height: 1.6;
    }
    .item-honors {
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      margin-top: 4px;
    }
    /* TOOLS GRID */
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }
    .tool-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .tool-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .tool-name {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }
    .tool-level {
      font-size: 10px;
      color: #64748b;
      margin-left: auto;
    }
    /* PROJECTS */
    .projects-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .project-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }
    .project-role {
      font-size: 11.5px;
      font-weight: 600;
      color: #0284c7;
      margin-bottom: 6px;
    }
    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .tag {
      background: #e2e8f0;
      color: #334155;
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* PRINT STYLES */
    @media print {
      body {
        background: #ffffff;
      }
      .cv-container {
        max-width: 100%;
        margin: 0;
        box-shadow: none;
        border-radius: 0;
      }
      .sidebar {
        background: #0f172a !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .main-content {
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <!-- LEFT SIDEBAR -->
    <aside class="sidebar">
      <div class="avatar-wrapper">
        <img class="avatar-img" src="${personalInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face'}" alt="${escapeHtml(personalInfo.fullName)}" />
      </div>
      ${renderedSidebar}
    </aside>

    <!-- MAIN RIGHT COLUMN -->
    <main class="main-content">
      <header class="header-banner">
        <h1 class="full-name">${escapeHtml(personalInfo.fullName)}</h1>
        <div class="job-title">${escapeHtml(personalInfo.jobTitle)}</div>
      </header>
      ${renderedMain}
    </main>
  </div>
</body>
</html>`;
}

/**
 * Helper to trigger HTML file download in browser
 */
export function downloadCVHTML(cv: CVDocument) {
  const htmlContent = generateCVStandaloneHTML(cv);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (cv.personalInfo.fullName || 'Candidate')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');
  a.href = url;
  a.download = `CV_${safeName}_${new Date().getFullYear()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
