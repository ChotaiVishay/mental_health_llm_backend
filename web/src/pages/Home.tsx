import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import SupportedLangNote from '@/components/misc/SupportedLangNote';
import Title from '@/components/misc/Title';

export default function Home() {
  const nav = useNavigate();

  return (
    <>
      <Title value="Support Atlas Assistant — Home" />
      <h1 style={{ marginTop: 0 }}>Support Atlas Assistant</h1>
      <p style={{ color: '#6B7280', maxWidth: 720 }}>
        Chat with our assistant to find mental health services and answers fast.
      </p>

      <Card>
        <h2 style={{ marginTop: 0 }}>Start a conversation</h2>
        <p style={{ color: '#6B7280' }}>
          You’ll be asked to sign in before chatting if you’re not already logged in.
        </p>
        <Button variant="primary" onClick={() => nav('/chat')}>Start Chat</Button>
        <SupportedLangNote />
      </Card>
    </>
  );
}