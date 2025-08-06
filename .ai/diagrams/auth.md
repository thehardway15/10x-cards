<authentication_analysis>

1.  **Przepływy autentykacji:**

    - **Rejestracja użytkownika:** Nowy użytkownik tworzy konto za pomocą adresu e-mail i hasła. Po pomyślnej rejestracji jest automatycznie logowany i przekierowywany na chronioną stronę.
    - **Logowanie użytkownika:** Zarejestrowany użytkownik loguje się przy użyciu swoich poświadczeń. Po pomyślnym zalogowaniu uzyskuje dostęp do chronionych zasobów.
    - **Wylogowanie użytkownika:** Zalogowany użytkownik kończy swoją sesję, co powoduje unieważnienie jego tokenów i przekierowanie na stronę logowania.
    - **Zmiana hasła:** Zalogowany użytkownik może zmienić swoje hasło po podaniu aktualnego.
    - **Ochrona tras:** System uniemożliwia niezalogowanym użytkownikom dostęp do chronionych stron (np. `/generate`, `/account`) poprzez przekierowanie ich na stronę logowania.
    - **Zarządzanie sesją i odświeżanie tokenu:** Sesja jest zarządzana za pomocą ciasteczek (cookies). Biblioteka Supabase (`@supabase/ssr`) automatycznie obsługuje odświeżanie wygasłych tokenów dostępowych, o ile istnieje ważny token odświeżający.

2.  **Główni aktorzy i ich interakcje:**

    - **Przeglądarka (Browser):** Reprezentuje klienta użytkownika. Inicjuje żądania rejestracji, logowania, wylogowania oraz dostępu do stron. Renderuje komponenty UI (React) i strony (Astro). Przechowuje sesję w ciasteczkach.
    - **Middleware (Astro Middleware):** Działa jako strażnik dla chronionych tras. Przechwytuje każde żądanie, weryfikuje sesję użytkownika na podstawie ciasteczek przy pomocy Supabase Auth i decyduje, czy zezwolić na dostęp, czy przekierować do strony logowania.
    - **Astro API (API Endpoints):** Zestaw endpointów (`/api/auth/*`) odpowiedzialnych za obsługę logiki biznesowej autentykacji. Komunikuje się z Supabase Auth w celu wykonania operacji takich jak `signUp`, `signInWithPassword`, `signOut`.
    - **Supabase Auth:** Zewnętrzna usługa odpowiedzialna za bezpieczne przechowywanie danych użytkowników, zarządzanie poświadczeniami, tworzenie i weryfikację tokenów (JWT) oraz zarządzanie cyklem życia sesji.

3.  **Procesy weryfikacji i odświeżania tokenów:**

    - **Weryfikacja:** Przy każdym żądaniu do chronionej trasy, `Middleware` używa biblioteki Supabase do weryfikacji tokenu JWT zapisanego w ciasteczku. Odbywa się to poprzez wywołanie `supabase.auth.getUser()`.
    - **Odświeżanie:** Gdy token dostępowy (krótkożyjący) wygaśnie, biblioteka `@supabase/ssr` automatycznie używa tokenu odświeżającego (długożyjącego), również przechowywanego w ciasteczku, aby uzyskać nowy token dostępowy od Supabase Auth. Ten proces jest transparentny dla użytkownika i zapewnia ciągłość sesji.

4.  **Opis kroków autentykacji:**
    _ **Logowanie/Rejestracja:** Użytkownik wypełnia formularz w `Przeglądarce`. Żądanie POST jest wysyłane do `Astro API`. API wywołuje odpowiednią metodę `Supabase Auth`. Supabase weryfikuje dane, tworzy sesję i ustawia w odpowiedzi nagłówek `Set-Cookie` z tokenami. Przeglądarka zapisuje ciasteczka.
    _ **Dostęp do chronionej strony:** `Przeglądarka` wysyła żądanie GET (np. do `/generate`) wraz z ciasteczkami sesji. `Middleware` przechwytuje żądanie, odczytuje token i prosi `Supabase Auth` o jego weryfikację. Jeśli token jest ważny, żądanie jest przepuszczane dalej. Jeśli jest nieważny (lub go nie ma), `Middleware` zwraca przekierowanie (302) do strony logowania. \* **Wylogowanie:** `Przeglądarka` wysyła żądanie POST do endpointu wylogowania. `Astro API` wywołuje `supabase.auth.signOut()`, co unieważnia tokeny. `Supabase Auth` instruuje przeglądarkę (przez `Set-Cookie`) do usunięcia ciasteczek sesji. Użytkownik jest przekierowywany.
    </authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber

    participant Przeglądarka
    participant Middleware
    participant Astro API
    participant Supabase Auth

    alt Rejestracja lub Logowanie Użytkownika

        Przeglądarka->>+Astro API: POST /api/auth/login lub /register (z danymi)
        Astro API->>+Supabase Auth: signInWithPassword() lub signUp()
        Supabase Auth-->>-Astro API: Sukces, dane sesji (tokeny)
        Astro API-->>-Przeglądarka: Odpowiedź 200 OK + Set-Cookie (ciasteczko sesji)

        Note over Przeglądarka, Supabase Auth: Przeglądarka przechowuje ciasteczko sesji.<br/>Następuje przekierowanie do chronionej strony /generate.

    else Błędne dane logowania
        Przeglądarka->>+Astro API: POST /api/auth/login (z błędnymi danymi)
        Astro API->>+Supabase Auth: signInWithPassword()
        Supabase Auth-->>-Astro API: Błąd autentykacji
        Astro API-->>-Przeglądarka: Odpowiedź 401 Unauthorized (błąd w UI)
    end

    par Dostęp do chronionej strony

        Przeglądarka->>+Middleware: GET /generate (z ciasteczkiem sesji)
        Middleware->>+Supabase Auth: Weryfikuj sesję na podstawie tokenu z ciasteczka

        alt Sesja jest ważna
            Supabase Auth-->>-Middleware: Sesja prawidłowa, dane użytkownika
            Middleware-->>Przeglądarka: Zwraca stronę /generate (200 OK)
        else Sesja nieważna lub brak sesji
            Supabase Auth-->>-Middleware: Sesja nieprawidłowa
            Middleware-->>-Przeglądarka: Przekierowanie (302) na /login
        end
        deactivate Middleware
        deactivate Supabase Auth

    and Odświeżanie tokenu (niejawne)
        Note right of Middleware: Jeśli token dostępowy wygasł,<br/>Supabase SSR automatycznie<br/>użyje tokenu odświeżającego,<br/>aby uzyskać nowy.
    end

    alt Wylogowanie

        Przeglądarka->>+Astro API: POST /api/auth/logout
        Astro API->>+Supabase Auth: signOut()
        Supabase Auth-->>-Astro API: Sesja unieważniona
        Astro API-->>-Przeglądarka: Odpowiedź 200 OK + Set-Cookie (usuwa ciasteczko)<br/>Przekierowanie na /login
        deactivate Astro API
        deactivate Supabase Auth
    end
```

</mermaid_diagram>
