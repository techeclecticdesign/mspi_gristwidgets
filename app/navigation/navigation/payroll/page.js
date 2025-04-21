import NavCard from '../components/NavCard';
import Grid from '@mui/material/Grid2';

export default function Home() {
  const payrollLinks = [
    {
      label: 'Payroll Input',
      href: 'http://172.30.221.95:8484/o/docs/qZ1weY6NyWVW/test/p/5',
      external: true,
    }
  ];
  return (
    <div className="w-4/5 pt-8 m-auto">
      <Grid container spacing={3}>
        <Grid size={6} container direction="column" spacing={1.5} sx={{ height: 'fit-content' }}>
          <NavCard
            title='Payroll'
            links={payrollLinks}
            width='95%'
          />
        </Grid>
      </Grid>
    </div>
  );
}