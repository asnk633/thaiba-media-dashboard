'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfile, Institution } from '@/types/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export function CreateTaskDialog({ open, onOpenChange, onTaskCreated }: CreateTaskDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    institution_id: '',
    due_date: '',
    notes: '',
  });

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchInstitutions();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'team_member')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase.from('institutions').select('*').order('name');

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        assigned_to: formData.assigned_to,
        assigned_by: user.id,
        institution_id: formData.institution_id || null,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        status: 'pending',
      };

      const { error } = await supabase.from('tasks').insert([taskData]);

      if (error) throw error;

      onTaskCreated();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        institution_id: '',
        due_date: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assign To *</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={value => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="institution_id">Institution</Label>
              <Select
                value={formData.institution_id}
                onValueChange={value => setFormData({ ...formData, institution_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map(institution => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.assigned_to}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
