(() => {
  const groups = [
    {
      label: 'Supplementary material',
      links: [
        ['overview', 'Overview', 'index.html'],
        ['about', 'About Chris', 'index.html#about']
      ]
    },
    {
      label: 'Machine learning',
      links: [
        ['machine-learning', 'Machine-learning guide', 'machine-learning.html'],
        ['representation-learning', 'Representation learning', 'representation-learning.html'],
        ['neural-networks', 'Neural networks and autoencoders', 'ml-neural-networks.html'],
        ['som', 'Self-organising maps', 'ml-som.html'],
        ['vae', 'Variational autoencoders', 'ml-vae.html'],
        ['deep-clustering', 'Deep embedded clustering', 'ml-deep-clustering.html']
      ]
    },
    {
      label: 'Methods and results',
      links: [
        ['architectures', 'Architecture search', 'architectures.html'],
        ['architecture-results', 'Architecture search results', 'architecture-results.html'],
        ['geometry', 'Autoencoder geometry', 'geometry.html'],
        ['feature-distributions', 'Feature distributions', 'feature-distributions.html']
      ]
    }
  ];

  const pageActive = document.body.dataset.page || '';
  const activeKey = () => window.location.hash === '#about' ? 'about' : pageActive;
  const linkMarkup = (compact = false) => groups.map(group => `
    <div class="site-nav-group">
      <div class="site-nav-label">${group.label}</div>
      ${group.links.map(([key, label, href]) => `
        <a href="${href}" data-page-key="${key}"${key === activeKey() ? ' aria-current="page"' : ''}>${label}</a>
      `).join('')}
    </div>
  `).join('');

  const sidebar = document.createElement('aside');
  sidebar.className = 'site-sidebar';
  sidebar.setAttribute('aria-label', 'Supplementary pages');
  sidebar.innerHTML = `
    <a class="site-sidebar-brand" href="index.html">
      Environmental regionalisation
      <span>Electronic supplementary material</span>
    </a>
    <nav>${linkMarkup()}</nav>
  `;

  const mobile = document.createElement('details');
  mobile.className = 'mobile-site-nav';
  mobile.innerHTML = `<summary>Supplementary pages</summary><nav>${linkMarkup(true)}</nav>`;

  document.body.classList.add('has-site-sidebar');
  document.body.prepend(sidebar);
  const header = document.querySelector('.site-header');
  if (header) header.insertAdjacentElement('afterend', mobile);

  const updateActiveLink = () => {
    document.querySelectorAll('.site-sidebar nav a, .mobile-site-nav nav a').forEach(link => {
      if (link.dataset.pageKey === activeKey()) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('hashchange', updateActiveLink);
})();
