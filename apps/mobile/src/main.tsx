import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { TRPCProvider } from './lib/trpc-provider';
import { theme } from './theme/theme';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TRPCProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TRPCProvider>
    </ThemeProvider>
  </StrictMode>,
);
