import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LiveStream from './pages/LiveStream';
import ManualSandbox from './pages/ManualSandbox';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LiveStream />} />
          <Route path="manual" element={<ManualSandbox />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
