export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  created: number;
  priority: TaskPriority;
  dueDate?: number;
  completions?: number[];
}

export interface NoteFile {
  name: string;
  type: string;
  dataUrl: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  file?: NoteFile;
  created: number;
}

export interface Rank {
  name: string;
  min: number;
  max: number;
  badgeColors: string[];
  icon: string;
  animationClass?: string;
  description?: string;
}

export interface PomodoroSession {
  date: string; // YYYY-MM-DD
  total: number;
  completed: number;
}

export interface PomodoroTheme {
  id: string;
  name: string;
  background: string;
  class: string;
}

export interface FocusSessionHistory {
  date: string; // YYYY-MM-DD
  startTime: number; // timestamp
  endTime: number; // timestamp
}

export interface StudySlot {
  time: string; // e.g., "10:00 - 11:00"
  activity: string;
}

export type DailyPlan = StudySlot[];

export interface WeeklyPlan {
  [day: string]: DailyPlan;
}

export interface ChatMessage {
  text: string;
  from: 'user' | 'ai';
}

export type Theme = 'light' | 'dark';

export type ModalContentType = 'note' | 'calculator' | 'stats' | 'ranks' | 'fileEditor' | 'aiRatingInfo' | null;

export interface ModalContent {
  type: ModalContentType;
  data?: any;
}
