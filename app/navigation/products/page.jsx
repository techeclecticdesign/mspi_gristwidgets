import NavCard from '../components/NavCard';
import Grid from '@mui/material/Grid2';

export default function Home() {
  const host = process.env.NEXT_PUBLIC_GRIST_HOST;
  return (
    <div className="w-4/5 pt-8 m-auto">
      <Grid container spacing={3}>
        <Grid size={6} container direction="column" spacing={1.5} sx={{ height: 'fit-content' }}>
          <NavCard
            title='Woodshop'
            links={[
              { label: 'Issue New Project', href: host + '/todo' },
              { label: 'All Projects', href: host + '/todo' },
              { label: 'Project Templates', href: host + '/todo' },
              { label: 'Bill of Lading', href: host + '/todo' },
            ]}
            width='95%'
          />
          <NavCard
            title='Inventory'
            links={[
              { label: 'Inventory', href: host + '/todo' },
              { label: 'Inventory Orders', href: host + '/todo' },
            ]}
            width='95%'
          />
        </Grid>
        <Grid size={6} container direction="column" spacing={2}>
          <NavCard
            title='Machine Shop'
            links={[
              { label: 'Inventory', href: host + '/todo' },
              { label: 'Inventory Ordering', href: host + '/todo' },
            ]}
            width='95%'
          />
          <NavCard
            title='Finishing'
            links={[
              { label: 'Inventory', href: host + '/todo' },
              { label: 'Inventory Ordering', href: host + '/todo' },
            ]}
            width='95%'
          />
          <NavCard
            title='Upholstery'
            links={[
              { label: 'Inventory', href: host + '/todo' },
              { label: 'Inventory Ordering', href: host + '/todo' },
            ]}
            width='95%'
          />
        </Grid>
      </Grid>
    </div>
  );
}