# Plan Testów Aplikacji FlashAI

---

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument określa strategię, zakres, podejście i zasoby przeznaczone do testowania aplikacji **FlashAI**. FlashAI to aplikacja internetowa oparta na stosie technologicznym Astro, React i Supabase, której główną funkcją jest generowanie fiszek edukacyjnych przy użyciu sztucznej inteligencji.

### 1.2. Cele testowania

Głównym celem procesu testowego jest zapewnienie wysokiej jakości, niezawodności, bezpieczeństwa i wydajności aplikacji przed jej wdrożeniem produkcyjnym.

Szczegółowe cele:

- **Weryfikacja funkcjonalności:** Upewnienie się, że wszystkie funkcje opisane w wymaganiach działają zgodnie ze specyfikacją.
- **Zapewnienie bezpieczeństwa:** Sprawdzenie, czy dane użytkowników są odpowiednio chronione i odizolowane.
- **Ocena wydajności:** Identyfikacja i eliminacja wąskich gardeł wydajnościowych, zwłaszcza w kluczowych obszarach aplikacji.
- **Zapewnienie spójności UI/UX:** Weryfikacja, czy interfejs użytkownika jest intuicyjny, spójny i wolny od błędów wizualnych.
- **Walidacja integracji:** Potwierdzenie, że integracje z usługami zewnętrznymi (Supabase, OpenRouter.ai) działają poprawnie i są odporne na błędy.

---

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- **Moduł autentykacji:** Rejestracja, logowanie, wylogowanie, zmiana hasła, ochrona tras.
- **Generowanie fiszek AI:** Proces od wklejenia tekstu, przez komunikację z AI, po wyświetlenie kandydatów.
- **Zarządzanie kandydatami:** Akceptacja, edycja, odrzucenie pojedynczych i grupowych propozycji fiszek.
- **Zarządzanie fiszkami (CRUD):** Pełen cykl życia zapisanych fiszek.
- **API Backendowe:** Wszystkie punkty końcowe w `src/pages/api/`.
- **Walidacja danych:** Sprawdzanie poprawności danych wejściowych na poziomie UI, API i bazy danych.

### 2.2. Funkcjonalności wyłączone z testów

- **Infrastruktura Supabase i OpenRouter.ai:** Nie testujemy wewnętrznego działania usług firm trzecich, a jedynie naszą integrację z nimi.
- **Testy użyteczności (Usability Testing):** W tej fazie skupiamy się na testach technicznych; testy z udziałem końcowych użytkowników są poza zakresem tego planu.
- **Kompatybilność z przeglądarkami:** Testy będą prowadzone na najnowszych wersjach przeglądarek Chrome i Firefox. Pełne testy kompatybilności nie są objęte tym planem.

---

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests):**
  - **Cel:** Weryfikacja małych, izolowanych fragmentów kodu (komponenty React, funkcje pomocnicze, logika w hookach, serwisy).
  - **Narzędzia:** Vitest, React Testing Library.
  - **Lokalizacja:** Równolegle do testowanego kodu w katalogach `__tests__`.
- **Testy komponentowe (Component Tests):**
  - **Cel:** Testowanie pojedynczych komponentów React w izolacji, weryfikacja ich renderowania, interakcji i logiki.
  - **Narzędzia:** Vitest, React Testing Library.
- **Testy integracyjne (Integration Tests):**
  - **Cel:** Sprawdzenie współpracy między różnymi częściami systemu (np. frontend -> API -> baza danych). Testowanie warstwy serwisowej i jej interakcji z Supabase.
  - **Narzędzia:** Vitest, Supertest (dla API), klient Supabase podłączony do bazy testowej.
- **Testy End-to-End (E2E):**
  - **Cel:** Symulacja rzeczywistych scenariuszy użytkownika w działającej aplikacji w przeglądarce. Weryfikacja kompletnych przepływów, np. od rejestracji, przez wygenerowanie fiszki, po wylogowanie.
  - **Narzędzia:** Playwright.
- **Testy bezpieczeństwa:**
  - **Cel:** Weryfikacja kluczowych aspektów bezpieczeństwa, zwłaszcza izolacji danych.
  - **Podejście:** Dedykowane scenariusze w testach integracyjnych i E2E sprawdzające polityki RLS.
