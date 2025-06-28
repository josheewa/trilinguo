import '@/styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Trilinguo</title>
        <meta name="description" content="Trilinguo is a chat duolingo app." />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, height=device-height, interactive-widget=resizes-content"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
