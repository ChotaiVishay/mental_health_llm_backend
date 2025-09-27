import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function Styleguide() {
  return (
    <main>
      <Container>
        <h1 className="h1">Styleguide</h1>
        <p className="lead">Shared chrome previews</p>

        <Card>
          <h2 className="h2">Buttons</h2>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Button>Default</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="link">Link</Button>
            <Button variant="crisis">Crisis</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Card>

        <Card style={{ marginTop:16 }}>
          <h2 className="h2">Card hover</h2>
          <p>Cards gently lift and sharpen on hover.</p>
        </Card>
      </Container>
    </main>
  );
}