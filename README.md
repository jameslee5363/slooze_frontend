Slooze Commodity Dashboard

A lightweight Express + Handlebars + MongoDB app for managing products, authentication, and a role‑based dashboard.

# Slooze Commodity Dashboard

A lightweight **Express + Handlebars + MongoDB** app for managing products, authentication, and a role-based dashboard.

---

## Prerequisites

| Tool     | Version |
|----------|---------|
| Node.js  | ≥ 18    |
| MongoDB  | running locally (default DSN `mongodb://localhost/slooze`) |

---

## Quick start (local development)

```bash
# 1 — Clone your repo
$ git clone https://github.com/jameslee5363/sloozefrontend.git
$ cd sloozefrontend
$ cd src

# 2 — Install dependencies
$ npm install

# 3 — Configure environment variables
$ cp .env.example .env          # if you create an example file
$ Then, open .env in a text editor and update the values:
  DSN=mongodb://localhost/slooze
  SESSION_SECRET=change_me

# 4 — Run the app with hot-reload
$ node app.mjs                   # uses `node --watch app.mjs`

# Visit http://localhost:3000
```

---
