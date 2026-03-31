import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from '../src/navigation/AppNavigator';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
    </QueryClientProvider>
  );
}
