import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/common'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'user' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Champs obligatoires manquants')
    if (form.password.length < 6) return toast.error('Mot de passe trop court (min 6 caractères)')
    if (form.password !== form.confirm) return toast.error('Les mots de passe ne correspondent pas')
    setLoading(true)
    try {
      const { data } = await authApi.register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role })
      login(data.data.token, data.data.user)
      toast.success('Compte créé avec succès !')
      navigate(form.role === 'collector' ? '/collector' : '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Visual */}
      <div className="hidden md:flex flex-col items-center justify-center bg-[#1A8A3C] relative overflow-hidden p-12">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center max-w-sm">
          <div className="text-7xl mb-8">♻️</div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Rejoignez la révolution verte</h2>
          <p className="text-white/70 leading-relaxed">Des milliers de personnes font déjà confiance à EcoGarbage pour gérer leurs déchets de façon responsable.</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[['12 000+', 'Utilisateurs'], ['500+', 'Collecteurs'], ['48 000+', 'Collectes'], ['98%', 'Satisfaction']].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-xl p-4 text-white text-center">
                <p className="font-display font-bold text-2xl">{v}</p>
                <p className="text-xs text-white/60 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 bg-[#f7faf8] overflow-y-auto">
        <div className="w-full max-w-[440px] py-8">
          <Link to="/" className="flex md:hidden items-center gap-2 font-display font-bold text-xl mb-8">
            <div className="w-9 h-9 bg-[#1A8A3C] rounded-xl flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            Eco<span className="text-[#1A8A3C]">Garbage</span>
          </Link>

          <div className="bg-white rounded-3xl shadow-green-lg p-8">
            <h1 className="text-2xl font-display font-bold mb-1">Créer un compte</h1>
            <p className="text-sm text-gray-400 mb-6">
              Déjà inscrit ?{' '}
              <Link to="/login" className="text-[#1A8A3C] font-semibold hover:underline">Se connecter</Link>
            </p>

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: 'user', emoji: '👤', label: 'Particulier / Entreprise' },
                { value: 'collector', emoji: '🚛', label: 'Collecteur' },
              ].map(r => (
                <button key={r.value} type="button"
                  onClick={() => set('role', r.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all text-sm font-medium ${form.role === r.value ? 'border-[#1A8A3C] bg-[#E8F5EE] text-[#1A8A3C]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <div className="text-2xl mb-1">{r.emoji}</div>
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom complet <span className="text-red-500">*</span></label>
                <input className="input" placeholder="Jean Dupont" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email <span className="text-red-500">*</span></label>
                <input type="email" className="input" placeholder="votre@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input type="tel" className="input" placeholder="+237 6XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Mot de passe <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="Minimum 6 caractères"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                <input type="password" className="input" placeholder="Répétez le mot de passe"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-2">
                {loading ? <Spinner size="sm" /> : <UserPlus size={16} />}
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              En vous inscrivant, vous acceptez nos <span className="text-[#1A8A3C] cursor-pointer hover:underline">conditions d'utilisation</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
