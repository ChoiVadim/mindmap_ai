'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { BoardTemplate } from '@/lib/board-templates';

interface TemplateWithStatus extends BoardTemplate {
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AdminTemplatesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [templates, setTemplates] = useState<TemplateWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadTemplates();
    }
  }, [isAdmin]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates?admin=true');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(templates.map(t => 
          t.id === id ? { ...t, is_active: data.template.is_active } : t
        ));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Failed to update template');
    } finally {
      setTogglingId(null);
    }
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/')}
                className="text-foreground/70 hover:text-foreground transition-colors text-sm"
              >
                ← Back to App
              </button>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Template Management
            </h1>
            <p className="text-foreground/70">
              Create, edit, and manage board templates
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/templates/create')}
            className="px-4 py-2 bg-foreground text-background rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>

        {/* Templates List */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground/70 mb-4">No templates found</p>
            <button
              onClick={() => router.push('/admin/templates/create')}
              className="px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-border rounded-lg bg-popover hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {template.name}
                      </h3>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {template.is_active ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-foreground/40" />
                    )}
                  </div>
                </div>

                <div className="text-xs text-foreground/50 mb-3">
                  {template.nodes?.length || 0} nodes, {template.edges?.length || 0} edges
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/templates/${template.id}`)}
                    className="flex-1 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(template.id, template.is_active ?? true)}
                    disabled={togglingId === template.id}
                    className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors disabled:opacity-50"
                    title={template.is_active ? 'Hide template' : 'Show template'}
                  >
                    {togglingId === template.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : template.is_active ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                    className="px-3 py-1.5 text-sm bg-destructive/20 hover:bg-destructive/30 text-destructive rounded transition-colors disabled:opacity-50"
                  >
                    {deletingId === template.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

