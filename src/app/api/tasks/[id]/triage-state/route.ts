import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { broadcast } from '@/lib/events';
import type { TaskActivity, TriageState } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  try {
    const db = getDb();
    const task = db.prepare('SELECT triage_state FROM tasks WHERE id = ?').get(taskId) as
      | { triage_state: string | null }
      | undefined;

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.triage_state) {
      return NextResponse.json(null);
    }

    return NextResponse.json(JSON.parse(task.triage_state));
  } catch (error) {
    console.error('Error fetching triage state:', error);
    return NextResponse.json({ error: 'Failed to fetch triage state' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  try {
    const body = await request.json();
    const { questionId, answer } = body as { questionId: string; answer: string };

    if (!questionId || !answer) {
      return NextResponse.json({ error: 'questionId and answer are required' }, { status: 400 });
    }

    const db = getDb();
    const task = db.prepare('SELECT triage_state FROM tasks WHERE id = ?').get(taskId) as
      | { triage_state: string | null }
      | undefined;

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.triage_state) {
      return NextResponse.json({ error: 'No triage state exists for this task' }, { status: 400 });
    }

    const state: TriageState = JSON.parse(task.triage_state);
    const question = state.questions.find((q) => q.id === questionId);

    if (!question) {
      return NextResponse.json({ error: `Question ${questionId} not found` }, { status: 404 });
    }

    question.answer = answer;
    question.answered_at = new Date().toISOString();
    state.updated_at = new Date().toISOString();

    db.prepare('UPDATE tasks SET triage_state = ? WHERE id = ?').run(
      JSON.stringify(state),
      taskId
    );

    const activityId = crypto.randomUUID();
    db.prepare(
      'INSERT INTO task_activities (id, task_id, activity_type, message) VALUES (?, ?, ?, ?)'
    ).run(
      activityId,
      taskId,
      'planning_answer',
      `Answered: **${question.question}**\n\n→ ${answer}`
    );

    const createdActivity = db.prepare('SELECT * FROM task_activities WHERE id = ?').get(activityId) as Record<string, unknown> | undefined;
    if (createdActivity) {
      broadcast({
        type: 'activity_logged',
        payload: {
          id: createdActivity.id as string,
          task_id: createdActivity.task_id as string,
          activity_type: createdActivity.activity_type as string,
          message: createdActivity.message as string,
          created_at: createdActivity.created_at as string,
        } as TaskActivity,
      });
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error('Error updating triage state:', error);
    return NextResponse.json({ error: 'Failed to update triage state' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  try {
    const state = await request.json();

    const db = getDb();
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    db.prepare('UPDATE tasks SET triage_state = ? WHERE id = ?').run(
      JSON.stringify(state),
      taskId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving triage state:', error);
    return NextResponse.json({ error: 'Failed to save triage state' }, { status: 500 });
  }
}
