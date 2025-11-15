import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/feedback - Submit feedback
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    const { feedback: feedbackText, email } = body;
    
    // Validate required fields
    if (!feedbackText || typeof feedbackText !== 'string' || !feedbackText.trim()) {
      return NextResponse.json(
        { error: 'Feedback text is required' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional - feedback can be submitted anonymously)
    const { data: { user } } = await supabase.auth.getUser();

    // Insert feedback into Supabase
    const { data: newFeedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id || null,
        feedback: feedbackText.trim(),
        email: email?.trim() || null,
      })
      .select()
      .single();

    if (insertError || !newFeedback) {
      console.error('Error inserting feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Feedback submitted successfully', 
        id: newFeedback.id 
      },
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

// GET /api/feedback - Get all feedback (for admin purposes)
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

    // Fetch feedback (users can only see their own feedback due to RLS)
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('id, feedback, email, created_at, user_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Transform to match the old format for backward compatibility
    const formattedFeedback = (feedback || []).map((item) => ({
      id: item.id,
      feedback: item.feedback,
      email: item.email,
      createdAt: item.created_at,
    }));

    return NextResponse.json(formattedFeedback);
  } catch (error) {
    console.error('Error reading feedback:', error);
    return NextResponse.json(
      { error: 'Failed to read feedback' },
      { status: 500 }
    );
  }
}

