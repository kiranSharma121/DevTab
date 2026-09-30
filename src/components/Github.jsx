import { useEffect, useState } from "react";

function GitHub() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchProfile() {
    if (!username.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://api.github.com/users/${username.trim()}`,
      );

      if (!response.ok) {
        throw new Error("GitHub user not found");
      }

      const data = await response.json();

      setProfile(data);

      chrome.storage.local.set({
        githubUsername: username.trim(),
        githubProfile: data,
      });
    } catch (error) {
      setError(error.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chrome.storage.local.get(["githubUsername", "githubProfile"], (result) => {
      if (result.githubUsername) {
        setUsername(result.githubUsername);
      }

      if (result.githubProfile) {
        setProfile(result.githubProfile);
      }
    });
  }, []);

  return (
    <section className="card github-card">
      <h2>GitHub</h2>

      {!profile ? (
        <div className="github-connect">
          <input
            type="text"
            placeholder="GitHub username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                fetchProfile();
              }
            }}
          />

          <button onClick={fetchProfile}>
            {loading ? "Loading..." : "Connect"}
          </button>

          {error && <p className="github-error">{error}</p>}
        </div>
      ) : (
        <div className="github-profile">
          <img
            src={profile.avatar_url}
            alt={profile.login}
            className="github-avatar"
          />

          <div>
            <h3>{profile.name || profile.login}</h3>
            <p>@{profile.login}</p>
          </div>
        </div>
      )}

      {profile && (
        <>
          <div className="github-stats">
            <div>
              <strong>{profile.public_repos}</strong>
              <span>Repositories</span>
            </div>

            <div>
              <strong>{profile.followers}</strong>
              <span>Followers</span>
            </div>

            <div>
              <strong>{profile.following}</strong>
              <span>Following</span>
            </div>
          </div>
          <h3 className="repo-title">Recent Repositories</h3>
          <div className="repositories">
            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="repository"
              >
                <strong>{repo.name}</strong>
                <span>{repo.description || "No Description"}</span>
                <small>
                    ⭐️ {repo.stargazers_count }.{" "}
                    {repo.language || "Unknown"}
                </small>
              </a>
            ))}
          </div>

          <a
            className="github-profile-link"
            href={profile.html_url}
            target="_blank"
            rel="noreferrer"
          >
            View GitHub
          </a>
        </>
      )}
    </section>
  );
}

export default GitHub;
