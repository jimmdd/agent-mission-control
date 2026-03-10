import { NextResponse } from 'next/server';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

export async function POST() {
  const syncScript = join(homedir(), '.openclaw', 'sync', 'linear-sync.py');

  try {
    const output = execSync(`python3 "${syncScript}"`, {
      timeout: 60_000,
      env: { ...process.env, HOME: homedir() },
      encoding: 'utf-8',
    });

    const created = output.match(/(\d+) created/)?.[1] ?? '0';
    const skipped = output.match(/(\d+) skipped/)?.[1] ?? '0';
    const comments = output.match(/(\d+) comments synced/)?.[1] ?? '0';

    return NextResponse.json({
      success: true,
      created: parseInt(created),
      skipped: parseInt(skipped),
      comments_synced: parseInt(comments),
      output: output.split('\n').slice(-3).join('\n').trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
