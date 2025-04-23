import GristApiAccess from "./gristApiAccess";
import "./globals.css";
import React from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GristApiAccess>{children}</GristApiAccess>
      </body>
    </html>
  );
}
