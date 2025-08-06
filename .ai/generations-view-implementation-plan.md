# Plan implementacji widoku: Generowanie Fiszek

## 1. Przegląd

Widok "Generowanie Fiszek" umożliwia użytkownikom wklejenie tekstu źródłowego, na podstawie którego sztuczna inteligencja generuje propozycje fiszek. Użytkownik może następnie przeglądać, edytować, akceptować lub odrzucać te propozycje (kandydatów). Zaakceptowane fiszki są zapisywane w systemie, a odrzucone są usuwane z listy kandydatów. Widok ten stanowi centralny punkt aplikacji dla tworzenia treści edukacyjnych z pomocą AI.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/generate`. Implementacja zostanie umieszczona w pliku `src/pages/generate/index.astro`. Główna logika interaktywna zostanie zrealizowana w komponencie Reactowym, ładowanym z opcją `client:load`.

## 3. Struktura komponentów

Hierarchia komponentów Reactowych, które zbudują interfejs widoku, będzie następująca:

```
- GenerateView.tsx (Główny komponent widoku)
  - SourceTextInput.tsx (Formularz do wprowadzania tekstu)
    - Textarea (shadcn/ui)
    - Button (shadcn/ui)
  - CandidateList.tsx (Lista kandydatów na fiszki)
    - Skeleton (shadcn/ui)
    - CandidateListItem.tsx (Pojedynczy kandydat na liście)
      - Button (shadcn/ui)
      - Button (shadcn/ui)
      - Button (shadcn/ui)
  - Pagination.tsx (Komponent paginacji z shadcn/ui)
  - EditFlashcardModal.tsx (Modal do edycji kandydata)
    - Dialog (shadcn/ui)
  - ConfirmActionDialog.tsx (Modal do potwierdzenia odrzucenia)
    - AlertDialog (shadcn/ui)
  - Toaster (sonner)
