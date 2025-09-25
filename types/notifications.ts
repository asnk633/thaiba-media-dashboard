export type NotificationType =
  | 'task_assigned'
  | 'task_due'
  | 'task_completed'
  | 'task_overdue'
  | 'comment_added';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  task_id?: string;
  read: boolean;
  created_at: string;
}
