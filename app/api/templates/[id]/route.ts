import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';
import { BoardTemplate } from '@/lib/board-templates';

// GET /api/templates/[id] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const templateId = resolvedParams.id;
    const supabase = await createClient();
    
    // Get authenticated user (optional)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if admin request
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === 'true';
    
    // Build query
    let query = supabase
      .from('templates')
      .select('*')
      .eq('id', templateId);

    // If not admin request, only get active templates
    if (!isAdminRequest) {
      if (user) {
        const adminStatus = await isAdmin(user.id, user.email);
        if (!adminStatus) {
          query = query.eq('is_active', true);
        }
      } else {
        query = query.eq('is_active', true);
      }
    }

    const { data: template, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching template:', error);
      return NextResponse.json(
        { error: 'Failed to fetch template' },
        { status: 500 }
      );
    }

    // Transform to BoardTemplate format
    // Include is_active for admin requests
    const boardTemplate: any = {
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
    };

    return NextResponse.json({ template: boardTemplate });
  } catch (error) {
    console.error('Error in GET /api/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates/[id] - Update a template (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const templateId = resolvedParams.id;
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

    // Build update object
    const updateData: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.length > 200) {
        return NextResponse.json(
          { error: 'Template name must be between 1 and 200 characters' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string' },
          { status: 400 }
        );
      }
      updateData.description = description.trim();
    }

    if (icon !== undefined) {
      if (typeof icon !== 'string') {
        return NextResponse.json(
          { error: 'Icon must be a string' },
          { status: 400 }
        );
      }
      updateData.icon = icon.trim();
    }

    if (nodes !== undefined) {
      if (!Array.isArray(nodes)) {
        return NextResponse.json(
          { error: 'Nodes must be an array' },
          { status: 400 }
        );
      }
      if (nodes.length > 10000) {
        return NextResponse.json(
          { error: 'Too many nodes. Maximum allowed: 10000' },
          { status: 400 }
        );
      }
      updateData.nodes = nodes;
    }

    if (edges !== undefined) {
      if (!Array.isArray(edges)) {
        return NextResponse.json(
          { error: 'Edges must be an array' },
          { status: 400 }
        );
      }
      if (edges.length > 20000) {
        return NextResponse.json(
          { error: 'Too many edges. Maximum allowed: 20000' },
          { status: 400 }
        );
      }
      updateData.edges = edges;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return NextResponse.json(
          { error: 'is_active must be a boolean' },
          { status: 400 }
        );
      }
      updateData.is_active = is_active;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update template
    const { data: template, error: updateError } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      
      console.error('Error updating template:', updateError);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    // Transform to BoardTemplate format
    // Include is_active for admin requests
    const boardTemplate: any = {
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      nodes: template.nodes || [],
      edges: template.edges || [],
      is_active: template.is_active,
    };

    return NextResponse.json({ template: boardTemplate });
  } catch (error) {
    console.error('Error in PATCH /api/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a template (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const templateId = resolvedParams.id;
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

    // Delete template
    const { error: deleteError } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (deleteError) {
      console.error('Error deleting template:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

