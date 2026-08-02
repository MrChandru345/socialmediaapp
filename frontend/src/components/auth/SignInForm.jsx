import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../utils/authValidation'
import Field from './Field'

export default function SignInForm({ onSwitch }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: true
  })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.identifier.trim() || !formData.password || status === 'loading') {
      return
    }

    setStatus('loading')
    setError('')

    try {
      await login(formData)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, 'Unable to sign in.'))
      setStatus('error')
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-3.5"
    >
      <Field
        label="Email or Username"
        type="text"
        icon={Mail}
        placeholder="you@example.com or username"
        value={formData.identifier}
        onChange={(e) => updateField('identifier', e.target.value)}
        required
      />
      <Field
        label="Password"
        isPassword
        icon={Lock}
        placeholder="Enter your password"
        value={formData.password}
        onChange={(e) => updateField('password', e.target.value)}
        required
      />

      <div className="flex items-center justify-between text-[13px]">
        <label className="flex select-none items-center gap-2 text-white/50 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.remember}
            onChange={(e) => updateField('remember', e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-signal-500 cursor-pointer"
          />
          Remember me
        </label>
        <Link
          to="/forgot-password"
          className="font-medium text-white/50 transition-colors hover:text-white/85"
        >
          Forgot password?
        </Link>
      </div>

      {error && (
        <p className="text-[13px] text-red-400 font-medium text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-3">
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        className="btn-primary mt-1"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Signing in…' : 'Sign In'}
      </motion.button>

      <p className="pt-2 text-center text-[13px] text-white/40">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-white/85 transition-colors hover:text-white"
        >
          Create Account
        </button>
      </p>
    </motion.form>
  )
}
