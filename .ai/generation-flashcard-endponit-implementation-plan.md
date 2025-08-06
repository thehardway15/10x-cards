# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

- Cel: Utworzyć nową sesję generowania fiszek przy pomocy AI i zwrócić listę kandydatów.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- URL: `/api/generations`
- Nagłówki:
  - `Authorization: Bearer <token>`
- Body:
  ```json
  {
    "sourceText": "String (1000–10000 characters)"
  }
  ```
- Parametry:
  - Wymagane: `sourceText`
  - Opcjonalne: brak

## 3. Szczegóły odpowiedzi

- Status 201 Created
- Wykorzystywane typy:
  - `CreateGenerationResponseDto`
  - `GenerationDetailDto`
  - `GenerationCandidateDto`
- Struktura odpowiedzi:
  ```json
  {
    "generation": {
      "id": "UUID",
      "model": "String",
      "generatedCount": 50,
      "acceptedUneditedCount": 0,
      "acceptedEditedCount": 0,
      "sourceTextHash": "SHA-256 hash",
      "sourceTextLength": 1234,
      "createdAt": "ISO timestamp"
    },
    "candidates": [
      { "candidateId": "UUID", "front": "String", "back": "String" }
      // ...
    ]
  }
  ```
- Kody statusu:
  - 201 – utworzenie
  - 400 – nieprawidłowe dane wejściowe
  - 401 – nieautoryzowany
  - 429 – limit zapytań
  - 502 – błąd usługi AI
  - 500 – błąd serwera

## 4. Przepływ danych

1. Parsowanie i walidacja requestu przy pomocy Zod:
   - `z.object({ sourceText: z.string().min(1000).max(10000) })`
2. Uwierzytelnienie użytkownika z `locals.supabase` → uzyskanie `user.id`
3. Obliczenie `sourceTextHash` (SHA-256) i `sourceTextLength`
4. Wywołanie serwisu AI (Openrouter.ai) przez `generationService.createGeneration`
5. W przypadku błędu AI:
   - Wstawienie wpisu do tabeli `generation_error_logs`
   - Zwrócenie 502
6. Wstawienie rekordu do tabeli `generations` przez Supabase
7. Mapowanie wyniku DB na `GenerationDetailDto`
8. Zwrócenie `CreateGenerationResponseDto`

## 5. Względy bezpieczeństwa

- Autoryzacja: sprawdzanie tokena Supabase w każdym żądaniu
- Walidacja danych surowych (Zod)
- Ograniczenie długości `sourceText` do [1000,10000]
- Rate limiting (middleware / zewnętrzny)
- Bezpieczne przechowywanie kluczy AI w `import.meta.env`
- Ograniczenie dostępu CORS jeśli wymagane

## 6. Obsługa błędów

- 400: błąd walidacji (ZodError)
- 401: brak lub błędny token
- 429: przekroczono limit zapytań
- 502: błąd AI (zalogowany w `generation_error_logs`)
- 500: nieprzewidziane błędy DB lub środowiska

## 7. Rozważania dotyczące wydajności

- Synchronous AI call może być wolny → rozważ asynchroniczne kolejkowanie lub streaming
- Caching wyników po hash'u `sourceText`
- Optymalizacja insertów (batching, transakcje)
- Monitoring metryk czasu odpowiedzi (Telemetry)

## 8. Kroki implementacji

1. Utworzyć Zod schema w `src/pages/api/generations.ts`
2. Stworzyć `src/lib/services/generation.service.ts` z metodą `createGeneration`
3. Implementować endpoint w Astro:
   - `export const prerender = false`
   - `export const POST: APIRoute = async ({ request, locals }) => { ... }`
4. Dodać uwierzytelnienie przez `locals.supabase.auth.getUser()`
5. Zaimplementować logikę haszowania i wywołania AI. Na tym etapie wywołanie AI powinno byc mockiem.
6. Dodać logikę zapisu błędów do `generation_error_logs`
7. Zapis `generations` w DB i mapowanie na DTO
8. Uaktualnić dokumentację w README i plikach OpenAPI (jeśli istnieją)
9. Skonfigurować rate limiting w middleware lub zewnętrznej usłudze
