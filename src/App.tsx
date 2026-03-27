import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';

export default function App() {
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home onLogout={handleLogout} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
