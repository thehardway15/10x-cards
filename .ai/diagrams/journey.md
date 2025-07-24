<user_journey_analysis>
1.  **User Paths from Reference Files:**
    *   **Unauthenticated User:**
        *   Visits the application and is directed to the login page (`/login`).
        *   Navigates to the registration page (`/register`) from the login page.
        *   Attempts to access a protected route (e.g., `/generate`) and is redirected to `/login`.
    *   **Registration:**
        *   Fills out the registration form (email, password, password confirmation).
        *   On success, is automatically logged in and redirected to the main application view (`/generate`).
        *   On error (e.g., user exists, weak password), an error message is displayed.
    *   **Login:**
        *   Fills out the login form (email, password).
        *   On success, is redirected to `/generate`.
        *   On error (invalid credentials), an error message is displayed.
    *   **Authenticated User:**
        *   Uses the core application feature (`/generate`).
        *   Navigates to the account management page (`/account`).
        *   Changes their password on the `/account` page.
        *   Logs out, which terminates the session and redirects to `/login`.

2.  **Main Journeys and Corresponding States:**
    *   **Guest Journey (Unauthenticated):**
        *   Initial State: Enters the app.
        *   States: `LoginPage`, `RegisterPage`.
        *   End State: Becomes an authenticated user or leaves.
    *   **Registration Journey:**
        *   Initial State: `RegisterPage`.
        *   States: `RegistrationForm`, `DataValidation`, `AccountCreation`, `AutoLogin`.
        *   End State: `AppDashboard` (authenticated).
    *   **Login Journey:**
        *   Initial State: `LoginPage`.
        *   States: `LoginForm`, `CredentialVerification`.
        *   End State: `AppDashboard` (authenticated).
    *   **Authenticated User Journey:**
        *   Initial State: `AppDashboard`.
        *   States: `FlashcardGeneration`, `AccountManagement`, `PasswordChange`, `Logout`.
        *   End State: Becomes a guest (after logout).

3.  **Decision Points and Alternative Paths:**
    *   **App Entry:** Is there an active session?
        *   Yes -> Go to `AppDashboard`.
        *   No -> Go to `LoginPage`.
    *   **On Login Page:** Does the user have an account?
        *   Yes -> Fills login form.
        *   No -> Clicks link to `RegisterPage`.
    *   **Credential Verification:** Are credentials valid?
        *   Yes -> Log in and go to `AppDashboard`.
        *   No -> Show error on `LoginPage`.
    *   **Registration Validation:** Is the data valid (format, password policy)?
        *   Yes -> Attempt account creation.
        *   No -> Show error on `RegisterPage`.
    *   **Account Creation:** Does the user already exist?
        *   No -> Create account, log in, go to `AppDashboard`.
        *   Yes -> Show "user exists" error on `RegisterPage`.
    *   **Logout:** User clicks the "Logout" button.
        *   Always ends the session and redirects to `LoginPage`.

4.  **Brief Description of Each State's Purpose:**
    *   **[*] (Start/End):** Represents the user entering or leaving the application.
    *   **LoginPage:** The page where a user can enter their credentials to log in.
    *   **RegisterPage:** The page where a new user can create an account.
    *   **AppDashboard:** The main application view after login (`/generate`), where core features are accessible.
    *   **UserAccount:** The `/account` page for managing account details.
    *   **DataValidation:** A logical state for checking the correctness of form inputs.
    *   **Decision (choice):** Points where the system makes a decision based on a condition (e.g., data validity, session existence).
</user_journey_analysis>

<mermaid_diagram>
```mermaid
stateDiagram-v2
    direction LR
    [*] --> WejscieDoAplikacji

    state WejscieDoAplikacji {
        note right of WejscieDoAplikacji
            System sprawdza, czy użytkownik
            posiada aktywną sesję w przeglądarce.
        end note
        [*] --> SprawdzenieSesji
        state if_sesja <<choice>>
        SprawdzenieSesji --> if_sesja: Czy sesja istnieje?
        if_sesja --> PanelAplikacji: Tak
        if_sesja --> StrefaPubliczna: Nie
    }

    state StrefaPubliczna {
        direction TD
        StronaLogowania: Użytkownik podaje email i hasło
        StronaRejestracji: Użytkownik tworzy nowe konto

        [*] --> StronaLogowania
        StronaLogowania --> StronaRejestracji: Nie masz konta?
        StronaRejestracji --> StronaLogowania: Masz już konto?

        StronaLogowania --> ProcesLogowania: Zaloguj
        StronaRejestracji --> ProcesRejestracji: Zarejestruj
    }

    state ProcesLogowania {
        [*] --> WeryfikacjaDanychLogowania
        state if_dane_logowania_poprawne <<choice>>
        WeryfikacjaDanychLogowania --> if_dane_logowania_poprawne: Dane poprawne?
        if_dane_logowania_poprawne --> PanelAplikacji: Tak
        if_dane_logowania_poprawne --> StronaLogowania: Nie, pokaż błąd
    }

    state ProcesRejestracji {
        [*] --> WeryfikacjaDanychRejestracji
        state if_dane_rejestracji_poprawne <<choice>>
        WeryfikacjaDanychRejestracji --> if_dane_rejestracji_poprawne: Dane zgodne z polityką?
        if_dane_rejestracji_poprawne --> TworzenieKonta: Tak
        if_dane_rejestracji_poprawne --> StronaRejestracji: Nie, pokaż błąd walidacji

        state if_uzytkownik_istnieje <<choice>>
        TworzenieKonta --> if_uzytkownik_istnieje: Czy email jest w bazie?
        if_uzytkownik_istnieje --> StronaRejestracji: Tak, pokaż błąd
        if_uzytkownik_istnieje --> PanelAplikacji: Nie, utwórz konto i zaloguj
    }

    state PanelAplikacji {
        direction TD
        note left of PanelAplikacji
            Główny obszar aplikacji
            dostępny tylko dla zalogowanych.
            Domyślny widok to /generate.
        end note
        [*] --> GeneratorFiszek
        GeneratorFiszek --> MojeFiszki
        MojeFiszki --> GeneratorFiszek
        
        PanelAplikacji --> MojeKonto: Zarządzaj kontem
        PanelAplikacji --> Wylogowanie: Wyloguj
    }
    
    state MojeKonto {
      [*] --> ZmianaHasla
      ZmianaHasla --> PanelAplikacji: Zapisz zmiany
    }

    Wylogowanie --> [*]
```
</mermaid_diagram> 