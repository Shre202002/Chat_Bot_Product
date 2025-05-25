// app/page.tsx
import Widget from './widget';

export default function Home() {
  return (
    <main>
      <h1>Welcome to my site</h1>
      <Widget /> {/* Your chatbot widget will render here */}
    </main>
  );
}
