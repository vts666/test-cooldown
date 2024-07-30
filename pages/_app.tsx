// pages/_app.tsx
import { Fragment } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import React from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

function App({ Component, pageProps }) {
  return (
    <Fragment>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <Component {...pageProps} />
    </Fragment>
  );
}

export default App;
