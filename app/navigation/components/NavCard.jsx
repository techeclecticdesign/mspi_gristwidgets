import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export default function NavCard({
  title,
  links = [],
  width = '40%',
}) {
  links = Array.isArray(links) ? links : [];
  return (
    <Card sx={{ width }}>
      <CardContent sx={{ p: 0 }}>
        <AppBar
          position="static"
          sx={{
            m: 0,
            height: 34,
            justifyContent: 'center',
            backgroundColor: '#059669',
          }}
        >
          <Toolbar variant="dense">
            {title}
          </Toolbar>
        </AppBar>

        <Stack spacing={1.5} sx={{ pt: 2, alignItems: 'center' }}>
          {links.map(({ label, href, external, onClick }) => {
            // if onClick is present, render as a normal button
            const buttonProps = onClick
              ? { onClick }
              : {
                component: 'a',
                href,
                ...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {}),
              };

            return (
              <Button
                key={label}
                variant="contained"
                {...buttonProps}
                sx={{ textTransform: 'none', width: '75%', height: 30 }}
              >
                {label}
              </Button>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
