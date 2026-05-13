import { Routes, Route, Navigate } from 'react-router-dom';
import { ConsolePage } from '@/features/console/pages/ConsolePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ConsolePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
