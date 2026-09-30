import { useEffect, useState } from "react";
import "./App.css";
import GitHub from "./components/GitHub";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [time, setTime] = useState(new Date());
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const [links, setLinks] = useState([
    {
      id: 1,
      name: "Github",
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
  ]);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["links"], (result) => {
      if (result.links) {
        setLinks(result.links);
      }
    });
  }, []);
  useEffect(() => {
    chrome.storage.local.set({ links });
  }, [links]);
  function addLink() {
    const name = linkName.trim();
    const url = linkUrl.trim();
    if (!name || !url) return;
    let formattedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      formattedUrl = `https://${url}`;
    }
    setLinks([
      ...links,
      {
        id: Date.now(),
        name,
        url: formattedUrl,
      },
    ]);
    setLinkName("");
    setLinkUrl("");
  }
  function deleteLink(id) {
    setLinks(links.filter((link) => link.id !== id));
  }

  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      setIsRunning(false);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const hour = time.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    chrome.storage.local.get(["tasks"], (result) => {
      if (result.tasks) {
        setTasks(result.tasks);
      }
    });
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ tasks });
  }, [tasks]);

  function addTask() {
    const text = newTask.trim();

    if (!text) return;

    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text,
        completed: false,
      },
    ]);

    setNewTask("");
  }

  function toggleTask(id) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function deleteTask(id) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      addTask();
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="greeting">{greeting} 👋</p>
          <h1>DevTab</h1>
        </div>

        <div className="clock">
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      <main className="dashboard">
        <section className="card">
          <h2>Today's Tasks</h2>

          {tasks.map((task) => (
            <div className="task" key={task.id}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />

              <span
                className={task.completed ? "completed" : ""}
                onDoubleClick={() => deleteTask(task.id)}
              >
                {task.text}
              </span>
            </div>
          ))}

          <div className="task-input">
            <input
              type="text"
              placeholder="Add a task..."
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button onClick={addTask}>Add</button>
          </div>

          <p className="task-hint">Double-click a task to delete it.</p>
        </section>

        <section className="card">
          <h2>Coding Time</h2>

          <div className="stat">
            <strong>0h 00m</strong>
            <span>Today</span>
          </div>

          <div className="stat">
            <strong>0h 00m</strong>
            <span>This week</span>
          </div>
        </section>

        <GitHub />

        <section className="card">
          <h2>Pomodoro</h2>

          <div className="timer">{formattedTime}</div>
          <div className="timer-controls">
            <button
              className="start-button"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              className="reset-button"
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(25 * 60);
              }}
            >
              Reset
            </button>
          </div>
        </section>

        <section className="card quick-links">
          <h2>Quick Links</h2>

          <div className="links">
            {links.map((link) => (
              <div className="link-item" key={link.id}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.name}
                </a>
                <button
                  className="delete-link"
                  onClick={() => deleteLink(link.id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <div className="link-form">
            <input
              type="text"
              placeholder="Name"
              value={linkName}
              onChange={(event) => setLinkName(event.target.value)}
            />
            <input
              type="text"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
            />
            <button onClick={addLink}>Add Link</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