- **Testy wydajności:**
  - **Cel:** Ocena czasu odpowiedzi aplikacji pod obciążeniem i wydajności po stronie klienta.
  - **Narzędzia:** Lighthouse, profiler przeglądarki.
- **Testy wizualnej regresji:**
  - **Cel:** Automatyczne wykrywanie niezamierzonych zmian w wyglądzie UI.
  - **Narzędzia:** Playwright.

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Moduł Autentykacji i Autoryzacji

| ID      | Scenariusz                                                              | Oczekiwany rezultat                                                                 | Typ testu | Priorytet |
| ------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------- | --------- |
| AUTH-01 | Użytkownik rejestruje się z poprawnymi danymi.                          | Konto zostaje utworzone, użytkownik jest zalogowany i przekierowany na `/generate`. | E2E       | Krytyczny |
| AUTH-02 | Użytkownik próbuje zarejestrować się z zajętym adresem e-mail.          | Wyświetlany jest komunikat błędu "Użytkownik o tym adresie email już istnieje".     | E2E, Int. | Krytyczny |
| AUTH-03 | Niezalogowany użytkownik próbuje wejść na chronioną stronę `/generate`. | Użytkownik jest przekierowany na stronę logowania `/login`.                         | E2E       | Krytyczny |
| AUTH-04 | Użytkownik A próbuje pobrać dane fiszki użytkownika B przez API.        | API zwraca błąd 404 (Not Found), symulując brak dostępu.                            | Int.      | Krytyczny |
| AUTH-05 | Użytkownik wylogowuje się.                                              | Sesja zostaje zakończona, użytkownik jest przekierowany na `/login`.                | E2E       | Wysoki    |

### 4.2. Generowanie Fiszek

| ID     | Scenariusz                                                               | Oczekiwany rezultat                                                                             | Typ testu | Priorytet |
| ------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------- | --------- |
| GEN-01 | Użytkownik wprowadza tekst o poprawnej długości i klika "Generuj".       | Wyświetlany jest loader, a następnie lista kandydatów na fiszki zwrócona przez (mockowane) AI.  | E2E, Komp | Krytyczny |
| GEN-02 | Użytkownik wprowadza tekst o nieprawidłowej długości (<1000 lub >10000). | Przycisk "Generuj" jest nieaktywny, wyświetlany jest komunikat walidacyjny.                     | Komp, E2E | Wysoki    |
| GEN-03 | API OpenRouter zwraca błąd 502 podczas generowania.                      | UI wyświetla komunikat o błędzie i pozwala na ponowienie próby. W bazie zapisuje się log błędu. | Int., E2E | Wysoki    |
| GEN-04 | Użytkownik akceptuje kandydata na fiszkę.                                | Fiszka jest zapisywana w bazie danych i znika z listy kandydatów.                               | E2E, Int. | Wysoki    |
| GEN-05 | Użytkownik edytuje kandydata i zapisuje zmiany.                          | Fiszka jest zapisywana ze zmodyfikowanymi danymi i flagą `ai-edited`.                           | E2E, Komp | Średni    |

---

## 5. Środowisko testowe

- **Środowisko deweloperskie lokalne:** Do uruchamiania testów jednostkowych i integracyjnych podczas developmentu.
- **Środowisko CI (Continuous Integration):** Dedykowane środowisko na platformie GitHub Actions, które uruchamia pełen zestaw testów (jednostkowe, integracyjne, E2E) przy każdym pushu do gałęzi `main` i przy tworzeniu Pull Requestów.
- **Baza danych:** Oddzielna, testowa instancja Supabase z predefiniowanym zestawem danych testowych (tzw. fixtures) do testów integracyjnych i E2E. Klucze API i URL do tej bazy będą przechowywane jako sekrety w repozytorium GitHub.

---

## 6. Narzędzia do testowania

