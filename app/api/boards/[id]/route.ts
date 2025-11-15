import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Board } from '@/store/board-store';

// PATCH /api/boards/[id] - Update a board (name, nodes, edges)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const boardId = resolvedParams.id;
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .eq('user_id', user.id)
      .single();

    if (boardError || !board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();

    // Update board name if provided
    if (updates.name !== undefined) {
      const { error: updateError } = await supabase
        .from('boards')
        .update({ name: updates.name })
        .eq('id', boardId);

      if (updateError) {
        console.error('Error updating board name:', updateError);
        return NextResponse.json(
          { error: 'Failed to update board' },
          { status: 500 }
        );
      }
    }

    // Update nodes if provided
    if (updates.nodes !== undefined) {
      // Delete existing nodes
      await supabase
        .from('board_nodes')
        .delete()
        .eq('board_id', boardId);

      // Insert new nodes
      if (updates.nodes.length > 0) {
        const nodesToInsert = updates.nodes.map((node: any) => ({
          board_id: boardId,
          node_data: node,
        }));

        const { error: nodesError } = await supabase
          .from('board_nodes')
          .insert(nodesToInsert);

        if (nodesError) {
          console.error('Error updating nodes:', nodesError);
          return NextResponse.json(
            { error: 'Failed to update nodes' },
            { status: 500 }
          );
        }
      }
    }

    // Update edges if provided
    if (updates.edges !== undefined) {
      // Delete existing edges
      await supabase
        .from('board_edges')
        .delete()
        .eq('board_id', boardId);

      // Insert new edges
      if (updates.edges.length > 0) {
        const edgesToInsert = updates.edges.map((edge: any) => ({
          board_id: boardId,
          edge_data: edge,
        }));

        const { error: edgesError } = await supabase
          .from('board_edges')
          .insert(edgesToInsert);

        if (edgesError) {
          console.error('Error updating edges:', edgesError);
          return NextResponse.json(
            { error: 'Failed to update edges' },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated board with nodes and edges
    const { data: updatedBoard } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    const { data: nodesData } = await supabase
      .from('board_nodes')
      .select('node_data')
      .eq('board_id', boardId);

    const { data: edgesData } = await supabase
      .from('board_edges')
      .select('edge_data')
      .eq('board_id', boardId);

    const result: Board = {
      id: updatedBoard!.id,
      name: updatedBoard!.name,
      nodes: nodesData?.map((n) => n.node_data) || [],
      edges: edgesData?.map((e) => e.edge_data) || [],
      createdAt: updatedBoard!.created_at,
      updatedAt: updatedBoard!.updated_at,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update board' },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[id] - Delete a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const boardId = resolvedParams.id;
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .eq('user_id', user.id)
      .single();

    if (boardError || !board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Delete board (cascade will delete nodes and edges)
    const { error: deleteError } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId);

    if (deleteError) {
      console.error('Error deleting board:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete board' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete board' },
      { status: 500 }
    );
  }
}
