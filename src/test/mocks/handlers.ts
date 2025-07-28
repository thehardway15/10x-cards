import { http, HttpResponse } from 'msw';

// Mock API handlers for testing
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ 
      user: { id: '123', email: 'test@example.com' },
      token: 'mock-jwt-token'
    });
  }),
  
  http.post('/api/auth/register', () => {
    return HttpResponse.json({ 
      user: { id: '123', email: 'test@example.com' },
      token: 'mock-jwt-token'
    });
  }),
  
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),
  
  // Flashcard endpoints
  http.get('/api/flashcards', () => {
    return HttpResponse.json([
      { id: '1', question: 'What is React?', answer: 'A JavaScript library for building user interfaces' },
      { id: '2', question: 'What is Astro?', answer: 'A web framework for content-focused websites' }
    ]);
  }),
  
  http.post('/api/flashcards', async ({ request }) => {
    const body = await request.json() as Record<string, any>;
    return HttpResponse.json({ id: '3', question: body.question, answer: body.answer });
  }),
  
  http.get('/api/flashcards/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      question: 'Sample question',
      answer: 'Sample answer'
    });
  }),
  
  http.put('/api/flashcards/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, any>;
    return HttpResponse.json({ 
      id: params.id, 
      question: body.question, 
      answer: body.answer 
    });
  }),
  
  http.delete('/api/flashcards/:id', ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id });
  }),
  
  // Generation endpoints
  http.post('/api/generations', async ({ request }) => {
    const body = await request.json() as { sourceText?: string };
    return HttpResponse.json({
      id: 'gen-123',
      sourceText: body.sourceText || 'Default source text',
      status: 'completed',
      flashcards: [
        { id: 'fc-1', question: 'Generated Question 1?', answer: 'Generated Answer 1' },
        { id: 'fc-2', question: 'Generated Question 2?', answer: 'Generated Answer 2' }
      ]
    });
  })
]; 