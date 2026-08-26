import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  server: {
    port: 5173,
    open: false,
  },
  plugins: [
    {
      name: 'roadmap-json-api',
      configureServer(server) {
        const dataFilePath = path.resolve(__dirname, 'data/roadmap.json');

        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/roadmap') {
            if (req.method === 'GET') {
              try {
                if (!fs.existsSync(dataFilePath)) {
                  fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
                  fs.writeFileSync(dataFilePath, JSON.stringify({ columns: [], rows: [] }, null, 2), 'utf-8');
                }
                const data = fs.readFileSync(dataFilePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
                return;
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: message }));
                return;
              }
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body);
                  fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
                  fs.writeFileSync(dataFilePath, JSON.stringify(parsed, null, 2), 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, message: 'Saved successfully' }));
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : String(err);
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: message }));
                }
              });
              return;
            }
          }
          next();
        });
      },
    },
  ],
});
