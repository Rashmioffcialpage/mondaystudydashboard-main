import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Zap, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Bot,
  BrainCircuit,
  Bell
} from 'lucide-react';
import { Task, Course, Status, Priority, AutomationLog } from './types';
import Board from './components/Board';
import Stats from './components/Stats';
import TaskModal from './components/TaskModal';
import AutomationToast from './components/AutomationToast';
import { analyzeWorkload, prioritizeTasks } from './services/geminiService';

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Research Paper Draft',
    course: 'History 101',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    status: Status.IN_PROGRESS,
    priority: Priority.HIGH,
  },
  {
    id: '2',
    title: 'Linear Algebra Quiz',
    course: 'Math 202',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    status: Status.NOT_STARTED,
    priority: Priority.MEDIUM,
  },
  {
    id: '3',
    title: 'React Project UI',
    course: 'CS 305',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday (Overdue)
    status: Status.STUCK,
    priority: Priority.CRITICAL,
  },
  {
    id: '4',
    title: 'Read Chapter 4-5',
    course: 'Psychology',
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    status: Status.DONE,
    priority: Priority.LOW,
  }
];

const COURSES: Course[] = [
  { id: 'c1', name: 'History 101', color: 'bg-yellow-200 text-yellow-800' },
  { id: 'c2', name: 'Math 202', color: 'bg-blue-200 text-blue-800' },
  { id: 'c3', name: 'CS 305', color: 'bg-purple-200 text-purple-800' },
  { id: 'c4', name: 'Psychology', color: 'bg-pink-200 text-pink-800' },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- Automation Logic Simulation ---
  const addLog = (message: string, type: 'email' | 'status' | 'system') => {
    const newLog: AutomationLog = {
      id: Date.now().toString() + Math.random(),
      message,
      timestamp: new Date(),
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 5)); // Keep last 5
  };

  // Run "backend" automations when tasks change
  useEffect(() => {
    // 1. Check for overdue items not marked as done -> Trigger "Email"
    const overdue = tasks.filter(t => {
      const isOverdue = new Date(t.dueDate) < new Date() && new Date(t.dueDate).getDate() !== new Date().getDate();
      return isOverdue && t.status !== Status.DONE;
    });

    if (overdue.length > 0) {
      // Debounce slightly in real app, here we just check if we haven't logged it recently
      // For demo purposes, we randomly trigger it if it hasn't happened in last 10s? 
      // Simplified: Just one generic warning if overdue tasks exist.
    }
    
    // 2. Calculate progress - Logic handled in Stats component
  }, [tasks]);

  const handleAddTask = (newTask: Omit<Task, 'id'>) => {
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks(prev => [task, ...prev]);
    addLog(`New assignment "${task.title}" added to board.`, 'system');
    
    // Simulate "Assignment due -> triggers email" immediate check
    const isDueSoon = new Date(task.dueDate).getTime() - Date.now() < 86400000 * 3; // Within 3 days
    if (isDueSoon) {
      setTimeout(() => {
        addLog(`Automation: 📧 Reminder email drafted for "${task.title}" due soon.`, 'email');
      }, 1000);
    }
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        // Automation: Status change to "Completed" -> updates dashboard (visual) + log
        if (t.status !== Status.DONE && updates.status === Status.DONE) {
           addLog(`Automation: 🎉 "${t.title}" completed! Progress bar updated.`, 'status');
        }
        return updated;
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAiPrioritize = async () => {
    setIsAiLoading(true);
    try {
      // 1. Use Gemini to re-evaluate priorities based on due dates and titles
      const updatedTasks = await prioritizeTasks(tasks);
      setTasks(updatedTasks);
      addLog('AI Automation: Board priorities optimized by Gemini.', 'system');
      
      // 2. Get a quick insight summary
      const insight = await analyzeWorkload(updatedTasks);
      setAiInsight(insight);
    } catch (error) {
      console.error("AI Error", error);
      addLog('AI Error: Could not optimize board.', 'system');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">StudentFlow</h1>
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium ml-2">
              Pro Board
            </span>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={handleAiPrioritize}
              disabled={isAiLoading}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-md hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
            >
              {isAiLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              <span>AI Optimize</span>
            </button>
            <div className="relative">
              <Bell size={20} className="text-slate-500 hover:text-slate-700 cursor-pointer" />
              {logs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome & Stats */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Good Morning, John! 👋</h2>
              <p className="text-slate-500 mt-1">Here's what's happening in your courses today.</p>
            </div>
            
            {/* Mobile AI Button */}
             <button 
              onClick={handleAiPrioritize}
              disabled={isAiLoading}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md w-full"
            >
              {isAiLoading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/> : <Sparkles size={18} />}
              AI Optimize
            </button>
          </div>

          <Stats tasks={tasks} />

          {aiInsight && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start animate-fade-in">
              <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">Gemini Insights</h4>
                <p className="text-blue-800 text-sm leading-relaxed">{aiInsight}</p>
              </div>
              <button onClick={() => setAiInsight(null)} className="ml-auto text-blue-400 hover:text-blue-600">
                ×
              </button>
            </div>
          )}
        </section>

        {/* Board */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white sticky top-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Calendar className="text-slate-400" size={20} />
                Main Table
              </h3>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {tasks.length} items
              </span>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm hover:shadow active:scale-95"
            >
              <Plus size={16} />
              New Assignment
            </button>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <Board 
              tasks={tasks} 
              courses={COURSES} 
              onUpdate={handleUpdateTask} 
              onDelete={handleDeleteTask}
            />
          </div>
        </section>
      </main>

      {/* Automations Logs / Toast */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none z-50">
        {logs.map((log) => (
          <AutomationToast key={log.id} log={log} />
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleAddTask}
          courses={COURSES}
        />
      )}
    </div>
  );
};

export default App;