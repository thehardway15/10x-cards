import { test as base } from '@playwright/test';
import jwt from 'jsonwebtoken';

// --- KONFIGURACJA TESTOWEGO UŻYTKOWNIKA ---
const testUser = {
  id: process.env.E2E_USERNAME_ID || 'e2e-user-id',
  email: process.env.E2E_USERNAME || 'e2e@example.com',
  role: 'user',
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_ISSUER = 'flashai';
const JWT_AUDIENCE = 'flashai-users';

function generateJwt(user: typeof testUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
}

// Mock candidate data
export const mockCandidates = [
  {
    candidateId: 'mock-id-1',
    front: 'What is the capital of France?',
    back: 'Paris is the capital of France.',
    source: 'ai-full',
    status: 'idle',
  },
  {
    candidateId: 'mock-id-2',
    front: 'What is the largest planet in our solar system?',
    back: 'Jupiter is the largest planet in our solar system.',
    source: 'ai-full',
    status: 'idle',
  },
  {
    candidateId: 'mock-id-3',
    front: 'Who wrote "Romeo and Juliet"?',
    back: 'William Shakespeare wrote "Romeo and Juliet".',
    source: 'ai-full',
    status: 'idle',
  },
];

export const testData = {
  createdFlashcardIds: new Set<string>(),
};

export const test = base.extend({
  page: async ({ page, browser }, use) => {
    // --- AUTORYZACJA JWT ---
    const token = generateJwt(testUser);
    await page.goto('/'); // Musi być na stronie, by mieć dostęp do localStorage
    await page.evaluate(([token, user]) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, [token, testUser]);

    // --- MOCKOWANIE API ---
    await page.route('**/api/generations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: mockCandidates,
          totalCount: mockCandidates.length,
        }),
      });
    });

    await page.route('**/api/flashcards', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const id = `test-flashcard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        testData.createdFlashcardIds.add(id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            id,
            userId: testUser.id,
          }),
        });
      }
    });

    await page.route('**/api/flashcards/**', async (route) => {
      const method = route.request().method();
      if (method === 'DELETE') {
        const url = route.request().url();
        const id = url.split('/').pop() || '';
        if (testData.createdFlashcardIds.has(id)) {
          testData.createdFlashcardIds.delete(id);
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await use(page);

    // --- CLEANUP ---
    if (testData.createdFlashcardIds.size > 0) {
      const cleanupContext = await browser.newContext();
      const cleanupPage = await cleanupContext.newPage();
      await cleanupPage.goto('/');
      await cleanupPage.evaluate(([token, user]) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }, [token, testUser]);
      for (const id of testData.createdFlashcardIds) {
        try {
          await cleanupPage.request.delete(`/api/flashcards/${id}`);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Failed to delete test flashcard ${id}: ${error}`);
        }
      }
      testData.createdFlashcardIds.clear();
      await cleanupContext.close();
    }
  },
});

export { expect } from '@playwright/test';