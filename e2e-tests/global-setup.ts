import { request } from '@playwright/test';
import dotenv from 'dotenv';

async function globalSetup() {
  // Load environment variables
  dotenv.config({ path: '.env.test' });
  
  // Verify required environment variables
  const requiredEnvVars = ['E2E_USERNAME', 'E2E_PASSWORD', 'E2E_USERNAME_ID'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set. Please check your .env.test file.`);
    }
  }
  
  // Optional: Clean up any leftover data from previous test runs
  try {
    // Create a request context for API calls
    const apiContext = await request.newContext();
    
    // Authenticate
    const loginResponse = await apiContext.post('/api/auth/login', {
      data: {
        email: process.env.E2E_USERNAME,
        password: process.env.E2E_PASSWORD
      }
    });
    
    // Get auth token
    const responseBody = await loginResponse.json();
    const token = responseBody.token;
    
    if (token) {
      // Get all user's flashcards created in previous test runs (if any)
      const flashcardsResponse = await apiContext.get('/api/flashcards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const flashcards = await flashcardsResponse.json();
      
      // Delete all test flashcards (you might want to identify them by a special tag or naming pattern)
      for (const flashcard of flashcards.filter(f => f.front.startsWith('Test:') || f.source === 'e2e-test')) {
        await apiContext.delete(`/api/flashcards/${flashcard.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Cleaned up test flashcard: ${flashcard.id}`);
      }
    }
    
    // Close the API context
    await apiContext.dispose();
  } catch (error) {
    console.error('Failed to clean up test data:', error);
    // Continue with tests even if cleanup fails
  }
}

export default globalSetup;