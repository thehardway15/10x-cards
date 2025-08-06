# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego

Bulkowe tworzenie nowych fiszek dla zalogowanego użytkownika w jednym żądaniu.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Ścieżka: `/api/flashcards`
- Nagłówki:
  - `Authorization: Bearer <token>`
- Parametry URL: Brak
- Request Body: tablica obiektów typu `CreateFlashcardCommand`:
  ```json
  [
    {
      "front": "String (1–200 chars)",
      "back": "String (1–500 chars)",
      "source": "manual|ai-full|ai-edited",
      "generationId": "UUID (required if source != manual)"
    },
    ...
  ]
  ```
- Wykorzystywane typy:
  - `CreateFlashcardCommand` (src/types.ts)
  - `BulkCreateFlashcardsCommand` = `CreateFlashcardCommand[]`

## 3. Szczegóły odpowiedzi

- 201 Created:
  ```json
  {
    "items": [
      { "id": "UUID", "front": "...", "back": "...", "source": "...", "createdAt": "TIMESTAMP" },
      ...
    ]
  }
  ```
- Kody statusu:
  - 201: Utworzono
  - 400: Walidacja nie powiodła się (szczegóły błędów per-item)
  - 401: Nieautoryzowany
  - 500: Błąd serwera

## 4. Przepływ danych

1. Middleware (Astro) weryfikuje token, ustawia `context.locals.supabase` i `userId`.
2. Endpoint odbiera request, parsuje body.
3. Walidacja schematu za pomocą Zod (limit długości, enum, warunkowe `generationId`).
4. Dla każdego elementu z `source` != `manual` potwierdzane jest, że `generationId` istnieje i należy do `userId`.
5. Wywołanie serwisu `flashcardsService.bulkCreate(commands, userId)`:
   - `supabase.from('flashcards').insert(..., { returning: 'representation' })`.
6. Serwis zwraca listę utworzonych `FlashcardDto`.
7. Endpoint zwraca 201 z payloadem `BulkCreateFlashcardsResponseDto`.

## 5. Względy bezpieczeństwa

- Autentykacja: wymagany poprawny JWT Supabase.
- Autoryzacja: `generationId` musi należeć do bieżącego użytkownika.
- Walidacja wejścia zapobiega SQL injection (Supabase SDK).
- Ochrona przed masowym tworzeniem: opcjonalne ograniczenie liczby pozycji w jednym żądaniu.

## 6. Obsługa błędów

- 401: brak lub nieprawidłowy token.
- 400:
  - Błędy walidacji Zod (niewłaściwy format, długość, brak wymaganego `generationId`).
  - `generationId` nie istnieje lub nie należy do użytkownika.
- 500: nieoczekiwany błąd serwera lub bazy danych.

## 7. Wydajność

- Jedno bulk insert w pojedynczym zapytaniu do bazy.
- Wykorzystanie indeksów: `idx_flashcards_user_id` i `idx_flashcards_active`.
- Rozważenie limitu maksymalnej liczby elementów (np. 100) w jednym żądaniu.

## 8. Kroki implementacji

1. W `src/lib/schemas/flashcards.ts` zdefiniować Zod schema `createFlashcardsSchema`.
2. W `src/lib/services/flashcards.ts` utworzyć `flashcardsService.bulkCreate`, obsługujący insert i mapowanie.
3. W `src/pages/api/flashcards.ts` zaimplementować handler:
   - import schematu i serwisu
   - uwierzytelnienie i pobranie `userId`
   - walidacja request body
   - weryfikacja `generationId` dla elementów AI
   - wywołanie serwisu i zwrócenie odpowiedniej odpowiedzi
