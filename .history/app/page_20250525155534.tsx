// app/page.tsx
import Widget from './widget';
import './globals.css'; // or wherever your global CSS file is


export default function Home() {
  return (
    <main>
     
      <Widget /> {/* Your chatbot widget will render here */}
    </main>
  );
}
