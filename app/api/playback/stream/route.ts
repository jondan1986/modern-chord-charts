import { NextRequest } from 'next/server';
import { getSession } from '@/src/services/playback/session-store';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Capture controller ref for cleanup
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;

      // Send initial connection event
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Register this client
      session.clients.add(controller);

      // Send current position immediately
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'position', data: session.position })}\n\n`
        )
      );
    },
    cancel() {
      if (controllerRef && session) {
        session.clients.delete(controllerRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
