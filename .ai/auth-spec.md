# Specyfikacja Techniczna Modułu Autentykacji - FlashAI

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu autentykacji, rejestracji i zarządzania kontem użytkownika w aplikacji FlashAI. Rozwiązanie opiera się na wymaganiach zdefiniowanych w PRD (US-001, US-002, US-003, US-004, US-016) oraz na stosie technologicznym określonym w dokumencie `tech-stack.md`.

Celem jest stworzenie bezpiecznego i spójnego systemu uwierzytelniania, który integruje się z istniejącą architekturą aplikacji opartą na Astro i Supabase.

## 2. Architektura Interfejsu Użytkownika

### 2.1. Nowe Strony (Pages)

- **`/login` (Logowanie)**

  - **Plik:** `src/pages/login.astro`
  - **Opis:** Publicznie dostępna strona zawierająca formularz logowania. Będzie renderować komponent React `LoginForm.tsx`. W przypadku, gdy użytkownik jest już zalogowany, strona automatycznie przekieruje go do strony głównej aplikacji (`/generate`).

- **`/register` (Rejestracja)**

  - **Plik:** `src/pages/register.astro`
  - **Opis:** Publicznie dostępna strona z formularzem rejestracyjnym. Będzie renderować komponent React `RegisterForm.tsx`. Podobnie jak strona logowania, przekieruje zalogowanego użytkownika na stronę główną aplikacji (`/generate`).

- **`/account` (Zarządzanie kontem)**
  - **Plik:** `src/pages/account.astro`
  - **Opis:** Strona dostępna tylko dla zalogowanych użytkowników, umożliwiająca zarządzanie kontem. Początkowo będzie zawierać formularz zmiany hasła renderowany przez komponent `ChangePasswordForm.tsx`.

### 2.2. Aktualizacja Layoutu i Komponentów

- **`src/layouts/Layout.astro` (Główny Layout)**
  - **Zmiany:** Layout zostanie zaktualizowany, aby dynamicznie wyświetlać stan autentykacji użytkownika.
  - **Tryb non-auth (niezalogowany):** W prawym górnym rogu nagłówka będzie widoczny przycisk/link "Zaloguj się", prowadzący do `/login`.
  - **Tryb auth (zalogowany):** W tym samym miejscu pojawi się adres e-mail użytkownika, który będzie linkiem do strony `/account`, oraz przycisk "Wyloguj". Przycisk wylogowania będzie formularzem, który wyśle żądanie POST do endpointu `/api/auth/logout`.

### 2.3. Nowe Komponenty React (Client-side)

Komponenty te będą odpowiedzialne za interaktywność formularzy, walidację po stronie klienta i komunikację z API backendu.

- **`src/components/auth/LoginForm.tsx`**

  - **Odpowiedzialność:**
    - Renderowanie formularza z polami "Email" i "Hasło".
    - Walidacja po stronie klienta (np. czy pole nie jest puste, czy email ma poprawny format).
    - Obsługa wysyłania formularza: wykonanie żądania `POST` do `/api/auth/login` z danymi uwierzytelniającymi.
    - Wyświetlanie komunikatów o błędach zwróconych przez API (np. "Nieprawidłowy email lub hasło").
    - Po pomyślnym zalogowaniu, przekierowanie użytkownika na stronę `/generate` za pomocą nawigacji po stronie klienta.

- **`src/components/auth/RegisterForm.tsx`**

  - **Odpowiedzialność:**
    - Renderowanie formularza z polami "Email", "Hasło" i "Potwierdź hasło".
    - Walidacja po stronie klienta (zgodność haseł, polityka złożoności hasła - min. 8 znaków, litera i cyfra).
    - Obsługa wysyłania formularza: wykonanie żądania `POST` do `/api/auth/register`.
    - Wyświetlanie komunikatów o błędach (np. "Użytkownik o tym adresie email już istnieje", "Hasła nie są zgodne").
    - Po pomyślnej rejestracji, przekierowanie użytkownika na stronę `/generate`.

- **`src/components/auth/ChangePasswordForm.tsx`**
  - **Odpowiedzialność:**
    - Renderowanie formularza z polami "Aktualne hasło", "Nowe hasło" i "Potwierdź nowe hasło".
    - Walidacja po stronie klienta (zgodność nowych haseł, polityka złożoności).
    - Obsługa wysyłania formularza: wykonanie żądania `POST` do `/api/auth/password-change`.
    - Wyświetlanie komunikatów o sukcesie lub błędach zwróconych przez API.

### 2.4. Scenariusze Użytkownika i Obsługa Błędów

- **Logowanie:**
  - ** sukces:** Użytkownik jest przekierowany na `/generate`, a layout wyświetla jego email i przycisk wylogowania.
  - ** błąd:** Komponent `LoginForm.tsx` wyświetla pod formularzem komunikat błędu, np. "Nieprawidłowe dane logowania".
- **Rejestracja:**
  - ** sukces:** Użytkownik jest automatycznie zalogowany, przekierowany na `/generate`, a layout zaktualizowany.
  - ** błąd:** Komponent `RegisterForm.tsx` wyświetla odpowiedni komunikat, np. "Użytkownik już istnieje" lub "Hasło jest zbyt proste".
- **Dostęp do chronionej strony:**
  - Niezalogowany użytkownik próbujący wejść na `/generate` zostanie przekierowany na stronę `/login`. Ta logika zostanie zaimplementowana w middleware.

