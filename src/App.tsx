import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Shield, CheckCircle, XCircle, AlertTriangle, FileCode, RefreshCw, ChevronRight, History, Settings, Cpu, Zap, Upload, FileUp, Search, Github, Send, ExternalLink, Download, MessageSquare, User, Bot, Sparkles, Monitor, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import * as diff from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---
interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
}

interface HealingAnalysis {
  error_explanation: string;
  root_cause: string;
  fix_summary: string;
  file_to_fix: string;
  suggested_content: string;
  time_complexity?: string;
  space_complexity?: string;
  code_suggestions?: string[];
}

interface HistoryItem {
  id: string;
  timestamp: string;
  command: string;
  error: string;
  fix: string;
  status: 'applied' | 'discarded';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// --- Components ---

const CodeDiff = ({ oldCode, newCode }: { oldCode: string, newCode: string }) => {
  const changes = diff.diffLines(oldCode, newCode);

  return (
    <div className="font-mono text-xs bg-zinc-950 p-4 rounded-lg border border-zinc-800 overflow-x-auto max-h-[400px]">
      {changes.map((part, index) => (
        <div 
          key={index} 
          className={`${
            part.added ? 'bg-emerald-500/10 text-emerald-400' : 
            part.removed ? 'bg-rose-500/10 text-rose-400 line-through' : 
            'text-zinc-400'
          } py-0.5 px-1 whitespace-pre`}
        >
          {part.added ? '+ ' : part.removed ? '- ' : '  '}
          {part.value}
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [command, setCommand] = useState('python3 examples/buggy_app.py');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [analysis, setAnalysis] = useState<HealingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'history' | 'import' | 'github' | 'assistant' | 'vscode'>('terminal');

  const openInVSCode = () => {
    // Try to open the current project in VS Code using the vscode:// protocol
    // This assumes the user has VS Code installed and potentially a remote extension
    // For now, we'll provide a helpful message and a link
    const vscodeUrl = `vscode://file/${window.location.hostname}${window.location.pathname}`;
    window.location.href = vscodeUrl;
  };
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [isPushing, setIsPushing] = useState(false);
  const [githubRepo, setGithubRepo] = useState('self-healing-agent');
  const [pushStatus, setPushStatus] = useState<{ success?: boolean, url?: string, error?: string } | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [lastFixedFile, setLastFixedFile] = useState<{ name: string, content: string } | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `### Welcome to HealAgent Assistant! 🚀

I am your AI Programming Assistant, ready to help you debug, optimize, and build your project.

**How I can help:**
- 🔍 **Debug Errors**: Explain and fix terminal errors.
- 💡 **Code Guidance**: Provide structured explanations and examples.
- ⚙️ **Project Context**: I know about your uploaded files and command history.

Feel free to ask any questions!` }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const token = event.data.token;
        setGithubToken(token);
        localStorage.setItem('github_token', token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const askAssistant = async () => {
    if (!userInput.trim() || isAsking) return;

    const userMsg: ChatMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsAsking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `
        You are a helpful AI Programming Assistant. 
        The user is working on a project in a cloud environment.
        Current project context:
        - Active Tab: ${activeTab}
        - Last Command Result: ${lastResult ? (lastResult.success ? 'Success' : 'Failed') : 'None'}
        - Uploaded File: ${uploadedFile || 'None'}
        - VS Code Connected: ${activeTab === 'vscode' ? 'Yes' : 'No'}
        
        User Question: ${userInput}

        IMPORTANT: Please structure your response as follows:
        1. **Summary**: A brief answer to the question.
        2. **Detailed Explanation**: A deeper dive into the concept.
        3. **Code Example**: Provide a clear, well-commented code example.
        4. **Complexity Analysis**: Explicitly state the **Time Complexity** and **Space Complexity** of the provided code example.
        5. **Code Suggestions**: Provide 1-2 alternative approaches or specific suggestions to improve the code (e.g., performance, readability).
        6. **Best Practices**: A few tips related to the topic.
        
        Use Markdown for formatting, especially for code blocks.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const assistantMsg: ChatMessage = { role: 'assistant', content: response.text || 'I am sorry, I could not generate a response.' };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Assistant error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while processing your request.' }]);
    } finally {
      setIsAsking(false);
    }
  };

  const connectGithub = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      if (!response.ok) {
        const err = await response.json();
        alert(`GitHub Auth Error: ${err.error || 'Failed to get auth URL'}`);
        return;
      }
      const { url } = await response.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('GitHub auth error:', error);
      alert('GitHub Auth Error: Check console for details');
    }
  };

  const pushToGithub = async () => {
    if (!githubToken) return;
    setIsPushing(true);
    setPushStatus(null);
    try {
      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: githubToken, 
          repoName: githubRepo,
          commitMessage: 'Update from Self-Healing Agent'
        }),
      });
      const result = await response.json();
      setPushStatus(result);
    } catch (error: any) {
      setPushStatus({ error: error.message });
    } finally {
      setIsPushing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, content }),
        });
        const result = await response.json();
        if (result.success) {
          setUploadedFile(file.name);
          // Suggest running the file
          const ext = file.name.split('.').pop();
          let cmd = '';
          if (ext === 'py') cmd = `python3 ${file.name}`;
          else if (ext === 'js') cmd = `node ${file.name}`;
          else if (ext === 'ts') cmd = `tsx ${file.name}`;
          
          if (cmd) {
            setCommand(cmd);
            setActiveTab('terminal');
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastResult, isExecuting]);

  const runCommand = async (cmdToRun?: string) => {
    const targetCmd = cmdToRun || command;
    setIsExecuting(true);
    setAnalysis(null);
    setLastResult(null);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: targetCmd }),
      });
      const result = await response.json();
      setLastResult({ ...result, command: targetCmd });

      if (!result.success) {
        triggerHealing(result, targetCmd);
      }
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const triggerHealing = async (result: CommandResult, cmd: string) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Step 1: Identify the file from the error message
      const fileMatch = result.stderr.match(/File "([^"]+)"/);
      const filePath = fileMatch ? fileMatch[1] : '';

      let fileContent = '';
      if (filePath) {
        const fileRes = await fetch('/api/read-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        });
        const fileData = await fileRes.json();
        fileContent = fileData.content;
        setOriginalContent(fileContent);
      }

      const prompt = `
        You are a Self-Healing Developer Agent.
        A command failed with the following error:
        
        COMMAND: ${cmd}
        EXIT CODE: ${result.exitCode}
        STDERR: ${result.stderr}
        STDOUT: ${result.stdout}
        
        ${filePath ? `FILE CONTENT of ${filePath}:\n${fileContent}` : 'No file content available.'}
        
        Analyze the error and provide a fix.
        Respond in JSON format with the following structure:
        {
          "error_explanation": "Briefly explain what went wrong",
          "root_cause": "Identify the root cause",
          "fix_summary": "Summarize the fix",
          "file_to_fix": "${filePath}",
          "suggested_content": "The full content of the file after the fix is applied",
          "time_complexity": "O(...) analysis of the suggested code",
          "space_complexity": "O(...) analysis of the suggested code",
          "code_suggestions": ["Suggestion 1", "Suggestion 2"]
        }
      `;

      // Helper for exponential backoff
      const generateWithRetry = async (retries = 3, delay = 2000): Promise<any> => {
        try {
          return await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Switched to flash for better rate limits
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
        } catch (error: any) {
          if (error.message?.includes('429') && retries > 0) {
            console.log(`Rate limit hit, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(retries - 1, delay * 2);
          }
          throw error;
        }
      };

      const aiResponse = await generateWithRetry();
      const healingData = JSON.parse(aiResponse.text || '{}');
      setAnalysis(healingData);
    } catch (error: any) {
      console.error('Healing analysis error:', error);
      if (error.message?.includes('429')) {
        setAnalysis({
          error_explanation: "API Quota Exceeded",
          root_cause: "The Gemini API rate limit has been reached.",
          fix_summary: "Please wait a moment before trying again, or check your API billing details.",
          file_to_fix: "",
          suggested_content: ""
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyFix = async () => {
    if (!analysis) return;

    try {
      const response = await fetch('/api/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: analysis.file_to_fix,
          content: analysis.suggested_content
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          command: lastResult?.command || '',
          error: lastResult?.stderr || '',
          fix: analysis.fix_summary,
          status: 'applied'
        }, ...prev]);
        
        setLastFixedFile({
          name: analysis.file_to_fix,
          content: analysis.suggested_content
        });
        setShowDownloadModal(true);
        setAnalysis(null);
        // Re-run the command to verify
        runCommand();
      }
    } catch (error) {
      console.error('Apply fix error:', error);
    }
  };

  const downloadFixedFile = () => {
    if (!lastFixedFile) return;
    const blob = new Blob([lastFixedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = lastFixedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  const discardFix = () => {
    if (analysis) {
      setHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        command: lastResult?.command || '',
        error: lastResult?.stderr || '',
        fix: analysis.fix_summary,
        status: 'discarded'
      }, ...prev]);
    }
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="text-zinc-950 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">HealAgent <span className="text-zinc-500 font-normal text-sm">v1.0</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Autonomous Debugging System</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700">
            <button 
              onClick={() => setActiveTab('terminal')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'terminal' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Terminal
            </button>
            <button 
              onClick={() => setActiveTab('import')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'import' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Import
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              History
            </button>
            <button 
              onClick={() => setActiveTab('github')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'github' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              GitHub
            </button>
            <button 
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'assistant' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Assistant
            </button>
            <button 
              onClick={() => setActiveTab('vscode')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'vscode' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              VS Code
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('vscode')}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-all"
            >
              <Monitor size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-blue-400">VS Code</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">System Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Command & Terminal */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'terminal' ? (
            <>
              {/* Command Input */}
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal size={18} />
                    <span className="text-sm font-medium uppercase tracking-wider">Execute Command</span>
                  </div>
                  <div className="flex gap-2">
                    {uploadedFile && (
                      <button 
                        onClick={() => {
                          const ext = uploadedFile.split('.').pop();
                          let cmd = '';
                          if (ext === 'py') cmd = `python3 ${uploadedFile}`;
                          else if (ext === 'js') cmd = `node ${uploadedFile}`;
                          setCommand(cmd);
                        }}
                        className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/30 transition-colors flex items-center gap-1"
                      >
                        <FileCode size={10} />
                        Run {uploadedFile}
                      </button>
                    )}
                    <button 
                      onClick={() => setCommand('python3 examples/buggy_app.py')}
                      className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors"
                    >
                      Buggy App
                    </button>
                    <button 
                      onClick={() => setCommand('python3 examples/math_error.py')}
                      className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors"
                    >
                      Math Error
                    </button>
                  </div>
                </div>
                
                <div className="relative group">
                  <input 
                    type="text" 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runCommand()}
                    placeholder="Enter command to run..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-32 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                    <ChevronRight size={20} />
                  </div>
                  <button 
                    onClick={() => runCommand()}
                    disabled={isExecuting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isExecuting ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                    RUN
                  </button>
                </div>
              </section>

              {/* Terminal Output */}
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[500px]">
                <div className="bg-zinc-800/50 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Output Console</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                  {!lastResult && !isExecuting && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 opacity-50">
                      <Cpu size={48} strokeWidth={1} />
                      <p>Awaiting command execution...</p>
                    </div>
                  )}

                  {lastResult && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-zinc-500 border-b border-zinc-800 pb-2">
                        <span className="text-emerald-500">$</span>
                        <span>{lastResult.command}</span>
                      </div>
                      
                      {lastResult.stdout && (
                        <div className="text-zinc-300 whitespace-pre-wrap">{lastResult.stdout}</div>
                      )}
                      
                      {lastResult.stderr && (
                        <div className="text-rose-400 whitespace-pre-wrap bg-rose-500/5 p-4 rounded-lg border border-rose-500/10">
                          {lastResult.stderr}
                        </div>
                      )}

                      <div className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${lastResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        PROCESS EXITED WITH CODE {lastResult.exitCode}
                      </div>
                    </div>
                  )}

                  {isExecuting && (
                    <div className="flex items-center gap-3 text-emerald-500 animate-pulse">
                      <span className="animate-bounce">_</span>
                      <span>Executing...</span>
                    </div>
                  )}
                  
                  <div ref={terminalEndRef} />
                </div>
              </section>
            </>
          ) : activeTab === 'import' ? (
            /* Import Tab */
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl space-y-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <FileUp size={40} className="text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Import Local Project</h2>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto">Upload a buggy code file from your computer. HealAgent will analyze it, run it, and fix any errors it finds.</p>
              </div>

              <div className="w-full max-w-md">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-800 border-dashed rounded-2xl cursor-pointer bg-zinc-950 hover:bg-zinc-900 hover:border-emerald-500/50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                    ) : (
                      <Upload className="w-10 h-10 text-zinc-600 group-hover:text-emerald-500 mb-4 transition-colors" />
                    )}
                    <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-zinc-500">Python, JavaScript, or TypeScript files</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".py,.js,.ts" />
                </label>
              </div>

              {uploadedFile && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400"
                >
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">{uploadedFile} uploaded successfully!</span>
                  <button 
                    onClick={() => setActiveTab('terminal')}
                    className="ml-4 text-xs font-bold underline hover:text-emerald-300"
                  >
                    Go to Terminal
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-4 w-full max-w-lg pt-8 border-t border-zinc-800">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto text-zinc-400 font-bold text-xs">1</div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Upload File</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto text-zinc-400 font-bold text-xs">2</div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Run & Fail</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto text-zinc-400 font-bold text-xs">3</div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Auto-Heal</p>
                </div>
              </div>
            </section>
          ) : activeTab === 'github' ? (
            /* GitHub Tab */
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl space-y-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Github size={40} className="text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">GitHub Integration</h2>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto">Connect your GitHub account to directly push your healed code to a repository.</p>
              </div>

              {!githubToken ? (
                <div className="space-y-6">
                  <button 
                    onClick={connectGithub}
                    className="bg-white text-zinc-950 px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg hover:bg-zinc-200 mx-auto"
                  >
                    <Github size={18} />
                    Connect GitHub
                  </button>
                  
                  <div className="text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800 max-w-md mx-auto space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Setup Required</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">Ensure you have created a GitHub OAuth App and added these secrets in the AI Studio panel:</p>
                    <ul className="text-[11px] text-zinc-500 list-disc list-inside space-y-1 font-mono">
                      <li>GITHUB_CLIENT_ID</li>
                      <li>GITHUB_CLIENT_SECRET</li>
                    </ul>
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-tighter font-bold mb-1">GitHub Callback URL:</p>
                      <code className="text-[9px] text-emerald-500/70 break-all bg-emerald-500/5 p-1 rounded">
                        {window.location.origin}/auth/github/callback
                      </code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-6">
                  <div className="space-y-4">
                    <div className="text-left space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Repository Name</label>
                      <input 
                        type="text" 
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                        placeholder="my-healed-project"
                      />
                    </div>
                    
                    <button 
                      onClick={pushToGithub}
                      disabled={isPushing}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {isPushing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                      {isPushing ? 'Pushing Code...' : 'Push to GitHub'}
                    </button>

                    <button 
                      onClick={() => { setGithubToken(null); localStorage.removeItem('github_token'); }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                    >
                      Disconnect Account
                    </button>
                  </div>

                  {pushStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border ${pushStatus.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                    >
                      {pushStatus.success ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={18} />
                            <span className="font-bold">Successfully pushed to GitHub!</span>
                          </div>
                          <a 
                            href={pushStatus.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs underline hover:text-emerald-300"
                          >
                            View Repository <ExternalLink size={12} />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-center">
                          <XCircle size={18} />
                          <span className="font-bold">Error: {pushStatus.error}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              <div className="pt-8 border-t border-zinc-800 w-full max-w-lg">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Secure Integration via GitHub OAuth</p>
              </div>
            </section>
          ) : activeTab === 'assistant' ? (
            /* AI Assistant Tab */
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[650px]">
              <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <MessageSquare size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">AI Programming Assistant</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  <Sparkles size={12} className="text-amber-500" />
                  Powered by Gemini
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-500 text-zinc-950 font-medium rounded-tr-none' : 'bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-tl-none'}`}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <div className="markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isAsking && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                      <Bot size={16} />
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && askAssistant()}
                    placeholder="Ask anything about your code..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  />
                  <button 
                    onClick={askAssistant}
                    disabled={isAsking || !userInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 p-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </section>
          ) : activeTab === 'vscode' ? (
            /* VS Code Integration Tab */
            <section className="col-span-1 lg:col-span-12 flex flex-col items-center justify-center py-12 space-y-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 max-w-2xl"
              >
                <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 mb-6">
                  <Monitor className="text-white w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">VS Code Integration</h2>
                <p className="text-zinc-400 leading-relaxed">
                  Connect your local development environment to the HealAgent engine. 
                  Access your code directly in VS Code with full AI-powered debugging and healing capabilities.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6 hover:border-blue-500/30 transition-all group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-zinc-950 transition-all">
                    <ExternalLink size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Open in VS Code</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      Instantly open the current project directory in your local VS Code instance.
                    </p>
                  </div>
                  <button 
                    onClick={openInVSCode}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Monitor size={20} />
                    LAUNCH VS CODE
                  </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6 hover:border-emerald-500/30 transition-all group">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all">
                    <Zap size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Connect Agent</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      Sync your HealAgent session with VS Code to receive real-time fixes and suggestions.
                    </p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-500">
                    <p className="mb-2 uppercase tracking-widest font-bold text-zinc-600">Connection Token</p>
                    <div className="flex items-center justify-between bg-zinc-900 p-2 rounded border border-zinc-800">
                      <span>HA-772-X91-B02</span>
                      <button className="text-emerald-500 hover:text-emerald-400">COPY</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 max-w-4xl w-full">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">How it works</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <div className="text-emerald-500 font-bold font-mono text-lg">01.</div>
                    <p className="text-xs text-zinc-400 leading-relaxed">Install the <b>HealAgent</b> extension from the VS Code Marketplace.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-emerald-500 font-bold font-mono text-lg">02.</div>
                    <p className="text-xs text-zinc-400 leading-relaxed">Paste your unique connection token into the extension settings.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-emerald-500 font-bold font-mono text-lg">03.</div>
                    <p className="text-xs text-zinc-400 leading-relaxed">Your local VS Code is now connected to the cloud healing engine.</p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            /* History Tab */
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-zinc-400">
                <History size={18} />
                <span className="text-sm font-medium uppercase tracking-wider">Fix History</span>
              </div>

              {history.length === 0 ? (
                <div className="py-20 text-center text-zinc-600 space-y-4">
                  <Zap size={48} strokeWidth={1} className="mx-auto opacity-20" />
                  <p>No fixes applied yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.status === 'applied' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-zinc-500">{item.timestamp}</span>
                        </div>
                        <span className="text-xs font-mono text-zinc-400">{item.command}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-200">{item.fix}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: Healing Panel */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl shadow-emerald-500/10 h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Zap className="text-emerald-500 w-10 h-10" />
                  </div>
                  <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Error</h3>
                  <p className="text-zinc-400 text-sm max-w-xs mx-auto">Gemini AI is scanning the traceback and generating a patch...</p>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-emerald-500 h-full"
                  />
                </div>
              </motion.div>
            ) : analysis ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full"
              >
                <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Shield size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">Solution Found</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-500/60 font-mono">
                    <FileCode size={14} />
                    {analysis.file_to_fix}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Explanation</h4>
                      <p className="text-sm text-zinc-200 leading-relaxed">{analysis.error_explanation}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Root Cause</h4>
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-sm text-zinc-400 italic">
                        "{analysis.root_cause}"
                      </div>
                    </div>

                    {(analysis.time_complexity || analysis.space_complexity) && (
                      <div className="grid grid-cols-2 gap-4">
                        {analysis.time_complexity && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Time Complexity</h4>
                            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs text-emerald-400 font-mono">
                              {analysis.time_complexity}
                            </div>
                          </div>
                        )}
                        {analysis.space_complexity && (
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Space Complexity</h4>
                            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs text-emerald-400 font-mono">
                              {analysis.space_complexity}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysis.code_suggestions && analysis.code_suggestions.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Code Suggestions</h4>
                        <ul className="space-y-2">
                          {analysis.code_suggestions.map((suggestion, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-400">
                              <ChevronRight size={14} className="text-emerald-500 shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Proposed Patch</h4>
                      <CodeDiff oldCode={originalContent} newCode={analysis.suggested_content} />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs text-amber-200/70 italic">HealAgent will backup the original file as <span className="font-mono text-amber-400">{analysis.file_to_fix}.bak</span> before applying.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={discardFix}
                      className="py-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      DISCARD
                    </button>
                    <button 
                      onClick={applyFix}
                      className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle size={18} />
                      APPLY FIX
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-12 h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Shield size={64} strokeWidth={1} className="text-zinc-700" />
                <div>
                  <h3 className="text-lg font-medium text-zinc-500">Heal Monitor Idle</h3>
                  <p className="text-sm text-zinc-600 max-w-xs mx-auto">Run a command that fails to trigger the AI Healing Engine.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Engine: Gemini 3.1 Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
            <span>Environment: Cloud Run</span>
          </div>
        </div>
        <p>© 2026 Self-Healing Developer Agent • Built for AI Studio</p>
      </footer>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Error Healed!</h3>
                <p className="text-zinc-400 text-sm">The code has been successfully fixed and applied to the project. Would you like to download the corrected file?</p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={downloadFixedFile}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Corrected Code
                </button>

                {githubToken && (
                  <button 
                    onClick={async () => {
                      await pushToGithub();
                      setShowDownloadModal(false);
                      setActiveTab('github');
                    }}
                    disabled={isPushing}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isPushing ? <RefreshCw className="animate-spin" size={18} /> : <Github size={18} />}
                    {isPushing ? 'Pushing...' : 'Push to GitHub'}
                  </button>
                )}

                <button 
                  onClick={() => setShowDownloadModal(false)}
                  className="w-full text-zinc-500 hover:text-zinc-300 py-2 text-xs font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
