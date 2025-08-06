# Architektura UI dla FlashAI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji FlashAI została zaprojektowana w celu zapewnienia prostego, intuicyjnego i wydajnego doświadczenia użytkownika. Opiera się na podejściu zorientowanym na zadania, gdzie kluczowe funkcje, takie jak generowanie fiszek przez AI i zarządzanie nimi, są łatwo dostępne.

Struktura dzieli się na dwie główne części:

- **Publiczna**: Obejmuje strony logowania i rejestracji, dostępne dla niezalogowanych użytkowników.
- **Prywatna (chroniona)**: Dostępna po zalogowaniu, zawiera wszystkie podstawowe funkcje aplikacji i jest objęta wspólnym layoutem z nawigacją.

Wykorzystanie biblioteki komponentów Shadcn/ui zapewnia spójność wizualną, dostępność oraz responsywność. Stan aplikacji, w tym obsługa powiadomień i modali, będzie zarządzany centralnie przy użyciu React.

## 2. Lista widoków

### Widok: Rejestracja

- **Ścieżka:** `/register`
- **Główny cel:** Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na adres e-mail i hasło.
- **Kluczowe komponenty widoku:**
  - `RegisterForm`: Formularz z walidacją pól (zgodnie z polityką haseł).
  - `Toast`: Do wyświetlania komunikatów o sukcesie lub błędzie rejestracji.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Po udanej rejestracji użytkownik jest automatycznie logowany i przekierowywany do widoku `/generate`.
  - **Dostępność:** Wyraźne etykiety pól, komunikaty walidacyjne powiązane z polami (`aria-describedby`).
  - **Bezpieczeństwo:** Hasło przesyłane bezpiecznie, brak przechowywania go w stanie aplikacji po wysłaniu.

### Widok: Logowanie

- **Ścieżka:** `/login`
- **Główny cel:** Umożliwienie istniejącym użytkownikom zalogowania się do aplikacji.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na adres e-mail i hasło.
- **Kluczowe komponenty widoku:**
  - `LoginForm`: Formularz logowania.
  - `Toast`: Do wyświetlania komunikatu o błędnych danych logowania.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Po udanym logowaniu użytkownik jest przekierowywany do widoku `/generate`. Link do strony rejestracji.
  - **Dostępność:** Wyraźne etykiety pól, obsługa focusu.
  - **Bezpieczeństwo:** Zabezpieczenie przed atakami typu brute-force (obsługiwane przez Supabase).

### Widok: Generowanie Fiszek

- **Ścieżka:** `/generate`
- **Główny cel:** Wprowadzenie tekstu źródłowego, wygenerowanie propozycji fiszek przez AI i zarządzanie kandydatami.
- **Kluczowe informacje do wyświetlenia:**
  - Pole tekstowe na tekst źródłowy (1000-10000 znaków).
  - Lista kandydatów na fiszki z paginacją (przód, tył).
  - Informacje o stanie (np. "Generowanie...", "Brak kandydatów").
- **Kluczowe komponenty widoku:**
  - `SourceTextInput`: Komponent z `Textarea` i walidacją długości.
  - `CandidateList`: Komponent wyświetlający listę kandydatów z akcjami (akceptuj, edytuj, odrzuć).
  - `Pagination`: Do nawigacji między stronami kandydatów.
  - `Skeleton`: Do wyświetlania stanu ładowania listy.
  - `EditFlashcardModal`: Modal do edycji kandydata przed akceptacją.
  - `ConfirmActionDialog`: Modal potwierdzający odrzucenie kandydata.
  - `Toast`: Do informowania o sukcesie/błędzie generacji i akcji na kandydatach.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Przycisk "Generuj" jest nieaktywny, dopóki tekst nie spełnia wymogów długości. Jasne stany ładowania i puste. Możliwość ponowienia próby po błędzie AI.
  - **Dostępność:** Zarządzanie focusem w modalach. Elementy listy i akcje są dostępne z klawiatury.
  - **Bezpieczeństwo:** Akcje odrzucenia wymagają potwierdzenia, aby zapobiec przypadkowej utracie danych.

### Widok: Moje Fiszki

- **Ścieżka:** `/flashcards`
- **Główny cel:** Przeglądanie, edycja, usuwanie zaakceptowanych fiszek oraz ręczne tworzenie nowych.
- **Kluczowe informacje do wyświetlenia:**
  - Paginowana lista wszystkich zaakceptowanych fiszek (przód, tył, źródło).
- **Kluczowe komponenty widoku:**
  - `FlashcardList`: Komponent wyświetlający listę fiszek z akcjami (edytuj, usuń).
  - `Pagination`: Do nawigacji między stronami fiszek.
  - `Skeleton`: Stan ładowania listy.
  - `AddEditFlashcardModal`: Modal do ręcznego dodawania nowej fiszki lub edycji istniejącej.
  - `ConfirmDeleteDialog`: Modal potwierdzający usunięcie fiszki.
  - `Toast`: Do informowania o wynikach operacji CRUD.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wyraźny przycisk do dodawania nowej fiszki. Spójne działanie edycji i usuwania z widokiem generowania.
  - **Dostępność:** Wszystkie akcje (dodawanie, edycja, usuwanie) są dostępne z klawiatury.
  - **Bezpieczeństwo:** Usunięcie fiszki wymaga potwierdzenia w modalu.

### Widok: Ustawienia

