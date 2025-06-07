# API Endpoint Implementation Plan: PUT /api/flashcards/{id}

## 1. Przegląd punktu końcowego
Zaktualizowanie istniejącej fiszki użytkownika. Umożliwia edycję pól `front` i `back` dla zapisanej fiszki lub AI kandydata przed akceptacją.

## 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: `/api/flashcards/{id}`
- Nagłówki:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Parametry:
  - Wymagane:
    - `id` (path) – UUID identyfikujący fiszkę
  - Opcjonalne: brak
- Request Body:
  ```json
  {
    "front": "String (1–200)",
    "back": "String (1–500)"
  }
  ```

## 3. Wykorzystywane typy
- `UpdateFlashcardCommand` (front: string; back: string)
- `UpdateFlashcardResponseDto` ({ message: string })
- Typy pomocnicze z `types.ts` i `database.types`

## 4. Szczegóły odpowiedzi
- 200 OK
  ```json
  { "message": "Flashcard updated" }
  ```
- 400 Bad Request – niepoprawne dane wejściowe
- 401 Unauthorized – brak lub nieważny token
- 403 Forbidden – próba edycji cudzego zasobu
- 404 Not Found – nie znaleziono fiszki lub jest oznaczona jako usunięta
- 500 Internal Server Error – nieoczekiwany błąd serwera

## 5. Przepływ danych
1. Middleware Astro pobiera `supabase` z `context.locals` i weryfikuje token.
2. Route handler (`src/pages/api/flashcards/[id].ts`) odczytuje `id` i ciało żądania.
3. Walidacja danych wejściowych za pomocą Zod:
   - `front`: string.min(1).max(200)
   - `back`: string.min(1).max(500)
   - `id`: UUID
4. Wywołanie metody w `FlashcardService.updateFlashcard(userId, id, command)`:
   - Pobranie rekordu z bazy: `user_id = userId AND id = id AND is_deleted = false`.
   - Jeśli nie istnieje → rzuca `NotFoundError`.
   - Aktualizacja pól `front`, `back`, `updated_at`.
5. Zwrócenie `200` z komunikatem.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie JWT przez middleware Astro.
- Autoryzacja: sprawdzenie własności zasobu (`flashcard.user_id === userId`).
- Zabezpieczenie przed SQL Injection dzięki Supabase SDK i parametrów zapytań.
- Walidacja i oczyszczanie danych wejściowych.

## 7. Obsługa błędów
| Scenariusz                            | Kod  | Opis                                                        |
|---------------------------------------|------|-------------------------------------------------------------|
| Brak/nieprawny token                  | 401  | Użytkownik niezalogowany lub token wygasł                   |
| Niepoprawne pola front/back           | 400  | Validator Zod zwróci informacje o błędach                   |
| Fiszka nie istnieje lub usunięta      | 404  | Brak rekordu lub `is_deleted = true`                        |
| Próba edycji cudzego zasobu           | 403  | `user_id` fiszki różny od aktualnego użytkownika           |
| Błąd po stronie serwera (np. timeout) | 500  | Nieoczekiwany wyjątek                                      |

## 8. Rozważania dotyczące wydajności
- Aktualizacja pojedynczego wiersza – niski narzut.
- Wykorzystanie indeksu `idx_flashcards_active` przy weryfikacji is_deleted.
- Równoległe zapytania w przypadku masowej operacji (nie dotyczy endpointu PUT).

## 9. Etapy wdrożenia
1. Utworzyć lub rozszerzyć serwis `FlashcardService` w `src/lib/services/flashcards.service.ts` o metodę `updateFlashcard(userId, id, command)`.
2. Zdefiniować schemat Zod w `src/lib/schemas/flashcard.schema.ts`.
3. Dodać nowy plik route handlera `src/pages/api/flashcards/[id].ts`:
   - Import Supabase z `context.locals`.
   - Obsługa metody PUT.
   - Walidacja ID i body.
   - Wywołanie serwisu.
   - Odpowiednia konwersja błędów na kody statusu.
