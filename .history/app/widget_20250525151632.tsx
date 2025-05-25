// pages/widget.tsx
import Head from 'next/head';
import MuseumChatbot from '@/components/MuseumChatbot'; // Ensure correct path

export default function Widget() {
    return (
        <>
            <Head>
                <title>Chatbot Widget</title>
                <meta name="robots" content="noindex" />
            </Head>

            <div style={{
                width: '100%',
                height: '100vh',
                margin: 0,
                padding: 0,
                backgroundColor: '#fff',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <MuseumChatbot />
            </div>
        </>
    );
}
