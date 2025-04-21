import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export default function NavCard({
  title,
  links = {}, // {label: address, ...}
  width = '40%',
}) {
  return (
    <Card sx={{ maxWidth: { width } }}>
      <CardContent sx={{ p: 0 }}>
        <AppBar
          position="static"
          sx={{
            margin: 0,
            height: 34,
            justifyContent: 'center',
            backgroundColor: '#059669',
          }}>
          <Toolbar>
            <Typography variant="p" component="div">
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
        <Stack spacing={1.5} sx={{ pt: '20px', alignItems: 'center' }}>
          {Object.entries(links).map(([label, address]) => (
            <Button
              key={label}
              variant="contained"
              href={address}
              sx={{ textTransform: 'none', width: '75%', height: '30px' }}
            >
              {label}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}