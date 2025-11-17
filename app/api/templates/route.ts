import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { BoardTemplate } from '@/lib/board-templates';
import { CanvasNode, CanvasEdge } from '@/types/canvas';

// GET /api/templates - Get all active templates (public)
// GET /api/templates?admin=true - Get all templates including inactive (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user (optional for public endpoint)
    const { data: { user } } = await supabase.auth.getUser();
    
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === 'true';
    
    // If admin request, check admin status
    if (isAdminRequest) {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const adminStatus = await isAdmin(user.id, user.email);
      if (!adminStatus) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
    }

    // Build query
    let query = supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    // If not admin request, only get active templates
    if (!isAdminRequest) {
      query = query.eq('is_active', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ templates: [], total: 0 });
      }
      
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // Transform to BoardTemplate format
    // Include is_active for admin requests
    const boardTemplates: any[] = (templates || []).map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      nodes: template.nodes || [],
      edges: template.edges || [],
      ...(isAdminRequest && {
        is_active: template.is_active,
        created_at: template.created_at,
        updated_at: template.updated_at,
      }),
    }));

    return NextResponse.json({
      templates: boardTemplates,
      total: boardTemplates.length,
    });
  } catch (error) {
    console.error('Error in GET /api/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin status
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, icon, nodes, edges, is_active } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Template name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Template description is required and must be a string' },
        { status: 400 }
      );
    }

    if (!icon || typeof icon !== 'string') {
      return NextResponse.json(
        { error: 'Template icon is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate nodes and edges are arrays
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: 'Nodes and edges must be arrays' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length === 0 || name.length > 200) {
      return NextResponse.json(
        { error: 'Template name must be between 1 and 200 characters' },
        { status: 400 }
      );
    }

    // Prevent DoS: limit array sizes
    const MAX_NODES = 10000;
    const MAX_EDGES = 20000;
    if (nodes.length > MAX_NODES) {
      return NextResponse.json(
        { error: `Too many nodes. Maximum allowed: ${MAX_NODES}` },
        { status: 400 }
      );
    }
    if (edges.length > MAX_EDGES) {
      return NextResponse.json(
        { error: `Too many edges. Maximum allowed: ${MAX_EDGES}` },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim(),
        nodes: nodes,
        edges: edges,
        created_by: user.id,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (templateError || !template) {
      console.error('Error creating template:', templateError);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    // Transform to BoardTemplate format
    const boardTemplate: BoardTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      nodes: template.nodes || [],
      edges: template.edges || [],
    };

    return NextResponse.json({ template: boardTemplate }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

