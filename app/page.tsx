"use client"

import { useState } from "react"

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")

  const fetchTasks = async () => {
    if (!email.trim()) {
      setError("Please enter your team member email")
      return
    }

    try {
      setLoading(true)
      setError("")
      const response = await fetch(`/api/tasks?email=${encodeURIComponent(email)}`)

      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error("Failed to load tasks:", err)
      setError(`Failed to load tasks: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>Dashboard</h1>
        <p style={{ color: "#666" }}>Manage your tasks and team</p>
      </div>

      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            marginBottom: "8px",
            color: "#374151",
          }}
        >
          Team Member Email
        </label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your team member email"
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
            }}
            onKeyPress={(e) => e.key === "Enter" && fetchTasks()}
          />
          <button
            onClick={fetchTasks}
            disabled={loading}
            style={{
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            {loading ? "Loading..." : "Load Tasks"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "4px" }}>Tasks</h2>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>Your current tasks from Google Sheets</p>
        </div>

        <div style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#666" }}>Loading tasks...</div>
          ) : tasks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {tasks.map((task, index) => (
                <div
                  key={index}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <h3 style={{ fontWeight: "500", marginBottom: "8px" }}>
                    {task.title || task.name || `Task ${index + 1}`}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#666" }}>
                    {task.description || task.details || "No description"}
                  </p>
                </div>
              ))}
            </div>
          ) : email && !loading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#666" }}>No tasks found</div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px", color: "#666" }}>
              Enter your email above to load tasks
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
