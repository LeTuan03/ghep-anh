import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      alert('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8085/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        localStorage.setItem('accessToken', result.data.accessToken);
        if (result.data.user) {
           localStorage.setItem('user', JSON.stringify(result.data.user));
        }
        onLogin();
        navigate('/');
      } else {
        alert(result.message || result.error || 'Tài khoản hoặc mật khẩu không đúng!');
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      alert('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <form onSubmit={handleLogin} style={{ background: '#111820', padding: '40px 30px', borderRadius: '16px', border: '1px solid rgba(0,240,255,0.18)', boxShadow: '0 0 40px rgba(0,240,255,0.1)', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ textAlign: 'center', color: '#00f0ff', margin: 0, fontSize: '1.8rem', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>Đăng Nhập</h2>
        <p style={{ textAlign: 'center', color: '#8b9bb4', fontSize: '0.9rem', margin: '-10px 0 10px 0' }}>Hệ thống ghép ảnh Acc Liên Quân</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: '#e8eaf6', fontSize: '0.9rem' }}>Tài khoản</label>
          <input 
            type="text" 
            value={loginForm.username}
            onChange={e => setLoginForm(prev => ({...prev, username: e.target.value}))}
            style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff', outline: 'none' }}
            placeholder="Nhập admin"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: '#e8eaf6', fontSize: '0.9rem' }}>Mật khẩu</label>
          <input 
            type="password" 
            value={loginForm.password}
            onChange={e => setLoginForm(prev => ({...prev, password: e.target.value}))}
            style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff', outline: 'none' }}
            placeholder="Nhập admin"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ marginTop: '10px', padding: '12px', background: 'linear-gradient(90deg, #00f0ff, #00a2ff)', color: '#000', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 0 20px rgba(0,240,255,0.4)', opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}
        </button>
      </form>
    </div>
  );
}

