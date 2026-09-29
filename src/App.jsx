import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  useEffect(() => {
    chromeExtension.storage.local.get(["tasks"], (result) => {
      if (result.tasks) {
        setTasks(result.tasks);
      }
    });
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
        task.id == id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }
  function deleteTask(id) {
    setTasks(tasks.filter((task) => task.id !== id));
  }
  function handleKeyDown(event) {
    if (event.key == "Enter") {
      addTask();
    }
  }
  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="greeting">Good afternoon 👋</p>
          <h1>DevTab</h1>
        </div>
        <div className="clock">14:30</div>
      </header>
      <main className="dashboard">
        <section className="card">
          <h2>Today's Tasks</h2>

          <div className="task">
            <input type="checkbox" />
            <span>Build DevTab</span>
          </div>
          <div className="task">
            <input type="checkbox" />
            <span>Connect Github</span>
          </div>
          <div className="task">
            <input type="checkbox" />
            <span>Add Pomodoro</span>
          </div>
          <button className="add-task">+ Add task</button>
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
        <section className="card">
          <h2>GitHub</h2>
          <div className="github-stats">
            <div>
              <strong>0</strong>
              <span>Commits</span>
            </div>
            <div>
              <strong>0</strong>
              <span>PRs</span>
            </div>
          </div>
        </section>
        <section className="card">
          <h2>Pomodoro</h2>
          <div className="timer">25:00</div>
          <button className="start-button">Start</button>
        </section>
        <section className="card quick-links">
          <h2>Quick Links</h2>
          <div className="links">
            <a href="https://github.com" target="_blank">
              GitHub
            </a>
            <a href="https://developer.mozilla.org" target="_blank">
              MDN
            </a>
            <a href="https://stackoverflow.com" target="_blank">
              Stack Overflow
            </a>
            <a href="https://npmjs.com" target="_blank">
              npm
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
