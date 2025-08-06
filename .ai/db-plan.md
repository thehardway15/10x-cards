# Schemat bazy danych PostgreSQL - FlashAI

## 1. Typy ENUM

```sql
-- Typ źródła fiszki
CREATE TYPE flashcard_source AS ENUM ('ai-full', 'ai-edited', 'manual');
```

## 2. Tabele

### 2.1 auth.users (zarządzana przez Supabase)

Tabela użytkowników jest zarządzana przez system Supabase Auth i zawiera standardowe pola takie jak:

- `id` (UUID) - klucz główny
- `email` (TEXT) - email użytkownika
- `encrypted_password` (TEXT) - zaszyfrowane hasło
- `created_at` (TIMESTAMP) - data utworzenia
- `updated_at` (TIMESTAMP) - data ostatniej aktualizacji

### 2.2 flashcards (Fiszki użytkowników)

```sql
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_id UUID NULL REFERENCES generations(id) ON DELETE SET NULL,
    front VARCHAR(200) NOT NULL CHECK (length(front) >= 1),
    back VARCHAR(500) NOT NULL CHECK (length(back) >= 1),
    source flashcard_source NOT NULL DEFAULT 'manual',
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT check_deleted_consistency
        CHECK ((is_deleted = true AND deleted_at IS NOT NULL) OR
               (is_deleted = false AND deleted_at IS NULL)),
    CONSTRAINT check_generation_source_consistency
        CHECK ((source = 'manual' AND generation_id IS NULL) OR
               (source IN ('ai-full', 'ai-edited') AND generation_id IS NOT NULL))
);
```

### 2.3 generations (Statystyki generowania AI)

```sql
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR(60) NOT NULL,
    generated_count INTEGER NOT NULL CHECK (generated_count >= 0),
    accepted_unedited_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_unedited_count >= 0),
    accepted_edited_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_edited_count >= 0),
    source_text_hash CHAR(64) NOT NULL, -- SHA-256 hash
    source_text_length INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT check_accepted_counts
        CHECK (accepted_unedited_count + accepted_edited_count <= generated_count)
);
```

### 2.4 generation_error_logs (Logi błędów AI)

```sql
CREATE TABLE generation_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR(60) NOT NULL,
    source_text_hash CHAR(64) NOT NULL, -- SHA-256 hash
    source_text_length INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000),
    error_code VARCHAR(60) NOT NULL,
    error_message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

## 3. Relacje między tabelami

### 3.1 Kardynalność relacji

- **auth.users → flashcards**: 1:N (jeden użytkownik może mieć wiele fiszek)
- **auth.users → generations**: 1:N (jeden użytkownik może mieć wiele sesji generowania)
- **auth.users → generation_error_logs**: 1:N (jeden użytkownik może mieć wiele błędów)
- **generations → flashcards**: 1:N (jedna sesja generowania może utworzyć wiele fiszek)

### 3.2 Klucze obce

- Wszystkie tabele użytkowników mają relację foreign key do `auth.users(id)` przez pole `user_id` z opcją `ON DELETE CASCADE`
- Tabela `flashcards` ma opcjonalną relację foreign key do `generations(id)` przez pole `generation_id` z opcją `ON DELETE SET NULL`

## 4. Indeksy

```sql
-- Indeks dla aktywnych fiszek użytkownika (partial index)
CREATE INDEX idx_flashcards_active
ON flashcards (user_id, created_at DESC)
WHERE is_deleted = false;

-- Indeks dla wszystkich fiszek użytkownika
CREATE INDEX idx_flashcards_user_id
ON flashcards (user_id);

-- Indeks dla fiszek z konkretnej sesji generowania
CREATE INDEX idx_flashcards_generation_id
ON flashcards (generation_id)
WHERE generation_id IS NOT NULL;

-- Indeks dla generacji użytkownika
CREATE INDEX idx_generations_user_id
ON generations (user_id, created_at DESC);

