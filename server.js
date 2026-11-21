require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS."));
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(200).type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusPulse IT Support Desk API Guide</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 820px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    pre { background: #f4f4f4; padding: 0.75rem; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>CampusPulse IT Support Desk — API Guide</h1>
  <p><strong>Student Number:</strong>202512781</p>
  <p><strong>Description:</strong> Standalone backend REST API for managing CampusPulse IT support requests.</p>
  <p><strong>Base URL:</strong> <code>${baseUrl}</code></p>
  <p>
    <a href="${baseUrl}/health">/health</a> |
    <a href="${baseUrl}/api/records">/api/records</a>
  </p>
  <p><em>Note: If hosted on a free tier, an idle service may take a moment to spin up on the first request.</em></p>

  <h2>Endpoints</h2>
  <table>
    <thead>
      <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td>GET</td><td>/</td><td>API documentation guide for markers</td></tr>
      <tr><td>GET</td><td>/health</td><td>Server and database health check</td></tr>
      <tr><td>GET</td><td>/api/records</td><td>List all support records</td></tr>
      <tr><td>GET</td><td>/api/records/:id</td><td>Get a single support record by ID</td></tr>
      <tr><td>POST</td><td>/api/records</td><td>Create a new support record</td></tr>
      <tr><td>PUT</td><td>/api/records/:id</td><td>Replace all editable fields of an existing record</td></tr>
      <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a support record by ID</td></tr>
    </tbody>
  </table>

  <h2>Fields &amp; Allowed Statuses</h2>
  <ul>
    <li><code>id</code>: Generated positive integer (do not send in POST or PUT).</li>
    <li><code>title</code>: String, 3–80 characters.</li>
    <li><code>category</code>: String, 2–40 characters.</li>
    <li><code>description</code>: String, 5–300 characters.</li>
    <li><code>status</code>: <code>Pending</code>, <code>In progress</code>, or <code>Completed</code>.</li>
  </ul>

  <h2>Sample POST / PUT JSON Body</h2>
  <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>

  <h2>Status Codes</h2>
  <p>Success: <code>200</code> (GET, PUT, DELETE), <code>201</code> (POST). Errors: <code>400</code> (invalid input, invalid ID, or malformed JSON), <code>404</code> (missing record or unknown route), <code>500</code> (unexpected server error), <code>503</code> (/health database check failure).</p>
</body>
</html>`);
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "error", message: "Database unavailable." });
  }
});

app.use("/api/records", require("./routes/records"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  res.status(500).json({ message: "Internal server error." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});