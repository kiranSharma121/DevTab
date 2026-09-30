import { useEffect, useState } from "react";
function GitHub() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
}
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
    chromeExtension.storage.local.set({
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
