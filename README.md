# Env & Branching

A small Node.js and MongoDB task API. The same application dynamically loads staging, preprod, or prod configuration. The assignment focuses on clear structure, feature branches, pull requests, and meaningful commits. No deployment is needed.

## Setup

Use Node.js 24 or newer and an existing MongoDB server. From the repository folder:

```bash
npm ci
npm run start:staging
```

The default connection is `mongodb://127.0.0.1:27017`. To use another MongoDB server, copy the relevant example file and set `MONGODB_URI` in the local file:

```bash
cp .env.staging.example .env.staging
```

Keep credentials in local `.env` files, which Git ignores. Commit the example files. Stop the app with Ctrl+C.

## Environments

| Environment | Start command | Default port | Default database |
| --- | --- | --- | --- |
| staging | `npm run start:staging` | 3001 | `env_branching_staging` |
| preprod | `npm run start:preprod` | 3002 | `env_branching_preprod` |
| prod | `npm run start:prod` | 3003 | `env_branching_prod` |

You can also select an environment with `APP_ENV=preprod node src/server.js`. Unknown names fail at startup. Exported environment variables take priority over the selected `.env` file, followed by the environment defaults. Separate database names keep the environments' data separate.

## Structure

```text
src/
  config/          Environment selection and MongoDB connection
    environments/ Defaults for staging, preprod, and prod
  models/          Task schema
  services/        CRUD database operations
  routes/          HTTP endpoints
  app.js           Express application
  server.js        Database connection and startup
```

## API

A task has a required `title` of at most 200 characters and a `completed` boolean that defaults to `false`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Check application health |
| POST | `/tasks` | Create a task |
| GET | `/tasks` | List tasks |
| GET | `/tasks/:id` | Read one task |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

With staging running, use another Ubuntu terminal:

```bash
curl -X POST http://localhost:3001/tasks -H 'Content-Type: application/json' -d '{"title":"Practice feature branches"}'
curl http://localhost:3001/tasks
```

## Git workflow and checks

`main` holds the submission. `develop` integrates work. Create each feature branch from `develop`, commit its changes, push it, and open a pull request into `develop`. Use `feat/environment-config`, `feat/task-crud`, and `docs/setup`, then a final pull request from `develop` into `main`. Retain merge commits so the history shows the workflow.

`git add <files>` selects changes; `git commit` saves a local checkpoint; `git push -u origin <branch>` uploads the branch and sets its upstream. A pull request proposes a merge. Merging incorporates the changes into the target branch. Pushing alone does not merge anything.

Husky and Commitlint check `type(scope): description` messages. Allowed scopes are `api`, `ui`, `db`, `deps`, and `core`; examples are `feat(api): implement task CRUD endpoints` and `docs(core): document setup`. Commit source and `package-lock.json`; exclude `node_modules` and secret configuration files.

Run `npm test` for configuration checks, `git status --short --branch` for pending changes, and `git log --graph --decorate --oneline --all` to inspect the branch history. Configuration checks do not establish that MongoDB CRUD works; verify the endpoints with your running database.
