# Specyfikacja techniczna migracji z autoryzacji sesyjnej na JWT

## 1. Wprowadzenie i cel

Dokument opisuje plan migracji systemu autoryzacji z obecnego podejścia opartego na sesji (ciasteczkach) na mechanizm bezstanowy wykorzystujący tokeny JWT (JSON Web Token). Głównym celem migracji jest uproszczenie testów end-to-end (E2E) w Playwright poprzez ułatwienie symulowania różnych stanów autoryzacji bez konieczności przeprowadzania pełnego procesu logowania.

## 2. Aktualny stan systemu autoryzacji

Obecne rozwiązanie opiera się na:
- Supabase Auth z przechowywaniem sesji w ciasteczkach (`sb`)
- Middleware Astro weryfikującym sesje dla każdego żądania
- Mechanizmie przekazywania stanu sesji między klientem a serwerem za pomocą ciasteczek
- Symulowaniu ciasteczek autoryzacyjnych w testach E2E

### 2.1. Problemy obecnego podejścia

- Skomplikowane zarządzanie stanem sesji w testach E2E
- Trudność w symulowaniu różnych ról użytkowników
- Konieczność implementacji pełnego procesu logowania w testach
- Ograniczona możliwość izolacji testów

## 3. Proponowana architektura JWT

Nowy system autoryzacji będzie wykorzystywał tokeny JWT (JSON Web Token) jako główny mechanizm uwierzytelniania, eliminując potrzebę stanowych sesji po stronie serwera. Token JWT będzie przechowywany:
- Po stronie klienta w localStorage
- Przekazywany w nagłówku `Authorization: Bearer <token>` dla żądań API
- Weryfikowany przez middleware serwera dla każdego chronionego endpointu

## 4. Komponenty wymagające modyfikacji

### 4.1. Moduł autentykacji API (`/src/pages/api/auth/`)

- **login.ts** - modyfikacja procesu logowania, aby zwracał token JWT
- **register.ts** - dostosowanie procesu rejestracji do nowego modelu JWT
- **me.ts** - dostosowanie weryfikacji tożsamości do modelu JWT
- **logout.ts** - zmiana logiki wylogowywania (usunięcie tokenów zamiast sesji)
- **change-password.ts** - aktualizacja walidacji tożsamości

### 4.2. Middleware autoryzacyjne (`/src/middleware/index.ts`)

- Weryfikacja tokena JWT z nagłówka `Authorization`
- Parsowanie i walidacja tokena JWT
- Przechowywanie zdekodowanych danych użytkownika w `locals`
- Zarządzanie wygaśnięciem tokena

### 4.3. Klient API (`/src/lib/api.utils.ts`)

- Utworzenie narzędzia do automatycznego dołączania tokena JWT do żądań
- Zarządzanie odświeżaniem tokenów
- Obsługa błędów autoryzacji

### 4.4. Komponenty React autoryzacji (`/src/components/auth/`)

- **LoginForm.tsx** - modyfikacja obsługi odpowiedzi z API, zapisywanie JWT w localStorage
- **RegisterForm.tsx** - dostosowanie do nowego modelu JWT
- **ChangePasswordForm.tsx** - aktualizacja weryfikacji tożsamości

### 4.5. Moduł Supabase (`/src/db/supabase.client.ts`)

- Dostosowanie klienta Supabase do pracy z tokenami JWT zamiast ciasteczek sesyjnych
- Konfiguracja automatycznego dołączania tokena do żądań

## 5. Kontrakty API

### 5.1. Kontrakt endpointu logowania

```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": string,
  "password": string
}

Response (200 OK):
{
  "token": string, // Token JWT
  "user": {
    "id": string,
    "email": string,
    "role": string,
    // inne dane użytkownika
  }
}

Response (400 Bad Request):
{
  "error": string
}
```

### 5.2. Kontrakt weryfikacji tokenu

```
GET /api/auth/me
Authorization: Bearer <token>

Response (200 OK):
{
  "user": {
    "id": string,
    "email": string,
    "role": string,
    // inne dane użytkownika
  }
}

Response (401 Unauthorized):
{
  "error": "Unauthorized"
}
```

### 5.3. Format tokenu JWT

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": string, // ID użytkownika
  "email": string,
  "role": string,
  "iat": number, // Timestamp utworzenia
  "exp": number  // Timestamp wygaśnięcia
}
```

## 6. Przepływ autoryzacji

1. **Logowanie użytkownika**:
   - Frontend wysyła dane logowania do `/api/auth/login`
   - Backend weryfikuje dane z Supabase Auth
   - Po pozytywnej weryfikacji generuje token JWT
   - Frontend zapisuje token w localStorage

2. **Autoryzacja żądań API**:
   - Frontend dołącza token do każdego żądania jako `Authorization: Bearer <token>`
   - Middleware weryfikuje token dla chronionych endpointów
   - Backend dekoduje token JWT i udostępnia dane użytkownika dla API

3. **Wylogowanie**:
   - Frontend usuwa token z localStorage
   - Backend dodaje token do listy unieważnionych (opcjonalnie)

## 7. Testy E2E w Playwright

### 7.1. Fixtury autoryzacyjne

- Utworzenie specjalnych fixtur generujących tokeny testowe
- Możliwość łatwego tworzenia tokenów dla różnych ról użytkowników
- Automatyczne wstrzykiwanie tokenów do localStorage przed rozpoczęciem testu
- Usuwanie tokenów po zakończeniu testu

### 7.2. Narzędzia pomocnicze dla testów

- Generator tokenów testowych z różnymi rolami i atrybutami
- Funkcje do symulowania wygasłych tokenów
- Narzędzia do weryfikacji prawidłowego stanu po autoryzacji

## 8. Bezpieczeństwo

- Implementacja prawidłowej walidacji tokenów JWT po stronie serwera
- Weryfikacja podpisu tokenu
- Sprawdzanie czasu wygaśnięcia (`exp`)
- Obsługa listy unieważnionych tokenów (opcjonalnie)
- Szyfrowanie krytycznych danych w tokenie
- Krótki czas życia tokenów dla zwiększenia bezpieczeństwa

## 9. Migracja i kompatybilność wsteczna

- Strategia równoległego wsparcia obu metod autoryzacji przez określony czas
- Plan migracji istniejących sesji na tokeny JWT
- Procedura aktualizacji front-endu bez przerw w działaniu aplikacji
- Możliwość rollbacku w przypadku problemów

## 10. Oczekiwane korzyści

- **Uproszczenie testów E2E** - łatwiejsze symulowanie różnych stanów autoryzacji
- **Większa izolacja testów** - każdy test może mieć własny, kontrolowany stan
- **Przyspieszenie testów** - brak konieczności przechodzenia przez proces logowania
- **Lepsza skalowalność** - autoryzacja bezstanowa upraszcza skalowanie horyzontalne
- **Zwiększona testowalność** - łatwiejsze testowanie różnych ról i scenariuszy
- **Ujednolicenie przepływu autoryzacji** - spójny mechanizm dla API i interfejsu użytkownika