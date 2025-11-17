'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { BoardTemplate } from '@/lib/board-templates';
import { useAdminCanvasStore } from '@/store/admin-canvas-store';
import AdminCanvas from '@/components/admin/AdminCanvas';

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { nodes, edges, loadTemplate } = useAdminCanvasStore();
  const [templateId, setTemplateId] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('✨');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      setTemplateId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (templateId && isAdmin) {
      loadTemplateData();
    }
  }, [templateId, isAdmin]);

  const loadTemplateData = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}?admin=true`);
      if (response.ok) {
        const data = await response.json();
        const template: BoardTemplate = data.template;
        setName(template.name);
        setDescription(template.description);
        setIcon(template.icon);
        
        // Load nodes and edges into admin canvas
        loadTemplate(template.nodes || [], template.edges || []);
        
        // Fetch is_active status separately
        const adminResponse = await fetch('/api/templates?admin=true');
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          const fullTemplate = adminData.templates.find((t: any) => t.id === templateId);
          if (fullTemplate) {
            setIsActive(fullTemplate.is_active ?? true);
          }
        }
      } else {
        alert('Template not found');
        router.push('/admin/templates');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !icon.trim()) {
      alert('Please fill in all required fields (name, description, and icon)');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          icon: icon.trim(),
          nodes: nodes,
          edges: edges,
          is_active: isActive,
        }),
      });

      if (response.ok) {
        alert('Template saved successfully!');
        router.push('/admin/templates');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      useAdminCanvasStore.getState().clearCanvas();
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header Bar */}
      <div className="flex-shrink-0 border-b border-border bg-popover p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/templates')}
              className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Edit Template
              </h1>
              <p className="text-sm text-foreground/60">
                {nodes.length} nodes, {edges.length} edges
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Template Metadata Form */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
                maxLength={200}
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 text-foreground w-64"
                maxLength={500}
              />
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="✨"
                className="w-16 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
                maxLength={10}
              />
              <label className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span>Active</span>
              </label>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim() || !description.trim() || !icon.trim()}
              className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <AdminCanvas onSave={handleSave} onClear={handleClear} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

