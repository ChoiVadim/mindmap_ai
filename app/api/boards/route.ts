import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Board } from '@/store/board-store';

// GET /api/boards - Get all boards metadata only (without nodes/edges for performance)
export async function GET() {
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

    // Fetch only board metadata (no nodes/edges) for fast initial load
    const { data: boards, error } = await supabase
      .from('boards')
      .select('id, name, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching boards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch boards' },
        { status: 500 }
      );
    }

    // Return boards with empty nodes/edges - data will be loaded on demand
    const boardsMetadata: Board[] = (boards || []).map((board) => ({
      id: board.id,
      name: board.name,
      nodes: [], // Will be loaded when board is opened
      edges: [], // Will be loaded when board is opened
      createdAt: board.created_at,
      updatedAt: board.updated_at,
    }));

    return NextResponse.json(boardsMetadata);
  } catch (error) {
    console.error('Error reading boards:', error);
    return NextResponse.json(
      { error: 'Failed to read boards' },
      { status: 500 }
    );
  }
}

// POST /api/boards - Create a new board
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

    const body = await request.json();
    const { name, nodes = [], edges = [] } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      );
    }

    // Create board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        user_id: user.id,
        name,
      })
      .select()
      .single();

    if (boardError || !board) {
      console.error('Error creating board:', boardError);
      return NextResponse.json(
        { error: 'Failed to create board' },
        { status: 500 }
      );
    }

    // Insert nodes if provided
    if (nodes.length > 0) {
      const nodesToInsert = nodes.map((node: any) => ({
        board_id: board.id,
        node_data: node,
      }));

      const { error: nodesError } = await supabase
        .from('board_nodes')
        .insert(nodesToInsert);

      if (nodesError) {
        console.error('Error inserting nodes:', nodesError);
        // Continue anyway - board is created
      }
    }

    // Insert edges if provided
    if (edges.length > 0) {
      const edgesToInsert = edges.map((edge: any) => ({
        board_id: board.id,
        edge_data: edge,
      }));

      const { error: edgesError } = await supabase
        .from('board_edges')
        .insert(edgesToInsert);

      if (edgesError) {
        console.error('Error inserting edges:', edgesError);
        // Continue anyway - board is created
      }
    }

    // Fetch the complete board with nodes and edges
    const { data: nodesData } = await supabase
      .from('board_nodes')
      .select('node_data')
      .eq('board_id', board.id);

    const { data: edgesData } = await supabase
      .from('board_edges')
      .select('edge_data')
      .eq('board_id', board.id);

    const newBoard: Board = {
      id: board.id,
      name: board.name,
      nodes: nodesData?.map((n) => n.node_data) || [],
      edges: edgesData?.map((e) => e.edge_data) || [],
      createdAt: board.created_at,
      updatedAt: board.updated_at,
    };

    return NextResponse.json(newBoard, { status: 201 });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    );
  }
}
  