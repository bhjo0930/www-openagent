# OpenAgent Hub Landing + News

## Run

```bash
npm install
npm start
```

Server starts at `http://localhost:3000`.

## News API (SQLite)

- `GET /api/news?limit=12`
  - Returns latest news items.
- `POST /api/news`
  - Body JSON:
  ```json
  {
    "title": "Your title",
    "content": "Your content"
  }
  ```

SQLite database file is created at `data/openagent.db`.