## 3. Logika Backendowa

### 3.1. Endpointy API

Wszystkie endpointy będą znajdować się w katalogu `src/pages/api/auth/`.

- **`POST /api/auth/login`**

  - **Plik:** `src/pages/api/auth/login.ts`
  - **Logika:**
    1. Odbiera `email` i `password` z ciała żądania.
    2. Waliduje dane wejściowe przy użyciu schematu Zod.
    3. Wywołuje `supabase.auth.signInWithPassword({ email, password })` używając klienta Supabase z `context.locals`.
    4. W przypadku błędu (np. nieprawidłowe dane) zwraca status 401 z komunikatem błędu.
    5. W przypadku sukcesu, Supabase automatycznie zarządza sesją za pomocą ciasteczek. Endpoint zwraca status 200 z danymi użytkownika.

- **`POST /api/auth/register`**

  - **Plik:** `src/pages/api/auth/register.ts`
  - **Logika:**
    1. Odbiera `email`, `password` z ciała żądania.
    2. Waliduje dane wejściowe, w tym politykę złożoności hasła.
    3. Wywołuje `supabase.auth.signUp({ email, password })`.
    4. Obsługuje błędy, takie jak istnienie użytkownika, i zwraca status 409 (Conflict).
    5. Po pomyślnej rejestracji, użytkownik jest automatycznie zalogowany. Zwraca status 201.

- **`POST /api/auth/logout`**

  - **Plik:** `src/pages/api/auth/logout.ts`
  - **Logika:**
    1. Wywołuje `supabase.auth.signOut()`.
    2. Niezależnie od wyniku, przekierowuje użytkownika na stronę logowania (`/login`).

- **`POST /api/auth/password-change`**
  - **Plik:** `src/pages/api/auth/password-change.ts`
  - **Logika:**
    1. Endpoint chroniony – wymaga aktywnej sesji użytkownika.
    2. Odbiera `currentPassword` i `newPassword` z ciała żądania.
    3. Pobiera dane zalogowanego użytkownika z `context.locals.user`.
    4. Weryfikuje aktualne hasło poprzez próbę zalogowania: `supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })`.
    5. Jeśli weryfikacja się nie powiedzie, zwraca status 401 z komunikatem "Aktualne hasło jest nieprawidłowe".
    6. Jeśli weryfikacja się powiedzie, aktualizuje hasło użytkownika za pomocą `supabase.auth.updateUser({ password: newPassword })`.
    7. Zwraca status 200 w przypadku sukcesu.

### 3.2. Walidacja i Modele Danych

- **Schematy Zod:** Zdefiniujemy schematy walidacji dla danych logowania, rejestracji i zmiany hasła w `src/lib/schemas/auth.schema.ts`, aby zapewnić spójność między frontendem a backendem.

### 3.3. Renderowanie Stron (Server-side)

- Konfiguracja `output: "server"` w `astro.config.mjs` pozwala na dynamiczne renderowanie stron, co jest kluczowe do ochrony tras.
- Strona `src/pages/generate/index.astro` oraz nowa strona `src/pages/account.astro` będą zawierać logikę sprawdzającą sesję użytkownika na serwerze. Jeśli sesja nie istnieje, użytkownik zostanie przekierowany do `/login`.

## 4. System Autentykacji z Supabase

### 4.1. Integracja z Supabase Auth

- Wykorzystamy `supabase-js` SDK do wszystkich operacji związanych z autentykacją. Klient Supabase jest już dostarczany przez middleware i dostępny w `context.locals.supabase`.
- Hasła użytkowników będą bezpiecznie przechowywane i hashowane przez Supabase.

### 4.2. Zarządzanie Sesją

- Supabase Auth domyślnie używa ciasteczek (`cookies`) do zarządzania sesją, co doskonale integruje się z renderowaniem po stronie serwera w Astro.
- Eksperymentalna flaga `session` w `astro.config.mjs` może wspomóc zarządzanie stanem sesji w Astro, ale główny mechanizm będzie oparty na ciasteczkach Supabase.

### 4.3. Middleware (`src/middleware/index.ts`)

Istniejący middleware zostanie rozszerzony o logikę autentykacji.

- **Aktualna logika:**

  - Wstrzykuje `supabaseClient` do `context.locals`.

- **Nowa logika:**
  1. Na początku każdego żądania middleware pobierze dane o sesji użytkownika z Supabase na podstawie ciasteczek w żądaniu.
  2. Informacje o zalogowanym użytkowniku (lub ich brak) zostaną umieszczone w `context.locals`, np. `context.locals.user`.
  3. Middleware sprawdzi, czy żądanie dotyczy chronionej trasy (np. `/generate`, `/account` lub `/api/flashcards`).
  4. Jeśli użytkownik próbuje uzyskać dostęp do chronionego zasobu bez aktywnej sesji, middleware zwróci przekierowanie (status 302) do `/login`.
  5. Publiczne trasy (`/`, `/login`, `/register`, `/api/auth/*`) będą ignorowane przez tę logikę.

Ta architektura zapewni solidne fundamenty pod bezpieczny i funkcjonalny system autentykacji, w pełni zgodny z wymaganiami projektu i wykorzystujący mocne strony wybranego stosu technologicznego.
