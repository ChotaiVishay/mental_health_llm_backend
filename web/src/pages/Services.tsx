import Grid from '@/components/layout/Grid';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function Services() {
  return (
    <>
      <h1>Services (Unified)</h1>
      <p style={{ color: '#6B7280' }}>Demo layout using shared components</p>
      <Grid cols={3}>
        <Card>Service A <div><Button variant="primary">Open</Button></div></Card>
        <Card>Service B <div><Button>Open</Button></div></Card>
        <Card>Service C <div><Button>Open</Button></div></Card>
      </Grid>
    </>
  );
}