- **Ścieżka:** `/settings`
- **Główny cel:** Zarządzanie kontem użytkownika i ustawieniami aplikacji.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz zmiany hasła.
  - Przełącznik motywu (jasny/ciemny).
- **Kluczowe komponenty widoku:**
  - `ChangePasswordForm`: Formularz do zmiany hasła z walidacją.
  - `ThemeSwitcher`: Przełącznik do zmiany motywu.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasne komunikaty o sukcesie lub błędzie zmiany hasła. Zmiana motywu jest natychmiastowa.
  - **Dostępność:** Etykiety i instrukcje są czytelne. Przełącznik motywu ma odpowiednie etykiety ARIA.
  - **Bezpieczeństwo:** Użytkownik musi podać stare hasło, aby je zmienić.

## 3. Mapa podróży użytkownika

Główny przepływ pracy użytkownika jest zoptymalizowany pod kątem szybkiego przejścia od pomysłu do gotowych fiszek.

1.  **Wejście do aplikacji:**
    - Nowy użytkownik ląduje na `/register`, tworzy konto i jest automatycznie logowany.
    - Istniejący użytkownik ląduje na `/login` i loguje się na swoje konto.
2.  **Generowanie fiszek (domyślny widok):**
    - Po zalogowaniu użytkownik jest przekierowywany na `/generate`.
    - Wkleja tekst w pole `Textarea`.
    - Klika "Generuj fiszki". Aplikacja wyświetla `Skeleton loader` w miejscu listy.
    - Po chwili pojawia się lista kandydatów na fiszki zwrócona przez API.
3.  **Zarządzanie kandydatami:**
    - Użytkownik przegląda listę kandydatów.
    - **Akceptuje** fiszki, które mu odpowiadają (są one zapisywane w tle).
    - **Odrzuca** fiszki niepasujące (po potwierdzeniu).
    - **Edytuje** fiszki, które wymagają poprawek (w modalu), a następnie zapisuje je, co jest równoznaczne z akceptacją.
4.  **Praca z zaakceptowanymi fiszkami:**
    - Użytkownik przechodzi do widoku `/flashcards`.
    - Widzi wszystkie swoje zaakceptowane fiszki.
    - Może je **edytować** lub **usuwać** (każda akcja z potwierdzeniem).
    - Może również **dodać nową fiszkę ręcznie** za pomocą dedykowanego przycisku i formularza w modalu.
5.  **Zarządzanie kontem:**
    - Użytkownik przechodzi do `/settings`, aby zmienić hasło lub motyw aplikacji.
6.  **Zakończenie pracy:**
    - Użytkownik klika "Wyloguj" w nawigacji, co kończy jego sesję i przekierowuje go na stronę logowania.

## 4. Układ i struktura nawigacji

Aplikacja wykorzystuje dwa główne układy (layouty):

1.  **`PublicLayout.astro`**: Prosty layout dla stron `/login` i `/register`, który centruje zawartość i nie zawiera paska nawigacyjnego.
2.  **`ProtectedLayout.astro`**: Główny layout dla zalogowanych użytkowników, obejmujący widoki `/generate`, `/flashcards` i `/settings`. Zawiera on responsywny, stały pasek nawigacyjny.

**Struktura nawigacji (`NavigationMenu`):**

- **Logo aplikacji:** Zawsze widoczne, linkuje do `/generate`.
- **Linki główne:**
  - "Generuj" (`/generate`)
  - "Moje Fiszki" (`/flashcards`)
- **Menu użytkownika (prawa strona):**
  - Ikona ustawień, linkująca do `/settings`.
  - Przycisk "Wyloguj".
- **Responsywność:**
  - Na urządzeniach mobilnych (poniżej breakpointu `md`) linki i menu użytkownika są zwinięte do menu hamburgerowego, co zapewnia czysty interfejs i oszczędność miejsca.

## 5. Kluczowe komponenty

Poniższe komponenty React (`.tsx`) będą reużywalne w całej aplikacji, aby zapewnić spójność i modularność.

- **`PageLayout`**: Komponent opakowujący zawartość każdej strony, ustalający standardowe marginesy i maksymalną szerokość.
- **`DataTable` / `PaginatedList`**: Abstrakcyjny komponent do wyświetlania danych (kandydatów, fiszek) w formie listy z wbudowaną obsługą paginacji, stanu ładowania (`Skeleton`) i stanu pustego.
- **`AddEditFlashcardModal`**: Modal z formularzem (`React Hook Form` i walidacją `Zod`) do dodawania i edytowania fiszek. Używany zarówno w `/generate` (edycja kandydata) jak i `/flashcards` (dodawanie/edycja).
- **`ConfirmActionDialog`**: Generyczny modal (`AlertDialog`) do potwierdzania akcji destrukcyjnych (np. odrzucenie kandydata, usunięcie fiszki), aby zapobiec błędom użytkownika.
- **`Skeleton`**: Komponenty szkieletowe naśladujące układ finalnych list i kart, używane podczas ładowania danych, aby zredukować odczuwalny czas oczekiwania (LCP).
- **`ToastProvider` / `useToast`**: Globalny system powiadomień do informowania użytkownika o wynikach operacji asynchronicznych (sukces, błąd, informacja).
- **`AppContextProvider` / `useAppContext`**: Globalny kontekst React do zarządzania stanem modali i innymi elementami globalnymi, co upraszcza komunikację między komponentami.
