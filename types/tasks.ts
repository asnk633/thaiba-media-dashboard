export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string;
  assigned_by: string;
  institution_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  attachments?: string[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
