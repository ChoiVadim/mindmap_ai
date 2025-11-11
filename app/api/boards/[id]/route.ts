import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Board } from '@/store/board-store';

const BOARDS_FILE_PATH = path.join(process.cwd(), 'data', 'boards.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read boards from file
async function readBoards(): Promise<Board[]> {
  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(BOARDS_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Write boards to file
async function writeBoards(boards: Board[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(BOARDS_FILE_PATH, JSON.stringify(boards, null, 2), 'utf-8');
}

// PATCH /api/boards/[id] - Update a board (name, nodes, edges)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const boardId = resolvedParams.id;
    const updates = await request.json();

    const boards = await readBoards();
    const boardIndex = boards.findIndex((b) => b.id === boardId);

    if (boardIndex === -1) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Update board with new data
    const updatedBoard: Board = {
      ...boards[boardIndex],
      ...(updates.name && { name: updates.name }),
      ...(updates.nodes && { nodes: updates.nodes }),
      ...(updates.edges && { edges: updates.edges }),
      updatedAt: new Date().toISOString(),
    };

    boards[boardIndex] = updatedBoard;
    await writeBoards(boards);

    return NextResponse.json(updatedBoard);
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

    const boards = await readBoards();
    const filteredBoards = boards.filter((b) => b.id !== boardId);

    if (filteredBoards.length === boards.length) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    await writeBoards(filteredBoards);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete board' },
      { status: 500 }
    );
  }
}

