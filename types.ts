export enum Status {
  DONE = 'Done',
  IN_PROGRESS = 'Working on it',
  STUCK = 'Stuck',
  NOT_STARTED = 'Not Started'
}

export enum Priority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Course {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  course: string; // Course name
  dueDate: string; // YYYY-MM-DD
  status: Status;
  priority: Priority;
}

export interface AutomationLog {
  id: string;
  message: string;
  timestamp: Date;
  type: 'email' | 'status' | 'system';
}