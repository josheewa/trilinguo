import { ClerkProvider } from '@clerk/nextjs'
import '@/styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Head>
        <title>Trilinguo</title>
        <meta name="description" content="Trilinguo is a chat duolingo app." />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, height=device-height, interactive-widget=resizes-content, viewport-fit=cover"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <Component {...pageProps} />
    </ClerkProvider>
  )
}
