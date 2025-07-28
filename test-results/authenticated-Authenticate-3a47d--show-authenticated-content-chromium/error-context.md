# Page snapshot

```yaml
- banner:
  - link "FlashAI":
    - /url: /
  - link "Sign in":
    - /url: /login
    - button "Sign in"
  - link "Sign up":
    - /url: /register
    - button "Sign up"
- main:
  - heading "Welcome to FlashAI" [level=1]
  - paragraph: Create effective flashcards with the power of AI
  - heading "Welcome back" [level=1]
  - paragraph: Enter your email to sign in to your account
  - text: Email
  - textbox "Email"
  - text: Password
  - textbox "Password"
  - button "Sign in"
  - paragraph:
    - text: Don't have an account?
    - link "Sign up":
      - /url: /register
- region "Notifications alt+T"
```