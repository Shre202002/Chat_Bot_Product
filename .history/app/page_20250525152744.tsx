// app/page.tsx
import MuseumChatbot from "@/components/MuseumChatbot.tsx" // adjust path as needed

export default function HomePage() {
  return (
    <main>
      <h1>Welcome to the Museum Website</h1>
      {/* other page content */}

      {/* Chatbot Widget */}
      <MuseumChatbot />
    </main>
  )
}
