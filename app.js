// GitHub Portfolio Site
// Fetches and displays repositories from GitHub API

const GITHUB_USERNAME = 'devtanc';
const REPOS_PER_PAGE = 100; // Max allowed by GitHub API

// State
let allRepos = [];
let currentFilter = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Fetch user profile and repos in parallel
    const [profile, repos] = await Promise.all([
      fetchUserProfile(),
      fetchAllRepos()
    ]);

    updateProfileUI(profile);
    allRepos = sortRepos(repos);
    renderProjects(allRepos);
    setupFilterButtons();
  } catch (error) {
    console.error('Error initializing app:', error);
    showError('Failed to load data from GitHub. Please try again later.');
  }
}

// Fetch user profile from GitHub API
async function fetchUserProfile() {
  const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
}

// Fetch all repositories (handles pagination)
async function fetchAllRepos() {
  let allRepos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=${REPOS_PER_PAGE}&page=${page}&sort=updated`
    );
    if (!response.ok) throw new Error('Failed to fetch repositories');

    const repos = await response.json();
    allRepos = allRepos.concat(repos);

    // Check if there are more pages
    hasMore = repos.length === REPOS_PER_PAGE;
    page++;
  }

  return allRepos;
}

// Sort repos: original repos first (by updated date), then forks (by updated date)
function sortRepos(repos) {
  const originalRepos = repos.filter(repo => !repo.fork);
  const forkedRepos = repos.filter(repo => repo.fork);

  // Sort each group by updated_at (most recent first)
  const sortByDate = (a, b) => new Date(b.updated_at) - new Date(a.updated_at);

  originalRepos.sort(sortByDate);
  forkedRepos.sort(sortByDate);

  // Return original repos first, then forks
  return [...originalRepos, ...forkedRepos];
}

// Update profile UI with fetched data
function updateProfileUI(profile) {
  // Avatar
  const avatar = document.getElementById('avatar');
  avatar.src = profile.avatar_url;
  avatar.alt = `${profile.name || profile.login}'s avatar`;

  // Name
  const nameEl = document.getElementById('name');
  nameEl.textContent = profile.name || profile.login;

  // Bio
  const bioEl = document.getElementById('bio');
  if (profile.bio) {
    bioEl.textContent = profile.bio;
  }

  // Stats
  document.getElementById('repo-count').textContent = profile.public_repos;
  document.getElementById('followers-count').textContent = profile.followers;
  document.getElementById('following-count').textContent = profile.following;

  // Blog link
  if (profile.blog) {
    const blogLink = document.getElementById('blog-link');
    blogLink.href = profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`;
    blogLink.classList.remove('hidden');
  }

  // Update about text if bio exists
  if (profile.bio || profile.company || profile.location) {
    const aboutText = document.getElementById('about-text');
    let aboutContent = profile.bio || "I'm a software developer passionate about building great software.";

    if (profile.company) {
      aboutContent += ` Currently working at ${profile.company}.`;
    }
    if (profile.location) {
      aboutContent += ` Based in ${profile.location}.`;
    }

    aboutText.textContent = aboutContent;
  }
}

// Render projects grid
function renderProjects(repos) {
  const grid = document.getElementById('projects-grid');

  // Filter based on current filter
  let filteredRepos = repos;
  if (currentFilter === 'original') {
    filteredRepos = repos.filter(repo => !repo.fork);
  } else if (currentFilter === 'forks') {
    filteredRepos = repos.filter(repo => repo.fork);
  }

  if (filteredRepos.length === 0) {
    grid.innerHTML = '<p class="no-results">No repositories found.</p>';
    return;
  }

  grid.innerHTML = filteredRepos.map(repo => createProjectCard(repo)).join('');
}

// Create a project card HTML
function createProjectCard(repo) {
  const languageColor = getLanguageColor(repo.language);
  const updatedDate = formatDate(repo.updated_at);

  return `
    <article class="project-card ${repo.fork ? 'is-fork' : ''}">
      <div class="project-header">
        <h3 class="project-title">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
            ${repo.name}
          </a>
        </h3>
        ${repo.fork ? '<span class="fork-badge">Fork</span>' : ''}
      </div>
      <p class="project-description">${repo.description || 'No description available.'}</p>
      <div class="project-meta">
        ${repo.language ? `
          <span class="project-language">
            <span class="language-dot" style="background-color: ${languageColor}"></span>
            ${repo.language}
          </span>
        ` : ''}
        <span class="project-stars">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
          </svg>
          ${repo.stargazers_count}
        </span>
        <span class="project-forks">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
          </svg>
          ${repo.forks_count}
        </span>
      </div>
      <div class="project-updated">Updated ${updatedDate}</div>
      ${repo.homepage ? `
        <a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="project-demo">
          View Demo
        </a>
      ` : ''}
    </article>
  `;
}

// Setup filter buttons
function setupFilterButtons() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProjects(allRepos);
    });
  });
}

// Format date to relative time
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Get language color (based on GitHub's language colors)
function getLanguageColor(language) {
  const colors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    PHP: '#4F5D95',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SCSS: '#c6538c',
    Shell: '#89e051',
    Vue: '#41b883',
    Dart: '#00B4AB',
    Elixir: '#6e4a7e',
    Haskell: '#5e5086',
    Lua: '#000080',
    R: '#198CE7',
    Scala: '#c22d40',
    Clojure: '#db5855',
    Erlang: '#B83998',
    Julia: '#a270ba',
    'Jupyter Notebook': '#DA5B0B',
    default: '#8b949e'
  };

  return colors[language] || colors.default;
}

// Show error message
function showError(message) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="location.reload()">Retry</button>
    </div>
  `;
}
