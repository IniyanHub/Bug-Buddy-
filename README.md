# Self-Healing Developer Agent

An autonomous AI agent that monitors code execution, detects errors, and automatically generates and applies fixes using Google Gemini.

## Features

- **Command Monitoring**: Wraps standard CLI commands and captures output.
- **Error Detection**: Automatically triggers when a command exits with a non-zero code.
- **AI Analysis**: Uses Google Gemini 3.1 Pro to analyze tracebacks and identify root causes.
- **Smart Patching**: Generates unified diffs and full file fixes.
- **Safety First**: Backs up original files before applying any AI-generated patches.
- **Interactive UI**: Web-based terminal and healing dashboard for developer oversight.

## Project Structure

```text
self-healing-agent/
├── examples/             # Demo buggy applications
│   ├── buggy_app.py      # ModuleNotFoundError demo
│   ├── math_error.py     # TypeError demo
│   └── file_error.py     # FileNotFoundError demo
├── server.ts             # Express backend for file ops & command execution
├── src/
│   ├── App.tsx           # React Dashboard & AI logic
│   └── main.tsx          # Entry point
└── package.json          # Dependencies
```

## Getting Started

1. **Configure Gemini API**:
   Ensure your `GEMINI_API_KEY` is set in the AI Studio Secrets panel.

2. **Run the Dashboard**:
   The application starts automatically in the AI Studio preview.

3. **Try a Demo**:
   - Select "Buggy App" from the command presets.
   - Click **RUN**.
   - Watch the agent detect the `ModuleNotFoundError`.
   - Review the AI-generated fix in the right panel.
   - Click **APPLY FIX** to heal the code.
   - The agent will automatically re-run the command to verify the fix.

## Technical Details

- **Backend**: Node.js with Express for secure file system access.
- **Frontend**: React with Tailwind CSS and Framer Motion.
- **AI**: Google Gemini 3.1 Pro for reasoning and code generation.
- **Diffing**: `diff` library for visual patch previews.

  - `GITHUB_CLIENT_ID` - Your GitHub OAuth app's Client ID
  - `GITHUB_CLIENT_SECRET` - Your GitHub OAuth app's Client Secret

## Safety & Security

- All file operations are restricted to the project directory.
- AI fixes require explicit user confirmation before being applied.
- Automatic backups (`.bak` files) are created for every modification.