```

## 4. Szczegóły komponentów

### `GenerateView`

- **Opis komponentu:** Główny kontener zarządzający stanem całego widoku, logiką biznesową i komunikacją z API. Koordynuje działanie wszystkich komponentów podrzędnych.
- **Główne elementy:** Renderuje `SourceTextInput`, `CandidateList` oraz modale w zależności od stanu aplikacji.
- **Obsługiwane interakcje:** Przechwytuje zdarzenie generowania fiszek, akceptacji, edycji i odrzucenia kandydata, a następnie wywołuje odpowiednie akcje z customowego hooka.
- **Walidacja:** Brak walidacji na tym poziomie.
- **Typy:** `GenerationCandidateViewModel`, `GenerationDetailDto`.
- **Propsy:** Brak.

### `SourceTextInput`

- **Opis komponentu:** Formularz z polem `Textarea` na tekst źródłowy oraz przyciskiem "Generuj fiszki".
- **Główne elementy:** `Textarea`, `Button` i licznik znaków.
- **Obsługiwane interakcje:** Wprowadzanie tekstu, kliknięcie przycisku "Generuj".
- **Obsługiwana walidacja:**
  - Długość tekstu musi zawierać się w przedziale [1000, 10000] znaków.
  - Przycisk "Generuj" jest nieaktywny, jeśli warunek nie jest spełniony.
- **Typy:** `(text: string) => void`.
- **Propsy:**
  - `sourceText: string`
  - `onSourceTextChange: (text: string) => void`
  - `onSubmit: () => void`
  - `isLoading: boolean`
  - `charCount: number`
  - `isValid: boolean`

### `CandidateList`

- **Opis komponentu:** Wyświetla listę kandydatów na fiszki. Obsługuje stan ładowania (za pomocą `Skeleton`) oraz stan pusty.
- **Główne elementy:** Kontener listy, komponent `CandidateListItem` renderowany w pętli.
- **Obsługiwane interakcje:** Przekazuje zdarzenia `onAccept`, `onEdit`, `onReject` od `CandidateListItem` do `GenerateView`.
- **Walidacja:** Brak.
- **Typy:** `GenerationCandidateViewModel[]`.
- **Propsy:**
  - `candidates: GenerationCandidateViewModel[]`
  - `onAccept: (candidateId: string) => void`
  - `onEdit: (candidateId:string) => void`
  - `onReject: (candidateId: string) => void`

### `EditFlashcardModal`

- **Opis komponentu:** Modal pozwalający na edycję pól `front` i `back` kandydata przed jego akceptacją.
- **Główne elementy:** `Dialog`, dwa pola `Input`/`Textarea`, przyciski "Zapisz" i "Anuluj".
- **Obsługiwane interakcje:** Zapisanie zmian w kandydacie.
- **Obsługiwana walidacja:**
  - `front`: niepusty, maksymalnie 200 znaków.
  - `back`: niepusty, maksymalnie 500 znaków.
  - Przycisk "Zapisz" jest nieaktywny, jeśli walidacja się nie powiodła.
- **Typy:** `GenerationCandidateViewModel`.
- **Propsy:**
  - `isOpen: boolean`
  - `onOpenChange: (isOpen: boolean) => void`
  - `candidate: GenerationCandidateViewModel | null`
  - `onSave: (updatedCandidate: GenerationCandidateViewModel) => void`

## 5. Typy

Do implementacji widoku, oprócz typów DTO z `src/types.ts`, wymagany będzie nowy typ `ViewModel` do zarządzania stanem na froncie.

- **`GenerationCandidateViewModel`**
  - Opis: Reprezentuje pojedynczego kandydata na fiszkę w interfejsie użytkownika. Rozszerza DTO o pola potrzebne do zarządzania stanem UI.
  - Pola:
    - `candidateId: string` - Identyfikator kandydata z API.
    - `front: string` - Treść przodu fiszki.
    - `back: string` - Treść tyłu fiszki.
    - `source: 'ai-full' | 'ai-edited'` - Flaga określająca, czy kandydat został zmodyfikowany przez użytkownika. Domyślnie `'ai-full'`.
    - `status: 'idle' | 'saving' | 'deleting'` - Status operacji asynchronicznej na danym elemencie. Domyślnie `'idle'`.

## 6. Zarządzanie stanem

Cała logika i stan widoku zostaną zamknięte w customowym hooku `useGeneration`, aby oddzielić logikę od prezentacji i ułatwić zarządzanie.

- **`useGeneration()` hook:**
  - **Stan wewnętrzny:**
    - `status: 'idle' | 'loading' | 'success' | 'error'` - Globalny stan procesu generowania.
    - `sourceText: string` - Aktualna zawartość pola tekstowego.
    - `generationDetails: GenerationDetailDto | null` - Metadane sesji generowania zwrócone z API.
    - `candidates: GenerationCandidateViewModel[]` - Pełna lista kandydatów pobrana z API.
    - `pagination: { currentPage: number, pageSize: number }` - Stan dla paginacji po stronie klienta.
  - **Akcje (funkcje zwracane przez hooka):**
    - `handleGenerate()`: Inicjuje proces generowania fiszek.
    - `handleAccept(candidateId)`: Akceptuje kandydata, wysyła go do API i usuwa z lokalnej listy.
    - `handleEdit(updatedCandidate)`: Zapisuje edytowanego kandydata.
    - `handleReject(candidateId)`: Odrzuca kandydata (usuwa go z lokalnej listy).
    - `setPage(pageNumber)`: Zmienia stronę w paginacji.
  - **Wartości pochodne (Memoized):**
    - `paginatedCandidates`: Obliczona na podstawie `candidates` i `pagination`, widoczna część listy kandydatów.
    - `isValidSourceText`: Flaga `boolean` określająca, czy `sourceText` ma prawidłową długość.

## 7. Integracja API

- **Generowanie kandydatów:**

  - **Endpoint:** `POST /api/generations`
  - **Akcja:** Wywoływana po kliknięciu "Generuj fiszki".
  - **Typy żądania:** `CreateGenerationCommand` (`{ sourceText: string }`)
  - **Typy odpowiedzi:** `CreateGenerationResponseDto` (`{ generation, candidates }`)
  - **Logika:** Po pomyślnej odpowiedzi, lista kandydatów (`candidates`) jest mapowana na `GenerationCandidateViewModel[]` i zapisywana w stanie hooka `useGeneration`.

- **Akceptacja kandydata:**
  - **Endpoint:** `POST /api/flashcards`
  - **Akcja:** Wywoływana po kliknięciu "Akceptuj" lub "Zapisz" w modalu edycji.
  - **Typy żądania:** `BulkCreateFlashcardsCommand` (`CreateFlashcardCommand[]` - tablica z jednym elementem)
  - **Typy odpowiedzi:** `BulkCreateFlashcardsResponseDto`
  - **Logika:** Na podstawie `candidateId` i `generationId` tworzony jest `CreateFlashcardCommand`. Po pomyślnym zapisie, kandydat jest usuwany z lokalnego stanu `candidates`.

## 8. Interakcje użytkownika

- **Użytkownik wprowadza tekst:** Aktualizuje się licznik znaków; przycisk "Generuj" staje się aktywny/nieaktywny.
- **Użytkownik klika "Generuj fiszki":** Formularz staje się nieaktywny, a w miejscu listy kandydatów pojawia się `Skeleton loader`.
- **Użytkownik klika "Akceptuj":** Na przycisku pojawia się wskaźnik ładowania; po sukcesie kandydat znika z listy i pojawia się `Toast` z potwierdzeniem.
- **Użytkownik klika "Edytuj":** Otwiera się `EditFlashcardModal` z danymi kandydata.
- **Użytkownik klika "Odrzuć":** Otwiera się `ConfirmActionDialog`. Po potwierdzeniu, kandydat znika z listy i pojawia się `Toast`.
- **Użytkownik nawiguje po stronach:** Lista kandydatów jest aktualizowana, aby pokazać odpowiedni fragment.

## 9. Warunki i walidacja

- **Długość tekstu źródłowego:** Weryfikowana w `SourceTextInput`. Długość musi wynosić od 1000 do 10000 znaków. Wpływa na atrybut `disabled` przycisku "Generuj".
- **Długość pól fiszki:** Weryfikowana w `EditFlashcardModal`. `front` do 200 znaków, `back` do 500. Wpływa na atrybut `disabled` przycisku "Zapisz".
- **Pusta lista kandydatów:** Jeśli API zwróci pustą tablicę `candidates`, interfejs wyświetli stosowny komunikat.

## 10. Obsługa błędów

- **Błąd generowania (`POST /api/generations`):**
  - **Scenariusze:** Błąd walidacji (400), błąd serwera AI (502), błąd sieci.
  - **Obsługa:** W UI wyświetlany jest komunikat błędu z przyciskiem "Spróbuj ponownie". Dodatkowo, `Toast` informuje o niepowodzeniu. Formularz wejściowy staje się ponownie aktywny.
- **Błąd akceptacji (`POST /api/flashcards`):**
  - **Scenariusze:** Błąd walidacji (400), błąd serwera.
  - **Obsługa:** Stan ładowania na przycisku "Akceptuj" jest usuwany. `Toast` informuje o błędzie. Kandydat pozostaje na liście, aby użytkownik mógł spróbować ponownie.
- **Odrzucenie kandydata:** Wymaga potwierdzenia w `ConfirmActionDialog`, aby zapobiec przypadkowej utracie propozycji.

## 11. Kroki implementacji

1.  Utworzenie pliku `src/pages/generate/index.astro` i osadzenie w nim głównego komponentu React `GenerateView.tsx` z `client:load`.
2.  Zdefiniowanie typu `GenerationCandidateViewModel` oraz szkieletu hooka `useGeneration`.
3.  Implementacja komponentu `SourceTextInput` wraz z logiką walidacji długości tekstu.
4.  Implementacja komponentów `CandidateList` i `CandidateListItem` do wyświetlania statycznej listy kandydatów.
5.  Połączenie `SourceTextInput` z hookiem `useGeneration` w celu wywołania `POST /api/generations` i wyświetlenia wyników w `CandidateList`. Zaimplementowanie stanu ładowania (`Skeleton`) i obsługi błędów.
6.  Implementacja paginacji po stronie klienta z użyciem komponentu `Pagination` i logiki w `useGeneration`.
7.  Implementacja akcji "Akceptuj", w tym wywołanie `POST /api/flashcards` i usunięcie elementu z listy po sukcesie.
8.  Implementacja modala `EditFlashcardModal` oraz logiki edycji kandydata w hooku `useGeneration`.
9.  Implementacja akcji "Odrzuć" z użyciem `ConfirmActionDialog` do potwierdzenia.
10. Dodanie `Toastów` (powiadomień) dla wszystkich kluczowych akcji (sukces, błąd).
11. Finalny przegląd kodu pod kątem UX, dostępności (focus management w modalach) i czystości kodu.
