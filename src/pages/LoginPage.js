import React, { useState } from 'react';
import { signIn } from '../utils/api';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(
      error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos.'
        : error.message
    );
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div style={{ width:'100%', maxWidth:380, display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

        {/* Logo área */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:10, filter:'hue-rotate(200deg) saturate(3) brightness(1.2)' }}>🌹</div>
          <div style={{ fontFamily:'Orbitron,monospace', fontSize:22, fontWeight:900,
            color:'#00aaff', letterSpacing:5, marginBottom:4 }}>
            XZINBETS
          </div>
          <div style={{ fontSize:10, color:'rgba(0,170,255,0.4)', letterSpacing:2 }}>
            by XzinTech
          </div>
          <div style={{ fontSize:11, color:'rgba(0,170,255,0.25)', marginTop:6, fontStyle:'italic' }}>
            "O impossível é só o começo."
          </div>
        </div>

        {/* Card login */}
        <div className="login-card" style={{ width:'100%' }}>
          <div style={{ fontFamily:'Orbitron,monospace', fontSize:11, fontWeight:700,
            color:'var(--accent)', letterSpacing:2, marginBottom:20, textAlign:'center' }}>
            ACESSO À PLATAFORMA
          </div>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div className="form-group">
              <span className="form-label">Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required autoFocus />
            </div>
            <div className="form-group">
              <span className="form-label">Senha</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{ background:'var(--red-bg)', color:'var(--red)',
                padding:'8px 12px', borderRadius:'var(--radius-sm)',
                fontSize:12, border:'1px solid var(--red-bd)' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width:'100%', justifyContent:'center', padding:'11px', marginTop:4, fontSize:12 }}>
              {loading ? 'AUTENTICANDO...' : 'ENTRAR'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:16, fontSize:10,
            color:'var(--text3)', lineHeight:1.6 }}>
            Acesso somente por convite do administrador.<br/>
            Não tem acesso? Fale com a XzinTech.
          </div>
        </div>

        {/* Copyright */}
        <div style={{ marginTop:20, fontSize:10, color:'rgba(0,170,255,0.2)', textAlign:'center', letterSpacing:.5 }}>
          © XzinTech — Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}
