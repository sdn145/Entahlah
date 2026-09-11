PYNI PTERODACTYL — STANDALONE

This is a real backend + dashboard. It is NOT a GitHub Pages-only runtime.
GitHub Pages can host the frontend, but cannot execute Node/Python/Minecraft.
Run this ZIP on a machine/runtime that permits processes.

Install:
  npm install
Run:
  npm start
Open:
  http://localhost:3000

Create a server, then upload/copy its files into:
  servers/<server-name>/

Start command examples:
  node index.js
  python bot.py

Minecraft Bedrock requires a compatible server executable and its required libraries.
Security: this demo intentionally does not expose arbitrary process execution over the public
internet without authentication. Put it behind HTTPS/authentication before exposing it.
