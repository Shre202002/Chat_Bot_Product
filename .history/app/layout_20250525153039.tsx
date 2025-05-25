// app/layout.tsx
export const metadata = {
  title: 'Chatbot Widget',
  description: 'Embeddable museum chatbot widget',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
