'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { Institution } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Building2, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function InstitutionsTable() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState({ name: '', contact_email: '' });

  const supabase = createClient();

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInstitution) {
        const { error } = await supabase
          .from('institutions')
          .update({ name: formData.name, contact_email: formData.contact_email })
          .eq('id', editingInstitution.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('institutions')
          .insert([{ name: formData.name, contact_email: formData.contact_email }]);

        if (error) throw error;
      }

      fetchInstitutions();
      setIsDialogOpen(false);
      setEditingInstitution(null);
      setFormData({ name: '', contact_email: '' });
    } catch (error) {
      console.error('Error saving institution:', error);
    }
  };

  const deleteInstitution = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institution?')) return;

    try {
      const { error } = await supabase.from('institutions').delete().eq('id', id);

      if (error) throw error;
      fetchInstitutions();
    } catch (error) {
      console.error('Error deleting institution:', error);
    }
  };

  const filteredInstitutions = institutions.filter(
    institution =>
      institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.contact_email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Institutions ({filteredInstitutions.length})
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingInstitution(null);
                  setFormData({ name: '', contact_email: '' });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Institution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Institution Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingInstitution ? 'Update Institution' : 'Add Institution'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search institutions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredInstitutions.map(institution => (
            <div
              key={institution.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{institution.name}</h3>
                  <p className="text-sm text-muted-foreground">{institution.contact_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingInstitution(institution);
                    setFormData({
                      name: institution.name,
                      contact_email: institution.contact_email,
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteInstitution(institution.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredInstitutions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No institutions found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
