import NavCard from '../components/NavCard';
import Grid from '@mui/material/Grid2';

export default function Home() {
  return (
    <div className="w-4/5 pt-8 m-auto">
      <Grid container spacing={3}>
        <Grid size={6} container direction="column" spacing={1.5} sx={{ height: 'fit-content' }}>
          <NavCard
            title='Woodshop'
            links={{
              'Issue New Project': 'http://localhost:3000/todo',
              'All Projects': 'http://localhost:3000/todo',
              'Project Templates': 'http://localhost:3000/todo',
              'Bill of Lading': 'http://localhost:3000/todo',
            }}
            width='95%'
          />
          <NavCard
            title='Inventory'
            links={{
              'Inventory': 'http://localhost:3000/todo',
              'Inventory Ordering': 'http://localhost:3000/todo',
            }}
            width='95%'
          />
        </Grid>
        <Grid size={6} container direction="column" spacing={2}>
          <NavCard
            title='Machine Shop'
            links={{
              'Inventory': 'http://localhost:3000/todo',
              'Inventory Ordering': 'http://localhost:3000/todo',
            }}
            width='95%'
          />
          <NavCard
            title='Finishing'
            links={{
              'Inventory': 'http://localhost:3000/todo',
              'Inventory Ordering': 'http://localhost:3000/todo',
            }}
            width='95%'
          />
          <NavCard
            title='Upholstery'
            links={{
              'Inventory': 'http://localhost:3000/todo',
              'Inventory Ordering': 'http://localhost:3000/todo',
            }}
            width='95%'
          />
        </Grid>
      </Grid>
    </div>
  );
}