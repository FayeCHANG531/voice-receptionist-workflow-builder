import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { LanguageProvider } from './contexts/LanguageContext';
import '../styles/fonts.css';

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </LanguageProvider>
  );
}
