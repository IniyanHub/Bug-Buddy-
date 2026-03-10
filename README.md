<p align="center"> <img src="https://miro.medium.com/v2/resize:fit:1400/1*0s5s8a7m8Jrj9r6p9FvG5w.png" alt="AI Developer Agent Banner" width="100%"> </p> <h1 align="center">🤖 Self-Healing Developer Agent</h1> <p align="center"> <em>An AI-powered debugging assistant that detects coding errors and automatically heals them</em> </p> <p align="center"> <em>Built with ❤️ by <strong>Iniyan</strong>, <strong>Maddie</strong>, <strong>abi</strong>, and <strong>Nila</strong></em> </p>
👨‍💻 Team Members
<p align="center"> <strong>👤 Iniyan</strong> – Backend Development & Agent Logic<br> <strong>🤖 Abi</strong> – AI Prompt Engineering & Model Integration<br> <strong>⚙ Maddie</strong> – System Integration & Testing<br> <strong>🎨 Nila</strong> – Frontend UI/UX Development </p>
🧭 Project Overview

Self-Healing Developer Agent is an intelligent AI system that automatically detects coding errors, analyzes the root cause, and suggests or applies fixes using AI.

The system acts like a smart debugging assistant that monitors program execution and repairs code with developer approval.

🧠 Key Objectives

Reduce developer debugging time

Automatically detect runtime errors

Generate AI-powered code fixes

Improve developer productivity

Create a safer debugging workflow

🔄 System Workflow
<p align="center"> <img src="https://miro.medium.com/v2/resize:fit:1200/1*2YkYyqS-gtnznuaCG2lLBg.png" width="85%"> </p>
Workflow Steps

1️⃣ Developer Command Execution
The developer runs a command through the agent.

2️⃣ Error Detection
If the command fails, the system captures the error logs.

3️⃣ AI Error Analysis
The AI model analyzes the error and identifies the root cause.

4️⃣ Patch Generation
AI generates a code patch to fix the error.

5️⃣ User Confirmation
The developer reviews the suggested fix.

6️⃣ Automatic Code Healing
If approved, the agent applies the fix and reruns the program.

🌟 Core Features
🐞 Automatic Error Detection
<p align="center"> <img src="https://miro.medium.com/v2/resize:fit:1200/1*8VZVxDSHLVQQP4Jrped1Zg.png" width="70%"> </p>

The system monitors developer commands and detects errors such as:

Python Tracebacks

Syntax Errors

API Errors (401 / 500)

Missing Dependencies

🤖 AI-Powered Debugging
<p align="center"> <img src="https://miro.medium.com/v2/resize:fit:1200/1*3Q6kVbUaz2YsmiVjCwXTlz.png" width="70%"> </p>

The system integrates with
Google AI Studio

The AI performs:

Error explanation

Root cause analysis

Code fix generation

Patch creation

🩹 Smart Code Healing

Example detected error:

import request
response = request.get("https://api.example.com")

Error:

ModuleNotFoundError: No module named 'request'

AI generated patch:

-import request
+import requests

The developer can approve the fix and the agent automatically heals the code.

🖥 Interactive Debugging Dashboard

The project includes a web-based dashboard built with:

React

Tailwind CSS

Framer Motion

The dashboard shows:

Error logs

AI explanations

Patch previews

Fix approval button

💡 Project Workflow
Developer runs command
        ↓
Agent executes program
        ↓
Error detected
        ↓
Error logs sent to AI
        ↓
AI analyzes root cause
        ↓
AI generates patch
        ↓
Developer reviews fix
        ↓
Patch applied automatically
        ↓
Program re-runs to verify fix
🏗 Project Structure
self-healing-agent/
│
├── examples/
│   ├── buggy_app.py
│   ├── math_error.py
│   └── file_error.py
│
├── server.ts
│
├── src/
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
└── README.md
🧰 Technology Stack
Backend

Node.js

Express.js

Frontend

React

Tailwind CSS

Framer Motion

AI Integration

Google AI Studio

Diff Visualization

diff library

🔐 Safety & Security

✔ AI fixes require developer approval
✔ Automatic .bak backups created before modification
✔ File operations restricted to project directory
✔ Safe command execution environment

🚀 Future Improvements

Multi-language debugging (Python, JavaScript, Java)

Auto dependency installation

Git auto commit after fixes

Debugging analytics dashboard

AI generated unit tests

⭐ Project Vision

The Self-Healing Developer Agent aims to become a next-generation AI developer assistant that automatically detects and fixes coding errors, helping developers focus on building better software.
