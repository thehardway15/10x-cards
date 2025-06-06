# FlashAI

A web application that enables users to quickly create, review, and manage educational flashcards using AI-powered generation and traditional manual methods.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

FlashAI addresses the time-consuming and monotonous process of manually creating high-quality flashcards. The application provides:

- **AI-Powered Generation**: Convert text (1,000-10,000 characters) into flashcard candidates using advanced AI models
- **Review & Management**: Review, edit, accept, or reject AI-generated flashcard candidates with pagination support
- **Manual Creation**: Traditional CRUD operations for manual flashcard creation and management
- **User Authentication**: Simple email/password-based user accounts without email verification
- **Spaced Repetition Integration**: Export accepted flashcards to existing spaced repetition algorithms
- **Error Handling**: Robust retry logic for AI API failures
- **Activity Logging**: Comprehensive event logging for KPI measurement

### Success Metrics
- ≥75% of AI-generated flashcards accepted by users
- ≥75% of all created flashcards originate from AI generation

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient web application framework with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing and improved IDE support
- **Tailwind 4** - Utility-first CSS framework
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Complete backend-as-a-service solution
  - PostgreSQL database
  - Built-in user authentication
  - Multi-language SDK support

### AI Integration
- **Openrouter.ai** - Access to multiple AI models (OpenAI, Anthropic, Google)
  - Cost-effective model selection
  - Financial limit controls

### Development & Deployment
- **GitHub Actions** - CI/CD pipelines
- **Docker** - Containerization for deployment
- **Vercel** - Production hosting

## Getting Started Locally

### Prerequisites
- Node.js 22.14.0 (check `.nvmrc` file)
- npm or yarn package manager
- Supabase account and project
- Openrouter.ai API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thehardway15/10x-cards
   cd flashai
   ```

2. **Install Node.js version**
   ```bash
   nvm use
   # or
   nvm install 22.14.0 && nvm use 22.14.0
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Environment Setup**
   Create a `.env` file in the root directory with:
   ```env
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # AI Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Application Configuration
   PUBLIC_APP_URL=http://localhost:4321
   ```

5. **Database Setup**
   - Set up your Supabase project
   - Create necessary tables for users, flashcards, and logging
   - Configure authentication settings

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:4321`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and automatically fix issues |
| `npm run format` | Format code using Prettier |

## Project Scope

### Core Features
✅ **AI Flashcard Generation**
- Text input validation (1,000-10,000 characters)
- AI-powered candidate generation
- Paginated candidate review (20 items per page)
- Accept, edit, or reject workflow

✅ **Manual Flashcard Management**
- Create, read, update, delete operations
- Front/back field validation (≤200/≤500 characters)
- User-specific flashcard collections

✅ **User Management**
- Email/password registration and authentication
- Password change functionality
- Session management

✅ **System Features**
- Error handling and retry logic for AI failures
- Event logging for KPI measurement
- Spaced repetition algorithm integration

### Explicit Limitations
❌ **Out of Scope**
- Custom spaced repetition algorithms (e.g., SuperMemo, Anki)
- File imports (.pdf, .docx, etc.)
- Flashcard sharing between users
- External educational platform integrations
- Mobile application versions
- Password reset functionality
- Email verification

## Project Status

🚧 **In Development**

This project is currently in active development based on the Product Requirements Document. The application is being built with a focus on:

- Clean, maintainable code architecture
- Comprehensive error handling and edge cases
- User-friendly interfaces and experiences
- Scalable backend infrastructure
- Measurable KPI tracking

### Development Priorities
1. Core AI generation workflow
2. User authentication system
3. Flashcard management interface
4. Spaced repetition integration
5. Deployment and CI/CD pipeline

## License

This project's license information is not currently specified. Please check with the project maintainers for licensing details.
