# Trilinguo

A trilingual chat application that helps users practice Chinese through AI conversations. Features Chinese characters with pinyin pronunciation guides and English translations.

## Features

- AI-powered Chinese conversation practice
- Pinyin pronunciation guides
- English translations
- Responsive design
- Secure authentication with Clerk
- Multi-language support (Chinese, Japanese, Korean, French)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

## Authentication

This app uses [Clerk](https://clerk.com) for secure user authentication. Users can sign up and sign in using email or social providers.

## Environment Variables

Make sure to set up your Clerk environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

You can get these keys from your [Clerk Dashboard](https://dashboard.clerk.com).
