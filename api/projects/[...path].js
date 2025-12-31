import path from "path";
import fs from "fs";

export default async function handler(req, res) {
  const parts = req.query.path;

  // Must at least have a project name
  if (!parts || parts.length < 1) {
    return res.status(400).json({ error: "Invalid project path" });
  }

  const projectName = parts[0];

  // If only /projects/{name}, default to index.html
  const filePath =
    parts.length === 1
      ? "index.html"
      : parts.slice(1).join("/");

  // 🔐 Prevent path traversal
  if (filePath.includes("..")) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  // TEMP DEBUG (remove later)
  return res.status(200).json({
    projectName,
    filePath,
    rawPath: parts
  });
}
