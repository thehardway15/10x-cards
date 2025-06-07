# API Endpoint Implementation Plan: GET /api/flashcards/{id}

## 1. Przegląd punktu końcowego
Celem endpointu jest zwrócenie szczegółów jednej fiszki należącej do uwierzytelnionego użytkownika. Umożliwia pobranie danych fiszki: `id`, `front`, `back`, `source`, `createdAt` oraz `updatedAt`.

## 2. Szczegóły żądania
- Metoda HTTP: GET  
- Ścieżka: `/api/flashcards/{id}`  
- Parametry:
  - Wymagane:
    - Path param `id` (UUID) – identyfikator fiszki
    - Header `Authorization: Bearer <token>` – token JWT użytkownika
  - Opcjonalne: brak
- Body: brak

## 3. Wykorzystywane typy
- **GetFlashcardResponseDto** (alias `DetailedFlashcardDto`):
  ```ts
  interface DetailedFlashcardDto {
    id: string;
    front: string;
    back: string;
    source: FlashcardSource;
    createdAt: string;
    updatedAt: string;
  }
  ```  
- **Zod schema** dla walidacji path param:
  ```ts
  const paramsSchema = z.object({ id: z.string().uuid() });
  ```

## 4. Szczegóły odpowiedzi
- 200 OK: obiekt `GetFlashcardResponseDto`  
- 400 Bad Request: nieprawidłowy `id` (UUID)  
- 401 Unauthorized: brak lub nieważny token  
- 404 Not Found: fiszka nie istnieje lub należy do innego użytkownika  
- 500 Internal Server Error: nieoczekiwany błąd serwera

## 5. Przepływ danych
1. **Middleware uwierzytelnienia** (w `src/middleware/index.ts`) weryfikuje nagłówek `Authorization`, dekoduje JWT i ustawia `context.locals.user.id` oraz `context.locals.supabase`.
2. **Handler** w `src/pages/api/flashcards/[id].ts`:
   - Parsuje `request.params` przez Zod (`paramsSchema.parse`).
   - Odczytuje `userId` i `supabase` z `context.locals`.
   - Wywołuje `flashcardsService.getFlashcardById(supabase, userId, id)`.
   - Zwraca wynik w odpowiedzi JSON.
3. **Servis** `src/lib/services/flashcards.service.ts`:
   - Metoda `getFlashcardById(supabase, userId, id)`:
     1. Query:
        ```ts
        const { data, error } = await supabase
          .from('flashcards')
          .select('id, front, back, source, created_at, updated_at')
          .eq('id', id)
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .single();
        ```
     2. Jeśli `error` lub brak `data`, rzuca `NotFoundError`.
     3. Mapuje pola z `snake_case` do `camelCase` i zwraca `DetailedFlashcardDto`.

## 6. Względy bezpieczeństwa
- Wymuszenie JWT przez middleware.
- Walidacja UUID (Zod) blokująca nieprawidłowe ID.
- Filtrowanie rekordów po `user_id` + `is_deleted = false`.
- Ograniczenie wybieranych pól tylko do niezbędnych.

## 7. Obsługa błędów
- **ZodError** → 400 + szczegóły walidacji.
- **UnauthorizedError** → 401 + komunikat.
- **NotFoundError** → 404 + komunikat.
- **Inne błędy** → 500 + log w systemie serwera.

## 8. Rozważania dotyczące wydajności
- Wykorzystanie indeksów `idx_flashcards_user_id` i `idx_flashcards_active`.
- Zapytanie zwraca tylko niezbędne kolumny.
- Przy dużym obciążeniu można rozważyć cache'owanie po stronie edge/CDN.

## 9. Kroki implementacji
1. Zdefiniować Zod schema `paramsSchema` w `src/pages/api/flashcards/[id].ts`.
2. Utworzyć plik `src/lib/services/flashcards.service.ts` z funkcją `getFlashcardById(supabase, userId, id)`.
3. Implementować handler `export const GET` w `src/pages/api/flashcards/[id].ts`:
   - Parsowanie i walidacja `params`.
   - Wywołanie serviсe.
   - Zwracanie odpowiedzi lub odpowiedni kod błędu.
4. Zaimplementować dedykowane klasy błędów (`NotFoundError`, `UnauthorizedError`) i wspólną logikę error handlera.