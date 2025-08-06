# API Endpoint Implementation Plan: DELETE /api/flashcards/{id}

## 1. Przegląd punktu końcowego

Soft-delete istniejącej fiszki. Ustawia flagę `is_deleted` na `true` i wypełnia pole `deleted_at` znacznikiem czasu. Wymaga uwierzytelnienia przy pomocy tokenu Bearer.

## 2. Szczegóły żądania

- Metoda HTTP: DELETE
- Struktura URL: `/api/flashcards/{id}`
- Nagłówki:
  - `Authorization: Bearer <token>` (wymagane)
- Parametry ścieżki:
  - `id` (string, UUID, wymagane)
- Request Body: brak

## 3. Wykorzystywane typy

- Nie wymaga dedykowanego DTO w `types.ts`
- Parametr ścieżki można opisać przy użyciu Zod:
  ```ts
  const deleteFlashcardParamsSchema = z.object({ id: z.string().uuid() });
  ```

## 4. Szczegóły odpowiedzi

- 204 No Content: pomyślne usunięcie
- 400 Bad Request: nieprawidłowy `id` (np. nie-UUID)
- 401 Unauthorized: brak lub nieprawidłowy token
- 404 Not Found: brak fiszki o podanym ID lub należy do innego użytkownika
- 500 Internal Server Error: nieoczekiwany błąd serwera

## 5. Przepływ danych

1. Odczyt nagłówka `Authorization` i ekstrakcja tokenu.
2. Ustawienie tokenu w kliencie Supabase: `locals.supabase.auth.setAuth(token)`.
3. Pobranie zalogowanego użytkownika: `const { data: user, error } = await locals.supabase.auth.getUser()`.
4. Walidacja parametru `id` przy użyciu Zod.
5. Wywołanie logiki w serwisie:
   - W `FlashcardsService` dodać metodę `deleteFlashcard(userId: string, flashcardId: string): Promise<boolean>`:
     - `UPDATE flashcards SET is_deleted = true, deleted_at = now() WHERE id = flashcardId AND user_id = userId AND is_deleted = false`
     - Jeśli liczba zmienionych wierszy to 0 → zwrócić `false`
     - W przeciwnym razie → `true`
6. Na podstawie wartości zwróconej przez serwis zwrócić odpowiedź 204 lub 404.

## 6. Względy bezpieczeństwa

- Autoryzacja: tylko właściciel fiszki (porównanie `user_id`) może ją usunąć.
- Uwierzytelnianie: weryfikacja tokenu Bearer przez Supabase Auth.
- Bezpieczeństwo SQL: użycie zapytań z parametrami Supabase (brak ręcznych konkatenacji).

## 7. Obsługa błędów

| Kod | Warunek                                                            | Działanie                                                                                                  |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 400 | `id` nie jest poprawnym UUID                                       | `new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })`                                   |
| 401 | Brak nagłówka `Authorization` lub nieudana weryfikacja użytkownika | `new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })`                                 |
| 404 | Brak pasującej nieusuniętej fiszki dla danego użytkownika          | `new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })`                                    |
| 500 | Błąd bazy danych lub nieoczekiwany wyjątek                         | `console.error(...)` + `new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })` |

## 8. Rozważania dotyczące wydajności

- Zapytanie korzysta z istniejącego indeksu `idx_flashcards_user_id` i warunku `is_deleted = false` → szybka selekcja.
- Minimalne narzuty: pojedyncze zapytanie `UPDATE`.
- Skalowanie: nie wymaga dodatkowego paginowania.

## 9. Kroki implementacji

1. W pliku `src/lib/services/flashcards.service.ts` dodać metodę `deleteFlashcard(userId: string, flashcardId: string): Promise<boolean>` zgodnie z logiką `soft-delete`.
2. Utworzyć nowy plik dynamiczny API: `src/pages/api/flashcards/[id].ts`.
3. W [id].ts:
   - Wyłączyć prerender: `export const prerender = false`.
   - Importować Zod, `APIRoute`, `FlashcardsService`.
   - Zdefiniować schemat Zod dla `params.id`.
   - W handlerze `DELETE`:
     1. Parsować i weryfikować `id`.
     2. Odczytać i zweryfikować token Bearer.
     3. Ustawić go w `locals.supabase.auth` i wywołać `auth.getUser()`.
     4. Wywołać `flashcardsService.deleteFlashcard(user.id, id)`.
     5. Na podstawie wyniku zwrócić odpowiedni kod statusu.
     6. Obsłużyć błędy zgodnie z sekcją Obsługa błędów.
