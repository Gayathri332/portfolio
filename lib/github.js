// Thin wrapper around the public GitHub REST API. Works with no token at
// all (60 requests/hour, shared across all visitors to your site — fine for
// the offline knowledge-base build), and works better with a GITHUB_TOKEN
// (5000/hour) if you set one in .env for the live lookup tool in chat.js.

function headers(accept) {
  const h = {
    Accept: accept || 'application/vnd.github+json',
    'User-Agent': 'gayathri-portfolio-bot',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

// All non-fork public repos for a user, most-recently-updated first.
async function listRepos(username) {
  const resp = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
    { headers: headers() }
  );
  if (!resp.ok) throw new Error(`GitHub list repos failed: ${resp.status}`);
  const repos = await resp.json();
  return repos
    .filter((r) => !r.fork)
    .map((r) => ({
      name: r.name,
      description: r.description || '',
      language: r.language || '',
      topics: r.topics || [],
      htmlUrl: r.html_url,
      updatedAt: r.updated_at,
      stars: r.stargazers_count,
    }));
}

// Raw README text for one repo, or '' if it has none / the call fails.
async function getReadme(username, repo) {
  const resp = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/readme`,
    { headers: headers('application/vnd.github.raw+json') }
  );
  if (!resp.ok) return '';
  return resp.text();
}

module.exports = { listRepos, getReadme };
