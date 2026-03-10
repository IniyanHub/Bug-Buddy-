🧠 Self-Healing Developer Agent

🚀 An Autonomous AI Debugging Assistant that detects code errors, analyzes them using AI, and automatically generates fixes.

This project introduces an AI-powered developer assistant that monitors code execution, identifies runtime errors, and proposes intelligent fixes using Google AI Studio.

The agent behaves like a self-healing system for software projects — detecting bugs and repairing them with minimal developer intervention.

✨ Key Features

🔍 Command Monitoring
Wraps standard CLI commands and captures execution logs.

🐞 Automatic Error Detection
Detects failures whenever a command exits with a non-zero status.

🤖 AI Error Analysis
Uses Gemini AI to analyze stack traces and identify root causes.

🩹 Smart Patch Generation
Generates code fixes in unified diff format.

🛡 Safe Code Modification
Creates automatic .bak backups before applying fixes.

🖥 Interactive Debug Dashboard
Web-based interface to visualize errors and approve fixes.

⚡ Auto Verification
After applying a fix, the agent automatically re-runs the code to confirm the issue is resolved.

📸 Project Demo
🐞 Error Detection

Example error detected by the system:

The agent detects:

ModuleNotFoundError: No module named 'request'
🤖 AI Fix Suggestion

The AI agent analyzes the issue and proposes a patch:

-import request
+import requests
🛠 Code Healing

After user approval, the agent applies the fix automatically.

⚙️ System Workflow

The Self-Healing Agent follows this intelligent debugging workflow:

Developer runs command
        │
        ▼
Agent executes program
        │
        ▼
Error detected
        │
        ▼
Error logs sent to AI
        │
        ▼
AI analyzes root cause
        │
        ▼
AI generates code patch
        │
        ▼
Developer reviews fix
        │
        ▼
Fix applied automatically
        │
        ▼
Program re-runs to verify success
🏗 Project Architecture
self-healing-agent/
│
├── examples/                # Demo buggy applications
│   ├── buggy_app.py         # ModuleNotFoundError demo
│   ├── math_error.py        # TypeError demo
│   └── file_error.py        # FileNotFoundError demo
│
├── server.ts                # Express backend (command execution & file ops)
│
├── src/
│   ├── App.tsx              # React debugging dashboard
│   └── main.tsx             # Application entry point
│
├── package.json             # Project dependencies
└── README.md                # Project documentation
🚀 Getting Started
1️⃣ Configure Gemini API

Set your API key in the environment:

GEMINI_API_KEY=your_api_key

The project integrates with
Google AI Studio.

2️⃣ Start the Dashboard

Run the project inside your development environment.

The dashboard will automatically launch.

3️⃣ Run the Demo

Select Buggy App from command presets

Click RUN

The agent detects the error

AI suggests a fix

Click APPLY FIX

The code heals automatically 🎉

🧪 Example Debug Scenario
Buggy Code
import request
response = request.get("https://api.example.com")
Error
ModuleNotFoundError: No module named 'request'
AI Fix
-import request
+import requests
🧰 Technology Stack
Backend

Node.js

Express.js

Frontend

React

Tailwind CSS

Framer Motion

AI

Google AI Studio

Diff Engine

diff library

🔐 Safety & Security

✔ File operations restricted to project directory
✔ AI fixes require user approval
✔ Automatic .bak backups before modifications
✔ Command execution sandboxed

👨‍💻 Team Members

This project was developed by:

Name	Role
Iniyan	Backend Development & Agent Logic
Abi	AI Prompt Engineering
Maddie	System Integration & Testing
Nila	Frontend UI/UX Development
🎯 Project Vision

The Self-Healing Developer Agent aims to become an AI-powered debugging companion that:

✔ Detects software errors automatically
✔ Suggests intelligent fixes
✔ Repairs code safely
✔ Improves developer productivity

⭐ Future Improvements

Multi-language debugging (Python, JavaScript, Java)

Automatic dependency installation

Git commit automation

Debugging analytics dashboard

AI-generated unit tests

🌟 Support the Project

If you like this project:

⭐ Star the repository
🐛 Report issues
🚀 Contribute improvements
