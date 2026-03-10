import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_USER_AGENT = 'HealAgent-App';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // GitHub OAuth
  app.get('/api/auth/github/url', (req, res) => {
    const appId = process.env.GITHUB_CLIENT_ID;
    const appUrl = process.env.APP_URL;

    console.log('Generating GitHub Auth URL:', { appId: !!appId, appUrl });

    if (!appId || !appUrl) {
      return res.status(500).json({ error: 'GitHub Client ID or APP_URL not configured' });
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: `${appUrl}/auth/github/callback`,
      scope: 'repo,user',
      state: Math.random().toString(36).substring(7),
    });
    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url });
  });

  app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    console.log('GitHub Callback received, code:', !!code);

    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { 
          Accept: 'application/json',
          'User-Agent': GITHUB_USER_AGENT
        }
      });

      const { access_token, error, error_description } = response.data as any;
      
      if (error) {
        console.error('GitHub Token Error:', error, error_description);
        return res.status(400).send(`Authentication failed: ${error_description || error}`);
      }

      console.log('GitHub Token received successfully');
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${access_token}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('GitHub Auth Callback Error:', error.response?.data || error.message);
      res.status(500).send('Authentication failed');
    }
  });

  // Push to GitHub
  app.post('/api/github/push', async (req, res) => {
    const { token, repoName, commitMessage } = req.body;
    console.log('Pushing to GitHub repo:', repoName);

    try {
      // 1. Get user info
      const userRes = await axios.get('https://api.github.com/user', {
        headers: { 
          Authorization: `token ${token}`,
          'User-Agent': GITHUB_USER_AGENT
        }
      });
      const username = (userRes.data as { login: string }).login;

      // 2. Check if repo exists, if not create it
      let repo: any;
      try {
        const repoRes = await axios.get(`https://api.github.com/repos/${username}/${repoName}`, {
          headers: { 
            Authorization: `token ${token}`,
            'User-Agent': GITHUB_USER_AGENT
          }
        });
        repo = repoRes.data;
      } catch (e) {
        console.log('Repo not found, creating:', repoName);
        const createRes = await axios.post('https://api.github.com/user/repos', {
          name: repoName,
          private: true,
        }, {
          headers: { 
            Authorization: `token ${token}`,
            'User-Agent': GITHUB_USER_AGENT
          }
        });
        repo = createRes.data;
      }

      // 3. Simple push logic for demo: 
      const filesToPush = ['src/App.tsx', 'server.ts', 'package.json', 'README.md'];
      
      for (const file of filesToPush) {
        const content = await fs.readFile(path.resolve(process.cwd(), file), 'utf-8');
        const encodedContent = Buffer.from(content).toString('base64');
        
        // Get file sha if it exists
        let sha: string | undefined;
        try {
          const fileRes = await axios.get(`https://api.github.com/repos/${username}/${repoName}/contents/${file}`, {
            headers: { 
              Authorization: `token ${token}`,
              'User-Agent': GITHUB_USER_AGENT
            }
          });
          sha = (fileRes.data as { sha: string }).sha;
        } catch (e) {}

        await axios.put(`https://api.github.com/repos/${username}/${repoName}/contents/${file}`, {
          message: commitMessage || 'Update from HealAgent',
          content: encodedContent,
          sha
        }, {
          headers: { 
            Authorization: `token ${token}`,
            'User-Agent': GITHUB_USER_AGENT
          }
        });
      }

      res.json({ success: true, url: repo.html_url });
    } catch (error: any) {
      console.error('GitHub push error:', error.response?.data || error.message);
      res.status(500).json({ error: error.response?.data?.message || error.message });
    }
  });

  // Run a command and capture output
  app.post('/api/run', async (req, res) => {
    const { command } = req.body;
    try {
      const { stdout, stderr } = await execPromise(command);
      res.json({ success: true, stdout, stderr, exitCode: 0 });
    } catch (error: any) {
      res.json({ 
        success: false, 
        stdout: error.stdout || '', 
        stderr: error.stderr || error.message, 
        exitCode: error.code || 1 
      });
    }
  });

  // Read a file
  app.post('/api/read-file', async (req, res) => {
    const { filePath } = req.body;
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      // Security check: ensure path is within project
      if (!absolutePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const content = await fs.readFile(absolutePath, 'utf-8');
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Apply a patch (or just overwrite for simplicity in this demo)
  app.post('/api/apply-fix', async (req, res) => {
    const { filePath, content } = req.body;
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      if (!absolutePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Backup
      const backupPath = `${absolutePath}.bak`;
      try {
        await fs.copyFile(absolutePath, backupPath);
      } catch (e) {
        // Ignore if file doesn't exist yet
      }

      await fs.writeFile(absolutePath, content, 'utf-8');
      res.json({ success: true, backup: backupPath });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List files in a directory
  app.get('/api/files', async (req, res) => {
    try {
      const files = await fs.readdir(process.cwd(), { recursive: true });
      res.json({ files: files.filter(f => !f.includes('node_modules') && !f.includes('.git')) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload/Create a file
  app.post('/api/upload', async (req, res) => {
    const { fileName, content } = req.body;
    try {
      const absolutePath = path.resolve(process.cwd(), fileName);
      if (!absolutePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: 'Access denied' });
      }
      await fs.writeFile(absolutePath, content, 'utf-8');
      res.json({ success: true, path: fileName });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
