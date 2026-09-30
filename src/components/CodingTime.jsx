import { useEffect, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_HACKATIME_CLIENT_ID;
const AUTH_URL = import.meta.env.VITE_HACKATIME_AUTH_URL;
const TOKEN_URL = import.meta.env.VITE_HACKATIME_TOKEN_URL;
const API_URL = import.meta.env.VITE_HACKATIME_API_URL;

function base64UrlEncode(bytes) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomString(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const array = new Uint8Array(length);

  crypto.getRandomValues(array);

  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);

  const hash = await crypto.subtle.digest("SHA-256", data);

  return base64UrlEncode(new Uint8Array(hash));
}

function formatTime(seconds) {
  const totalMinutes = Math.floor(seconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function getDateString(date) {
  return date.toISOString().split("T")[0];
}

async function getHackatimeData(token) {
  const today = new Date();

  const weekStart = new Date(today);

  weekStart.setDate(today.getDate() - 6);

  const todayString = getDateString(today);
  const weekStartString = getDateString(weekStart);

  const [todayResponse, weekResponse, streakResponse] = await Promise.all([
    fetch(
      `${API_URL}/authenticated/hours?start_date=${todayString}&end_date=${todayString}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ),

    fetch(
      `${API_URL}/authenticated/hours?start_date=${weekStartString}&end_date=${todayString}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ),

    fetch(`${API_URL}/authenticated/streak`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ]);

  if (!todayResponse.ok || !weekResponse.ok || !streakResponse.ok) {
    throw new Error("Could not load Hackatime data");
  }

  const todayData = await todayResponse.json();
  const weekData = await weekResponse.json();
  const streakData = await streakResponse.json();

  return {
    today: todayData.total_seconds || 0,
    week: weekData.total_seconds || 0,
    streak: streakData.streak_days || 0,
  };
}

async function connectHackatime() {
  if (!CLIENT_ID) {
    throw new Error("Hackatime Client ID is missing. Check your .env file.");
  }

  if (!AUTH_URL || !TOKEN_URL || !API_URL) {
    throw new Error("Hackatime environment variables are missing.");
  }

  const redirectUri = chrome.identity.getRedirectURL();

  const state = randomString(32);

  const codeVerifier = randomString(64);

  const codeChallenge = await createCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "profile read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authorizationUrl = `${AUTH_URL}?${params.toString()}`;

  const responseUrl = await new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authorizationUrl,
        interactive: true,
      },
      (callbackUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));

          return;
        }

        if (!callbackUrl) {
          reject(new Error("Hackatime did not return a callback URL."));

          return;
        }

        resolve(callbackUrl);
      },
    );
  });

  const callbackUrl = new URL(responseUrl);

  const returnedState = callbackUrl.searchParams.get("state");

  const code = callbackUrl.searchParams.get("code");

  const oauthError = callbackUrl.searchParams.get("error");

  if (oauthError) {
    throw new Error(`Hackatime authorization failed: ${oauthError}`);
  }

  if (returnedState !== state) {
    throw new Error("Invalid OAuth state");
  }

  if (!code) {
    throw new Error("Authorization code was not received");
  }

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },

    body: new URLSearchParams({
      client_id: CLIENT_ID,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();

    console.error("Hackatime token error:", errorText);

    throw new Error("Could not exchange authorization code.");
  }

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    throw new Error("Hackatime did not return an access token.");
  }

  await chrome.storage.local.set({
    hackatimeAccessToken: tokenData.access_token,
  });

  return tokenData.access_token;
}

function CodingTime() {
  const [connected, setConnected] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [today, setToday] = useState(0);

  const [week, setWeek] = useState(0);

  const [streak, setStreak] = useState(0);

  async function loadData(token) {
    try {
      const data = await getHackatimeData(token);

      setToday(data.today);

      setWeek(data.week);

      setStreak(data.streak);

      setConnected(true);

      setError("");
    } catch (error) {
      console.error("Hackatime data error:", error);

      setConnected(false);

      setError(error.message);

      await chrome.storage.local.remove("hackatimeAccessToken");
    }
  }

  async function handleConnect() {
    try {
      setLoading(true);

      setError("");

      const token = await connectHackatime();

      await loadData(token);
    } catch (error) {
      console.error("Hackatime connection error:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setLoading(true);

      setError("");

      const result = await chrome.storage.local.get(["hackatimeAccessToken"]);

      if (!result.hackatimeAccessToken) {
        setConnected(false);

        return;
      }

      await loadData(result.hackatimeAccessToken);
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await chrome.storage.local.remove("hackatimeAccessToken");

    setConnected(false);

    setToday(0);

    setWeek(0);

    setStreak(0);

    setError("");
  }

  useEffect(() => {
    async function checkConnection() {
      try {
        const result = await chrome.storage.local.get(["hackatimeAccessToken"]);

        if (result.hackatimeAccessToken) {
          await loadData(result.hackatimeAccessToken);
        }
      } catch (error) {
        console.error(error);

        setError(error.message);
      }
    }

    checkConnection();
  }, []);

  return (
    <section className="card coding-time-card">
      <div className="coding-time-header">
        <div>
          <h2>Coding Time</h2>

          <p>Hackatime</p>
        </div>

        {connected && (
          <button
            className="hackatime-refresh"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      {!connected ? (
        <div className="hackatime-connect">
          <p>Connect Hackatime to see your real coding time.</p>

          <button onClick={handleConnect} disabled={loading}>
            {loading ? "Connecting..." : "Connect Hackatime"}
          </button>

          {error && <p className="hackatime-error">{error}</p>}
        </div>
      ) : (
        <>
          <div className="coding-time-stats">
            <div>
              <strong>{formatTime(today)}</strong>

              <span>Today</span>
            </div>

            <div>
              <strong>{formatTime(week)}</strong>

              <span>Last 7 Days</span>
            </div>

            <div>
              <strong>{streak}</strong>

              <span>Day Streak</span>
            </div>
          </div>

          <button className="hackatime-logout" onClick={handleLogout}>
            Disconnect
          </button>

          {error && <p className="hackatime-error">{error}</p>}
        </>
      )}
    </section>
  );
}

export default CodingTime;
