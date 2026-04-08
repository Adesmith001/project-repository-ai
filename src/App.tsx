import { AppRouter } from './routes/AppRouter'
import { Toaster } from 'react-hot-toast'
import { GlobalErrorToasts } from './components/states/GlobalErrorToasts'

function App() {
  return (
    <>
      <AppRouter />
      <GlobalErrorToasts />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#0f172a',
          },
        }}
      />
    </>
  )
}

export default App
