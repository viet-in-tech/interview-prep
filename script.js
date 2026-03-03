/* ── State ────────────────────────────────────────────────── */
let activeProjectId = null;

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  updateProjectCount();

  // Auto-select first project if only one exists
  if (PROJECTS.length === 1) selectProject(PROJECTS[0].id);

  // Search
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('blur', () => {
    setTimeout(() => hideSearch(), 150);
  });

  // Close search on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-input') && !e.target.closest('.search-overlay')) {
      hideSearch();
    }
  });

  // Mobile sidebar toggle
  const sidebarToggle  = document.getElementById('sidebarToggle');
  const sidebar        = document.getElementById('sidebar');
  const backdrop       = document.getElementById('sidebarBackdrop');

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.remove('hidden');
    backdrop.classList.add('visible');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
    backdrop.classList.add('hidden');
  }

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  backdrop.addEventListener('click', closeSidebar);
});

/* ── Sidebar ──────────────────────────────────────────────── */
function renderSidebar() {
  const nav = document.getElementById('projectNav');
  nav.innerHTML = '';

  PROJECTS.forEach(project => {
    const item = document.createElement('div');
    item.className = 'nav-item';
    item.dataset.id = project.id;
    item.innerHTML = `
      <span class="nav-item-title">${project.title}</span>
      <span class="nav-item-meta">
        ${project.year}
        <span class="nav-item-qa-count">${project.qa.length} Q&amp;A</span>
      </span>
    `;
    item.addEventListener('click', () => {
      selectProject(project.id);
      // Close sidebar on mobile after selection
      const sidebar  = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('visible');
        backdrop.classList.add('hidden');
      }
    });
    nav.appendChild(item);
  });
}

function updateProjectCount() {
  const total = PROJECTS.reduce((sum, p) => sum + p.qa.length, 0);
  document.getElementById('projectCount').textContent =
    `${PROJECTS.length} project${PROJECTS.length !== 1 ? 's' : ''} · ${total} Q&As`;
}

/* ── Project Selection ────────────────────────────────────── */
function selectProject(id) {
  activeProjectId = id;
  const project = PROJECTS.find(p => p.id === id);
  if (!project) return;

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  // Show detail panel
  document.getElementById('emptyState').classList.add('hidden');
  const detail = document.getElementById('projectDetail');
  detail.classList.remove('hidden');

  // Populate header
  document.getElementById('detailType').textContent = project.type;
  document.getElementById('detailYear').textContent = project.year;
  document.getElementById('detailTitle').textContent = project.title;
  document.getElementById('detailSubtitle').textContent = project.subtitle;
  document.getElementById('detailInstitution').textContent = project.institution;

  // Tags
  const tagsEl = document.getElementById('detailTags');
  tagsEl.innerHTML = project.tags.map(t => `<span class="tag">${t}</span>`).join('');

  // Summary bullets
  const summaryEl = document.getElementById('detailSummary');
  summaryEl.innerHTML = project.description.map(d => `<li>${d}</li>`).join('');

  // Q&A count
  document.getElementById('qaCount').textContent = `${project.qa.length} questions`;

  // Q&A list
  renderQA(project.qa);

  // Scroll main to top
  document.getElementById('mainPanel').scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Q&A Accordion ────────────────────────────────────────── */
function renderQA(qaList) {
  const container = document.getElementById('qaList');
  container.innerHTML = '';

  qaList.forEach(item => {
    const el = document.createElement('div');
    el.className = 'qa-item';
    el.innerHTML = `
      <div class="qa-question">
        <span class="qa-q-text">${item.q}</span>
        <span class="qa-toggle">▼</span>
      </div>
      <div class="qa-answer">
        <div class="qa-answer-inner">
          <div class="qa-a-label">A:</div>
          <div class="qa-answer-text">${item.a}</div>
        </div>
      </div>
    `;

    el.querySelector('.qa-question').addEventListener('click', () => {
      const isOpen = el.classList.contains('open');
      // Close all others
      document.querySelectorAll('.qa-item.open').forEach(other => {
        if (other !== el) other.classList.remove('open');
      });
      el.classList.toggle('open', !isOpen);
    });

    container.appendChild(el);
  });

  // Auto-open first Q&A
  if (container.firstChild) container.firstChild.classList.add('open');
}

/* ── Search ───────────────────────────────────────────────── */
function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const overlay = document.getElementById('searchOverlay');
  const results = document.getElementById('searchResults');

  if (!query) { hideSearch(); return; }

  const matches = [];
  PROJECTS.forEach(project => {
    project.qa.forEach(item => {
      if (
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query)
      ) {
        matches.push({ project, item });
      }
    });
  });

  if (matches.length === 0) {
    results.innerHTML = `<div class="search-no-results">No results for "<strong>${query}</strong>"</div>`;
  } else {
    results.innerHTML = matches.map(({ project, item }) => `
      <div class="search-result-item" data-project-id="${project.id}" data-question="${encodeURIComponent(item.q)}">
        <div class="search-result-project">${project.title}</div>
        <div class="search-result-q">${highlight(item.q, query)}</div>
      </div>
    `).join('');

    results.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        selectProject(el.dataset.projectId);
        hideSearch();
        document.getElementById('searchInput').value = '';
      });
    });
  }

  overlay.classList.remove('hidden');
}

function hideSearch() {
  document.getElementById('searchOverlay').classList.add('hidden');
}

function highlight(text, query) {
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
