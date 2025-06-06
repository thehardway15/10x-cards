# Dokument wymagań produktu (PRD) - FlashAI

## 1. Przegląd produktu

FlashAI to webowa aplikacja umożliwiająca użytkownikom szybkie tworzenie, przegląd i zarządzanie fiszkami edukacyjnymi. Główne funkcje obejmują generowanie fiszek przez AI na podstawie wprowadzonego tekstu, ręczne tworzenie i edycję fiszek, integrację z istniejącym algorytmem powtórek oraz prosty system kont użytkowników. Aplikacja jest hostowana w kontenerach Docker na DigitalOcean, z podstawowym pipeline CI/CD, a wszystkie akcje są logowane do celów pomiaru KPI.

## 2. Problem użytkownika

- Manualne tworzenie fiszek wysokiej jakości jest czasochłonne i monotonne.
- Brak szybkiego narzędzia do automatycznej konwersji tekstu na fiszki zniechęca do korzystania z metody spaced repetition.
- Użytkownicy potrzebują prostego i niezawodnego narzędzia, które zminimalizuje czas przygotowania materiału do nauki.

## 3. Wymagania funkcjonalne

1. Generowanie fiszek przez AI
   - Wejście: tekst plain-text o długości od 1000 do 10000 znaków.
   - Wyjście: lista kandydatów na fiszki z polami „przód” (≤200 znaków) i „tył” (≤500 znaków).
2. Przegląd kandydatów
   - Paginacja 20 pozycji na stronę.
   - Możliwość akceptacji, edycji lub odrzucenia każdego kandydata.
3. Zapisywanie zaakceptowanych fiszek
   - Tylko zaakceptowane fiszki są przechowywane w bazie.
   - Kontekst i dane tymczasowe są przechowywane wyłącznie w logach.
4. Ręczne tworzenie, edycja i usuwanie fiszek
   - Formularz dodawania nowej fiszki ze standardowymi polami.
   - Możliwość edycji i usunięcia zapisanej fiszki.
5. Autoryzacja i zarządzanie kontem
   - Rejestracja konta przez email i hasło (bez weryfikacji mailowej).
   - Logowanie i wylogowanie.
   - Zmiana hasła (bez resetu).
6. Obsługa błędów AI i retry logic
   - Wyświetlanie komunikatu o błędzie w przypadku nieudanej komunikacji z API AI.
   - Możliwość ponowienia próby wygenerowania fiszek.
7. Integracja z algorytmem powtórek
   - Eksport zaakceptowanych fiszek do istniejącego modułu powtórek.
8. Logowanie zdarzeń
   - Zdarzenia: generacja, akceptacja, odrzucenie.
9. Walidacja danych wejściowych
   - Sprawdzenie długości tekstu (1000–10000 znaków) i długości pól fiszek.
10. Administracja i wdrożenie
   - Aplikacja konteneryzowana (Docker) do lokalnego developmentu. Wdroenie na Vercel.
   - Konfiguracja CI/CD z odseparowanymi środowiskami.

## 4. Granice produktu

- Nie wdrażamy własnego algorytmu powtórek (np. SuperMemo, Anki).
- Brak importu plików (.pdf, .docx, itp.).
- Brak współdzielenia zestawów fiszek między użytkownikami.
- Brak integracji z zewnętrznymi platformami edukacyjnymi.
- Aplikacja dostępna wyłącznie jako web, bez wersji mobilnej.
- Brak resetu hasła i weryfikacji email.

## 5. Historyjki użytkowników

- US-001: Rejestracja konta  
  Opis: Użytkownik tworzy nowe konto, podając email i hasło.  
  Kryteria akceptacji:  
  1. Podanie email i hasła spełniającego politykę (min. 8 znaków, litera i cyfra).  
  2. Po rejestracji użytkownik jest zalogowany i przekierowany do pulpitu.  
  3. Konto zapisane w bazie z zaszyfrowanym hasłem.

- US-002: Logowanie  
  Opis: Użytkownik loguje się przy użyciu email i hasła.  
  Kryteria akceptacji:  
  1. Poprawne dane → dostęp do pulpitu.  
  2. Niepoprawne dane → komunikat „Nieprawidłowy email lub hasło”.

