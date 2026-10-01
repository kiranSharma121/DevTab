import { useEffect, useState } from "react";
import "./App.css";
import Github from "./components/Github";
import CodingTime from "./components/CodingTime";

const DEFAULT_LINKS = [
  {
    id: 1,
    name: "GitHub",
    url: "https://github.com",
  },
  {
    id: 2,
    name: "MDN",
    url: "https://developer.mozilla.org",
  },
  {
    id: 3,
    name: "Stack Overflow",
    url: "https://stackoverflow.com",
  },
  {
    id: 4,
    name: "npm",
    url: "https://npmjs.com",
  },
];
const POMODORO_DURATION = 25 * 60;
function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [links, setLinks] = useState(DEFAULT_LINKS);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linksLoaded, setLinksLoaded] = useState(false);
  const [time, setTime] = useState(new Date());
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const hour = time.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good afternoon" : "Good evening";
  useEffect(() => {
    chrome.storage.local.get(["tasks"], (result) => {
      if (Array.isArray(result.tasks)) {
        setTasks(result.tasks);
      }
      setTasksLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!tasksLoaded) return;
    chrome.storage.local.set({ tasks });
  }, [tasks, tasksLoaded]);
  useEffect(() => {
    chrome.storage.local.get(["links"], (result) => {
      if (Array.isArray(result.links)) {
        setLinks(result.links);
      }
      setLinksLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!linksLoaded) return;
    chrome.storage.local.set({ links });
  }, [links, linksLoaded]);
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);
  useEffect(() => {
    document.title = `${formattedTime}.DevTab`;
  }, [formattedTime]);
  function addTask() {
    const text = newTask.trim();
    if (!text) return;
    setTasks((currentTasks) => [
      ...current,
      {
        id: Date.now(),
        text,
        completed: false,
      },
    ]);
    setNewTask("");
  }
  function toggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id == id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task,
      ),
    );
  }
  function deleteTask(id) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id != id));
  }
  function handleTaskKeyDown(event) {
    if (event.key == "Enter") {
      event.preventDefault();
      addTask();
    }
  }
  function addLink() {
    const name = linkName.trim();
    const url = linkUrl.trim();
    if (!name || !url) return;

    const formattedUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    try {
      new URL(formattedUrl);
    } catch {
      return;
    }
    setLinks((currentLinks) => [
      ...currentLinks,
      {
        id: Date.now(),
        name,
        url: formattedUrl,
      },
    ]);
    setLinkName("");
    setLinkUrl();
  }
  function deleteLink(id) {
    setLinks((currentLinks) => currentLinks.filter((link) => link.id !== id));
  }
  function handleLinkKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addLink();
    }
  }
  function togglePomodoro() {
    if (secondsLeft === 0) {
      setSecondsLeft(POMODORO_DURATION);
    }
    setIsRunning((current) => !current);
  }
  function resetPomodoro() {
    setIsRunning(false);
    setSecondsLeft(POMODORO_DURATION);
  }
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <p className="greeting">{greeting} 👋</p>
          <h1>DevTab</h1>
          <p className="header-subtitle">
            Your workspace for focused development.
          </p>
        </div>

        <div className="clock" aria-label="Current time">
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      <main className="dashboard">
        <section className="card tasks-card">
          <div className="card-header">
            <div>
              <h2>Today's Tasks</h2>
              <p className="card-description">
                {tasks.length === 0
                  ? "Nothing planned yet."
                  : `${completedTasks} of ${tasks.length} completed`}
              </p>
            </div>

            {tasks.length > 0 && (
              <span className="card-count">
                {completedTasks}/{tasks.length}
              </span>
            )}
          </div>

          <div className="task-list">
            {tasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✓</span>
                <p>Add your first task to get started.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div className="task" key={task.id}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`Mark ${task.text} as ${
                      task.completed ? "incomplete" : "complete"
                    }`}
                  />

                  <span
                    className={task.completed ? "completed" : ""}
                    onDoubleClick={() => deleteTask(task.id)}
                    title="Double-click to delete"
                  >
                    {task.text}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="task-input">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              onKeyDown={handleTaskKeyDown}
              aria-label="New task"
            />

            <button onClick={addTask}>Add</button>
          </div>

          {tasks.length > 0 && (
            <p className="task-hint">Double-click a task to delete it.</p>
          )}
        </section>

        <CodingTime />

        <GitHub />

        <section className="card pomodoro-card">
          <div className="card-header">
            <div>
              <h2>Pomodoro</h2>
              <p className="card-description">
                {isRunning ? "Focus session in progress" : "Ready to focus?"}
              </p>
            </div>
          </div>

          <div className="timer">{formattedTime}</div>

          <div className="timer-controls">
            <button className="start-button" onClick={togglePomodoro}>
              {isRunning ? "Pause" : secondsLeft === 0 ? "Restart" : "Start"}
            </button>

            <button className="reset-button" onClick={resetPomodoro}>
              Reset
            </button>
          </div>
        </section>

        <section className="card quick-links">
          <div className="card-header">
            <div>
              <h2>Quick Links</h2>
              <p className="card-description">
                Your frequently used developer tools.
              </p>
            </div>

            <span className="card-count">{links.length}</span>
          </div>

          {links.length > 0 ? (
            <div className="links">
              {links.map((link) => (
                <div className="link-item" key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open ${link.name}`}
                  >
                    <span>{link.name}</span>
                    <span className="external-icon">↗</span>
                  </a>

                  <button
                    className="delete-link"
                    onClick={() => deleteLink(link.id)}
                    aria-label={`Delete ${link.name}`}
                    title={`Delete ${link.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">↗</span>
              <p>Add a link to your developer toolkit.</p>
            </div>
          )}

          <div className="link-form">
            <input
              type="text"
              placeholder="Name"
              value={linkName}
              onChange={(event) => setLinkName(event.target.value)}
              onKeyDown={handleLinkKeyDown}
              aria-label="Link name"
            />

            <input
              type="text"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={handleLinkKeyDown}
              aria-label="Link URL"
            />

            <button onClick={addLink}>Add Link</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
