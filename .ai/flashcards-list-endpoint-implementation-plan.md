# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego
Celem endpointu jest udostępnienie użytkownikowi listy jego aktywnych fiszek w sposób paginowany i sortowany.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Ścieżka: `/api/flashcards`
- Nagłówki:
  - `Authorization: Bearer <token>` (wymagane)
- Parametry zapytania:
  - `page` (integer, opcjonalny, domyślnie 1, minimalnie 1)
  - `pageSize` (integer, opcjonalny, domyślnie 20, max 100)
  - `sortBy` (string, opcjonalny, np. `createdAt`)
  - `sortOrder` (string, opcjonalny, wartości: `asc` | `desc`, domyślnie `asc`)
- Typ wejściowy (DTO):
  - `ListFlashcardsQueryDto` (dziedziczy po `PaginationOptions`)

## 3. Szczegóły odpowiedzi
- Kod statusu: 200 OK
- Body (JSON):
  ```json
  {
    "items": [
      { "id": "UUID", "front": "...", "back": "...", "source": "manual|ai-full|ai-edited", "createdAt": "timestamp" }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 123
  }
  ```
- Używane typy:
  - `FlashcardDto`
  - `ListFlashcardsResponseDto`

## 4. Przepływ danych
1. **Middleware autoryzacyjny**: weryfikacja i wyłuskanie `user.id` z tokenu przy pomocy `context.locals.supabase.auth.getUser()`.
2. **Walidacja wejścia**: zod schema (`listFlashcardsQuerySchema`) w `src/lib/schemas/flashcards.schemas.ts`.
3. **Handler API** (`src/pages/api/flashcards.ts`):
   - Parsowanie i transformacja parametrów.
   - Wywołanie serwisu: `flashcardsService.listFlashcards(userId, { page, pageSize, sortBy, sortOrder })`.
4. **Serwis** (`src/lib/services/flashcards.service.ts`):
   - Pobranie kontekstu Supabase z `locals.supabase`.
   - Budowanie zapytania:
     - `.from('flashcards')`
     - `.select('id, front, back, source, created_at')`
     - `.eq('user_id', userId)` (autoryzacja)
     - `.eq('is_deleted', false)` (tylko aktywne)
     - `.order(columnMap[sortBy] ?? 'created_at', { ascending: sortOrder === 'asc' })`
     - `.range((page-1)*pageSize, page*pageSize-1)`
     - `.maybeCount('exact')`
   - Mapowanie wyników do `FlashcardDto` (zamiana `created_at` na `createdAt`).
   - Zwrócenie obiektu `{ items, page, pageSize, total }`.
5. **Odpowiedź API**: serializacja JSON, kod 200.

## 5. Względy bezpieczeństwa
- Uwierzytelnianie za pomocą Supabase Auth.
- Autoryzacja: filtrowanie po `user_id` z tokenu.
- Walidacja wejścia: zod chroni przed złośliwymi wartościami i SQL injection.
- Ograniczenie `pageSize` do 100, żeby uniknąć nadmiernego obciążenia.
- Użycie parametrów zapytania, a nie interpolacji SQL.

## 6. Obsługa błędów
- 400 Bad Request: nieprawidłowe parametry (zod `safeParse` z błędami).
- 401 Unauthorized: brak nagłówka lub nieprawidłowy token.
- 500 Internal Server Error: nieprzewidziane błędy serwera lub bazy danych (logowanie `console.error`).
- **Uwaga**: nie generujemy 404 – w przypadku braku fiszek zwracamy pustą tablicę w `items`.

## 7. Wydajność
- Wykorzystanie indeksu `idx_flashcards_active` na `(user_id, created_at DESC)` dla szybkich zapytań.
- Paginacja na poziomie bazy danych (`.range`) zamiast pobierania wszystkich rekordów.
- Rozważenie cursor-based pagination w przyszłości dla bardzo dużych zbiorów.
- Monitorowanie kosztu operacji `.count()` i ewentualne optymalizacje (np. `.head()`).

## 8. Kroki implementacji
1. Utworzyć zod schema w `src/lib/schemas/flashcards.schemas.ts`:
   - `listFlashcardsQuerySchema`
2. Utworzyć serwis w `src/lib/services/flashcards.service.ts` z funkcją `listFlashcards`.
3. Dodać plik endpointu `src/pages/api/flashcards.ts` i zaimplementować GET handler.
4. Skonfigurować middleware autoryzacyjny w `src/middleware/index.ts` (jeśli jeszcze nie istnieje).
5. Dodać dokumentację w `README.md` lub OpenAPI specification.