- US-003: Wylogowanie  
  Opis: Użytkownik wylogowuje się z aplikacji.  
  Kryteria akceptacji:  
  1. Kliknięcie „Wyloguj” → powrót do ekranu logowania.  
  2. Próba dostępu do chronionych zasobów bez sesji → przekierowanie do logowania.

- US-004: Zmiana hasła  
  Opis: Zalogowany użytkownik zmienia swoje hasło.  
  Kryteria akceptacji:  
  1. Wprowadzenie aktualnego i nowego hasła.  
  2. Nowe hasło spełnia politykę złożoności.  
  3. Hasło zmienione, użytkownik otrzymuje potwierdzenie.

- US-005: Wprowadzenie tekstu źródłowego  
  Opis: Użytkownik wprowadza tekst o długości 1000–10000 znaków.  
  Kryteria akceptacji:  
  1. Tekst spoza zakresu → komunikat walidacyjny.  
  2. Tekst w zakresie → przycisk „Generuj fiszki” aktywny.

- US-006: Generowanie propozycji fiszek  
  Opis: Po zatwierdzeniu tekstu system wywołuje API AI i wyświetla kandydatów.  
  Kryteria akceptacji:  
  1. API zwraca listę kandydatów.  
  2. Lista wyświetlana z informacją o polach „przód” i „tył”.

- US-007: Przegląd kandydatów z paginacją  
  Opis: Użytkownik przegląda kandydatów w grupach po 20 pozycji.  
  Kryteria akceptacji:  
  1. Widocznych 20 pozycji na stronie.  
  2. Nawigacja między stronami zmienia zbiór widocznych kandydatów.

- US-008: Akceptacja propozycji  
  Opis: Użytkownik akceptuje wybraną fiszkę.  
  Kryteria akceptacji:  
  1. Kliknięcie „Akceptuj” → fiszka zapisana w bazie.  
  2. Fiszka znika z listy kandydatów.  
  3. Zdarzenie „zaakceptowana” zapisane w logach.

- US-009: Edycja propozycji  
  Opis: Użytkownik edytuje front i/lub back kandydata przed akceptacją.  
  Kryteria akceptacji:  
  1. Edycja pól i kliknięcie „Zapisz” → fiszka zapisana z nowymi danymi.  
  2. Zmodyfikowane pola wyświetlają się w bazie i w logach.

- US-010: Odrzucenie propozycji  
  Opis: Użytkownik odrzuca wybraną fiszkę.  
  Kryteria akceptacji:  
  1. Kliknięcie „Odrzuć” → fiszka usuwana z listy.  
  2. Zdarzenie „odrzucona” zapisane w logach.

- US-011: Ponowienie próby generowania  
  Opis: W przypadku błędu AI użytkownik może ponowić próbę.  
  Kryteria akceptacji:  
  1. Błąd API → wyświetlenie komunikatu.  
  2. Kliknięcie „Spróbuj ponownie” ponownie wywołuje API.

- US-012: Wyświetlanie zaakceptowanych fiszek  
  Opis: Użytkownik przegląda listę zapisanych fiszek.  
  Kryteria akceptacji:  
  1. Lista wszystkich zaakceptowanych fiszek.  
  2. Paginacja analogiczna do listy kandydatów.

- US-013: Edycja zapisanej fiszki  
  Opis: Użytkownik edytuje front/back istniejącej fiszki.  
  Kryteria akceptacji:  
  1. Zmiany zapisywane w bazie.  
  2. Aktualizacja widoczna w interfejsie.

- US-014: Usuwanie zapisanej fiszki  
  Opis: Użytkownik usuwa zapisane fiszki.  
  Kryteria akceptacji:  
  1. Kliknięcie „Usuń” → potwierdzenie akcji.  
  2. Fiszka usuwana z bazy i z listy.

- US-015: Ręczne tworzenie fiszki  
  Opis: Użytkownik dodaje nową fiszkę ręcznie.  
  Kryteria akceptacji:  
  1. Formularz z polami „przód” i „tył”.  
  2. Zapisanie fiszki w bazie i wyświetlenie na liście.

## 6. Metryki sukcesu

- ≥75% wygenerowanych przez AI fiszek zaakceptowanych przez użytkowników.  
- ≥75% wszystkich tworzonych fiszek pochodzi z generowania AI.  
- Monitorowanie KPI przez pipeline logowania zdarzeń. 