| Kategoria               | Narzędzie                     | Zastosowanie                                                          |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------- |
| Test Runner / Framework | **Vitest**                    | Uruchamianie testów jednostkowych, komponentowych i integracyjnych.   |
| Biblioteka testująca UI | **React Testing Library**     | Testowanie komponentów React bez polegania na detalach implementacji. |
| Testy E2E               | **Playwright**                | Automatyzacja scenariuszy użytkownika w przeglądarce.                 |
| Mockowanie API          | **Mock Service Worker (MSW)** | Mockowanie żądań sieciowych w testach komponentowych i E2E.           |
| Aspekty (Assertions)    | **Vitest (`expect`)**         | Weryfikacja wyników testów.                                           |
| Zarządzanie CI/CD       | **GitHub Actions**            | Automatyzacja uruchamiania testów.                                    |
| Raportowanie błędów     | **GitHub Issues**             | Śledzenie i zarządzanie zgłoszonymi błędami.                          |

---

## 7. Harmonogram testów

Testowanie jest procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania.

- **Testy jednostkowe i komponentowe:** Pisane przez deweloperów równolegle z implementacją nowych funkcji.
- **Testy integracyjne:** Pisane po zaimplementowaniu logiki serwisowej i API.
- **Testy E2E:** Rozwijane przyrostowo dla każdej nowej, kompletnej historyjki użytkownika.
- **Testy regresji:** Pełen zestaw testów uruchamiany automatycznie przed każdym wdrożeniem.
- **Testy dymne (Smoke Tests):** Podstawowy zestaw krytycznych scenariuszy E2E uruchamiany po każdym wdrożeniu na środowisko stagingowe/produkcyjne.

---

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia (rozpoczęcia testów)

- Zakończona implementacja danej funkcjonalności.
- Kod pomyślnie przechodzi testy jednostkowe napisane przez dewelopera.
- Aplikacja jest poprawnie zbudowana i wdrożona na środowisku testowym.

### 8.2. Kryteria wyjścia (zakończenia testów)

- 100% testów jednostkowych, integracyjnych i E2E przechodzi pomyślnie.
- Pokrycie kodu testami (code coverage) utrzymuje się na poziomie co najmniej 80% dla kluczowych modułów.
- Wszystkie zidentyfikowane błędy krytyczne i wysokie zostały naprawione i zweryfikowane.
- Brak otwartych błędów blokujących główne funkcjonalności aplikacji.

---

## 9. Role i odpowiedzialności

| Rola                    | Odpowiedzialność                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Deweloper**           | - Pisanie testów jednostkowych i komponentowych.<br>- Naprawa błędów wykrytych przez testy.<br>- Utrzymanie i aktualizacja testów.                                                         |
| **Inżynier QA**         | - Projektowanie i implementacja testów integracyjnych i E2E.<br>- Zarządzanie planem testów i strategią.<br>- Raportowanie i analiza wyników testów.<br>- Utrzymanie środowiska testowego. |
| **Tech Lead/Architekt** | - Nadzór nad jakością kodu i strategią testów.<br>- Przegląd planów testowych i wyników.                                                                                                   |

---

## 10. Procedury raportowania błędów

1.  **Zgłoszenie błędu:** Każdy znaleziony błąd musi być zgłoszony jako **Issue** w repozytorium GitHub projektu.
2.  **Zawartość zgłoszenia:**
    - **Tytuł:** Krótki, zwięzły opis problemu.
    - **Opis:**
      - Kroki do odtworzenia błędu (Steps to Reproduce).
      - Oczekiwany rezultat (Expected Result).
      - Rzeczywisty rezultat (Actual Result).
    - **Środowisko:** Wersja przeglądarki, system operacyjny.
    - **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.
    - **Etykiety:** Przypisanie etykiet (`bug`, priorytet: `critical`, `high`, `medium`, `low`).
3.  **Triage:** Zgłoszone błędy są regularnie przeglądane, priorytetyzowane i przypisywane do odpowiednich deweloperów.
4.  **Naprawa i weryfikacja:** Deweloper naprawia błąd i oznacza go jako gotowy do weryfikacji. Inżynier QA weryfikuje poprawkę na środowisku testowym.
5.  **Zamknięcie zgłoszenia:** Po pomyślnej weryfikacji, zgłoszenie jest zamykane.