-- Indeks dla logów błędów użytkownika
CREATE INDEX idx_generation_error_logs_user_id
ON generation_error_logs (user_id, created_at DESC);

-- Indeks dla wyszukiwania po hash tekstu źródłowego
CREATE INDEX idx_generations_source_hash
ON generations (source_text_hash);
```

## 5. Funkcje i triggery

### 5.1 Funkcja aktualizacji updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 5.2 Triggery dla automatycznej aktualizacji updated_at

```sql
-- Trigger dla tabeli flashcards
CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla tabeli generations
CREATE TRIGGER update_generations_updated_at
    BEFORE UPDATE ON generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla tabeli generation_error_logs
CREATE TRIGGER update_generation_error_logs_updated_at
    BEFORE UPDATE ON generation_error_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 6. Row Level Security (RLS)

### 6.1 Włączenie RLS

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

### 6.2 Polityki RLS

```sql
-- Polityki dla flashcards
CREATE POLICY "Users can view own flashcards" ON flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla generations
CREATE POLICY "Users can view own generations" ON generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON generations
    FOR UPDATE USING (auth.uid() = user_id);

-- Polityki dla generation_error_logs
CREATE POLICY "Users can view own error logs" ON generation_error_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own error logs" ON generation_error_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 7. Dodatkowe uwagi i decyzje projektowe

### 7.1 Soft Delete

- Tabela `flashcards` implementuje soft delete przez pola `is_deleted` i `deleted_at`
- Constraint zapewnia konsystencję: jeśli `is_deleted = true`, to `deleted_at` musi być ustawione
- Partial index `idx_flashcards_active` optymalizuje zapytania o aktywne fiszki

### 7.2 Hashowanie tekstu źródłowego

- Używany algorytm SHA-256 (64 znaki hex)
- Hash przechowywany w polach `source_text_hash` dla identyfikacji bez przechowywania pełnego tekstu
- Tekst źródłowy nie jest przechowywany w bazie danych (tylko w logach aplikacji)

### 7.3 Ograniczenia długości pól

- `front` fiszki: maksymalnie 200 znaków (zgodnie z PRD)
- `back` fiszki: maksymalnie 500 znaków (zgodnie z PRD)
- `model`: maksymalnie 60 znaków
- `error_code`: maksymalnie 60 znaków
- `error_message`: maksymalnie 500 znaków

### 7.4 Walidacja danych

- CHECK constraints dla długości tekstu źródłowego (1000-10000 znaków)
- CHECK constraints dla liczników w tabeli `generations`
- Walidacja spójności dla soft delete

### 7.5 Bezpieczeństwo

- Wszystkie tabele chronione przez RLS
- Użytkownicy mają dostęp tylko do własnych danych
- Foreign keys z `ON DELETE CASCADE` dla automatycznego czyszczenia danych użytkownika

### 7.6 Wydajność

- Partial indexing dla aktywnych fiszek
- Indeksy na foreign keys i często używane pola
- UUID jako klucze główne dla lepszego bezpieczeństwa
- Automatyczne timestampy z triggerami PostgreSQL

### 7.7 Skalowalność

- Struktura przygotowana pod małą aplikację z możliwością rozszerzenia
- Możliwość dodania indeksów w przyszłości (np. na `source_text_hash`)
- Elastyczny typ ENUM dla źródeł fiszek umożliwia dodanie nowych opcji

### 7.8 Relacja generations → flashcards

- Pole `generation_id` w tabeli `flashcards` jest opcjonalne (NULL)
- Fiszki tworzone ręcznie (`source = 'manual'`) mają `generation_id = NULL`
- Fiszki generowane przez AI (`source IN ('ai-full', 'ai-edited')`) muszą mieć `generation_id`
- Constraint `check_generation_source_consistency` zapewnia spójność między polami `source` i `generation_id`
- Przy usunięciu sesji generowania (`generations`), powiązane fiszki zachowują się (`ON DELETE SET NULL`)
- Partial index na `generation_id` optymalizuje zapytania o fiszki z konkretnej sesji generowania
