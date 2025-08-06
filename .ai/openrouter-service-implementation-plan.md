# OpenRouter Service Implementation Guide

## 1. Opis usługi

`OpenRouterService` to centralna klasa integrująca aplikację z API OpenRouter. Umożliwia wysyłanie zapytań chatowych do modeli LLM, zarządzanie konfiguracją (API key, endpoint) oraz przetwarzanie odpowiedzi zgodnie z podanym `response_format`.

## 2. Opis konstruktora

```ts
constructor(options: {
  apiKey: string;
  endpoint?: string;          // domyślnie 'https://api.openrouter.ai/v1/chat/completions'
  defaultModel?: string;      // np. 'gpt-4o-mini'
  defaultParams?: Record<string, unknown>;
})
```

- **Funkcjonalność:** inicjalizuje klienta HTTP, przechowuje klucz API, URL API i domyślne ustawienia modelu.
- **Walidacja:** rzuca `ConfigurationError` przy braku `apiKey` lub niepoprawnym formacie.

## 3. Publiczne metody i pola

### 3.1. sendMessage

```ts
async sendMessage(options: {
  systemMessage: string;
  userMessage: string;
  modelName?: string;
  modelParams?: { temperature?: number; max_tokens?: number; [key: string]: unknown };
  responseFormat?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
}): Promise<unknown>
```

- Buduje payload z wiadomościami:
  ```json
  {
    "messages": [
      { "role": "system", "content": options.systemMessage },
      { "role": "user", "content": options.userMessage }
    ],
    "model": options.modelName,
    "parameters": options.modelParams,
    "response_format": options.responseFormat
  }
  ```
- Wysyła żądanie do API i zwraca sparsowaną odpowiedź.

**Przykład konfiguracji `responseFormat` dla generowania fiszek:**

```ts
const responseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcard",
    strict: true,
    schema: {
      front: { type: "string", description: "Tekst wyświetlany na przedniej stronie fiszki" },
      back: { type: "string", description: "Tekst wyświetlany na tylnej stronie fiszki" },
    },
  },
};
```

### 3.2. public readonly defaultModel: string

- Domyślna nazwa modelu.

## 4. Prywatne metody i pola

### 4.1. buildPayload

- Służy do składania struktury żądania, łącząc wartości z konstruktora i `sendMessage`.

### 4.2. sendHttpRequest

- Wysyła HTTP POST z nagłówkami:
  - `Authorization: Bearer <apiKey>`
  - `Content-Type: application/json`
- Obsługuje timeout i retry z exponencjalnym backoff.

### 4.3. handleResponse

- Parsuje JSON.
- Jeżeli `responseFormat` to JSON Schema, waliduje odpowiedź przy użyciu `zod`.
- Rzuca `ResponseValidationError` z listą niezgodności.

### 4.4. handleError

- Mapuje kody HTTP na dedykowane klasy błędów:
  - 401 → `OpenRouterAuthError`
  - 429 → `OpenRouterRateLimitError`
  - 5xx → `OpenRouterServerError`
  - Timeout → `OpenRouterTimeoutError`

## 5. Obsługa błędów

| Kod      | Błąd                     | Opis                                                |
| -------- | ------------------------ | --------------------------------------------------- |
| 401      | OpenRouterAuthError      | Nieprawidłowy lub brakujący klucz API               |
| 429      | OpenRouterRateLimitError | Przekroczony limit żądań                            |
| >=500    | OpenRouterServerError    | Błąd po stronie serwera OpenRouter                  |
| Timeout  | OpenRouterTimeoutError   | Przekroczono czas oczekiwania na odpowiedź          |
| JSON err | ResponseValidationError  | Odpowiedź niezgodna z `response_format.json_schema` |

## 6. Kwestie bezpieczeństwa

1. Przechowywanie `OPENROUTER_API_KEY` wyłącznie w zmiennych środowiskowych (`.env`, CI/CD).
2. Wymuszanie TLS i weryfikacja certyfikatów.
3. Sanityzacja treści użytkownika (zapobieganie injection).
4. Ograniczanie logów do minimalnych niezbędnych danych (masked API key).

## 7. Plan wdrożenia krok po kroku

1. **Konfiguracja środowiska**
   - Dodaj do `.env` i konfiguracji CI/CD: `OPENROUTER_API_KEY`
2. **Definicje typów**
   - Dodaj w `src/types.ts` interfejsy:
     ```ts
     interface OpenRouterRequest {
       /* messages, model, parameters, response_format */
     }
     interface OpenRouterResponse {
       /* zgodnie z dokumentacją */
     }
     interface Flashcard {
       front: string;
       back: string;
     }
     ```
3. **Utworzenie serwisu**
   - `src/lib/services/openrouter.service.ts`:
     - Zaimplementuj klasę `OpenRouterService` zgodnie z opisem.
     - Użyj `axios.create` lub `fetch` z retry/backoff.
     - Dodaj walidację schematów przy pomocy `zod`.
4. **Integracja**
   - W `generation.service.ts` zastąp dotychczasowy klient OpenAI instancją `OpenRouterService`.

> Po wykonaniu wszystkich kroków serwis będzie gotowy do obsługi zapytań LLM przez OpenRouter API, z pełną walidacją, obsługą błędów i najlepszymi praktykami bezpieczeństwa.
