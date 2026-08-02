import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, AtSign, Mail, Lock, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getAuthErrorMessage,
  validateEmail,
  validatePassword,
  validateUsername
} from '../../utils/authValidation'
import Field from './Field'

export default function SignUpForm({ onSwitch }) {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: true
  })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !formData.fullName.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword ||
      status === 'loading'
    ) {
      return
    }

    const usernameError = validateUsername(formData.username)
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password, {
      username: formData.username,
      email: formData.email
    })

    if (usernameError) {
      setError(usernameError)
      setStatus('error')
      return
    }
    if (emailError) {
      setError(emailError)
      setStatus('error')
      return
    }
    if (passwordError) {
      setError(passwordError)
      setStatus('error')
      return
    }
    if (formData.confirmPassword !== formData.password) {
      setError('Passwords do not match.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')

    try {
      await signup(formData)
      navigate('/', { replace: true })
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, 'Unable to create account.'))
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
      className="space-y-2.5"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field
          label="Full Name"
          icon={User}
          placeholder="Jordan Ray"
          value={formData.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          required
        />
        <Field
          label="Username"
          icon={AtSign}
          placeholder="jordanray"
          value={formData.username}
          onChange={(e) => updateField('username', e.target.value)}
          required
        />
      </div>
      <Field
        label="Email"
        type="email"
        icon={Mail}
        placeholder="you@example.com"
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
        required
      />
      <Field
        label="Password"
        isPassword
        icon={Lock}
        placeholder="Create password"
        value={formData.password}
        onChange={(e) => updateField('password', e.target.value)}
        required
      />
      <Field
        label="Confirm Password"
        isPassword
        icon={ShieldCheck}
        placeholder="Repeat password"
        value={formData.confirmPassword}
        onChange={(e) => updateField('confirmPassword', e.target.value)}
        required
      />

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
        {status === 'loading' ? 'Creating account…' : 'Create Account'}
      </motion.button>

      <p className="pt-2 text-center text-[13px] text-white/40">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-white/85 transition-colors hover:text-white"
        >
          Sign In
        </button>
      </p>
    </motion.form>
  )
}
