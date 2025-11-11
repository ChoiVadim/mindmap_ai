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
    // If file doesn't exist, return empty array
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

// GET /api/boards - Get all boards
export async function GET() {
  try {
    const boards = await readBoards();
    return NextResponse.json(boards);
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
    const newBoard: Board = await request.json();
    
    // Validate required fields
    if (!newBoard.id || !newBoard.name) {
      return NextResponse.json(
        { error: 'Board must have id and name' },
        { status: 400 }
      );
    }

    const boards = await readBoards();
    
    // Check if board with this ID already exists
    if (boards.some((b) => b.id === newBoard.id)) {
      return NextResponse.json(
        { error: 'Board with this ID already exists' },
        { status: 409 }
      );
    }

    // Add timestamps if not provided
    const now = new Date().toISOString();
    const boardWithTimestamps: Board = {
      ...newBoard,
      createdAt: newBoard.createdAt || now,
      updatedAt: now,
    };

    boards.push(boardWithTimestamps);
    await writeBoards(boards);

    return NextResponse.json(boardWithTimestamps, { status: 201 });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    );
  }
}

