import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FEEDBACK_FILE_PATH = path.join(process.cwd(), 'data', 'feedback.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read feedback from file
async function readFeedback(): Promise<any[]> {
  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(FEEDBACK_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // If it's an object with feedback array
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.feedback)) {
      return parsed.feedback;
    }
    
    return [];
  } catch (error: any) {
    // If file doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Write feedback to file
async function writeFeedback(feedback: any[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(feedback, null, 2), 'utf-8');
}

// POST /api/feedback - Submit feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback: feedbackText, email } = body;
    
    // Validate required fields
    if (!feedbackText || typeof feedbackText !== 'string' || !feedbackText.trim()) {
      return NextResponse.json(
        { error: 'Feedback text is required' },
        { status: 400 }
      );
    }

    const allFeedback = await readFeedback();
    
    // Create new feedback entry
    const newFeedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      feedback: feedbackText.trim(),
      email: email?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    allFeedback.push(newFeedback);
    await writeFeedback(allFeedback);

    return NextResponse.json(
      { message: 'Feedback submitted successfully', id: newFeedback.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Get all feedback (optional, for admin purposes)
export async function GET() {
  try {
    const feedback = await readFeedback();
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error reading feedback:', error);
    return NextResponse.json(
      { error: 'Failed to read feedback' },
      { status: 500 }
    );
  }
}

