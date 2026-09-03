import React, { useState } from 'react';
import { signIn, forgotPassword } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const [fpEmail,        setFpEmail]        = useState('');
  const [fpCode,         setFpCode]         = useState('');
  const [fpNewPassword,  setFpNewPassword]  = useState('');
  const [fpError,        setFpError]        = useState('');
  const [fpLoading,      setFpLoading]      = useState(false);
  const [fpResult,       setFpResult]       = useState(null); // {recoveryCode, user}

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await signIn(email, password);
      setUser(user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setFpError(''); setFpLoading(true);
    try {
      const res = await forgotPassword(fpEmail, fpCode.trim(), fpNewPassword);
      setFpResult(res);
    } catch (err) {
      setFpError(err.message);
    }
    setFpLoading(false);
  };

  const enterAfterReset = () => setUser(fpResult);

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
            {mode==='login' ? 'ACESSO À PLATAFORMA' : 'RECUPERAR ACESSO'}
          </div>

          {mode==='login' && (
            <>
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

              <div style={{ textAlign:'center', marginTop:14 }}>
                <button type="button" className="btn btn-ghost" style={{fontSize:11}}
                  onClick={()=>{setMode('forgot'); setFpResult(null); setFpError('');}}>
                  Esqueci minha senha
                </button>
              </div>

              <div style={{ textAlign:'center', marginTop:8, fontSize:10,
                color:'var(--text3)', lineHeight:1.6 }}>
                Acesso somente por convite do administrador.<br/>
                Não tem acesso? Fale com a XzinTech.
              </div>
            </>
          )}

          {mode==='forgot' && !fpResult && (
            <>
              <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div className="form-group">
                  <span className="form-label">Email</span>
                  <input type="email" value={fpEmail} onChange={e=>setFpEmail(e.target.value)}
                    placeholder="seu@email.com" required autoFocus />
                </div>
                <div className="form-group">
                  <span className="form-label">Código de recuperação</span>
                  <input type="text" value={fpCode} onChange={e=>setFpCode(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX" required />
                  <span className="form-hint">
                    Foi mostrado quando sua conta foi criada (ou no último reset de senha pelo admin).
                  </span>
                </div>
                <div className="form-group">
                  <span className="form-label">Nova senha</span>
                  <input type="password" value={fpNewPassword} onChange={e=>setFpNewPassword(e.target.value)}
                    placeholder="mínimo 8 caracteres" required />
                </div>

                {fpError && (
                  <div style={{ background:'var(--red-bg)', color:'var(--red)',
                    padding:'8px 12px', borderRadius:'var(--radius-sm)',
                    fontSize:12, border:'1px solid var(--red-bd)' }}>
                    {fpError}
                  </div>
                )}

                <button className="btn btn-primary" type="submit" disabled={fpLoading}
                  style={{ width:'100%', justifyContent:'center', padding:'11px', marginTop:4, fontSize:12 }}>
                  {fpLoading ? 'VERIFICANDO...' : 'REDEFINIR SENHA'}
                </button>
              </form>

              <div style={{ textAlign:'center', marginTop:14 }}>
                <button type="button" className="btn btn-ghost" style={{fontSize:11}} onClick={()=>setMode('login')}>
                  Voltar ao login
                </button>
              </div>

              <div style={{ textAlign:'center', marginTop:8, fontSize:10, color:'var(--text3)', lineHeight:1.6 }}>
                Sem o código de recuperação? Peça pro admin resetar sua senha
                na tela Admin.
              </div>
            </>
          )}

          {mode==='forgot' && fpResult && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ fontSize:13, color:'var(--text2)', textAlign:'center' }}>
                ✅ Senha redefinida! Guarde o novo código de recuperação abaixo
                — ele só aparece esta vez.
              </div>
              <div style={{ padding:12, borderRadius:'var(--radius-sm)',
                background:'rgba(0,170,255,0.08)', border:'1px solid var(--border)', textAlign:'center' }}>
                <code className="mono" style={{ fontSize:15, fontWeight:700, letterSpacing:1 }}>
                  {fpResult.recoveryCode}
                </code>
              </div>
              <button className="btn btn-primary" onClick={enterAfterReset}
                style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:12 }}>
                ENTRAR
              </button>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div style={{ marginTop:20, fontSize:10, color:'rgba(0,170,255,0.2)', textAlign:'center', letterSpacing:.5 }}>
          © XzinTech — Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}
