import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Field({
  label,
  type = 'text',
  icon: Icon,
  isPassword = false,
  ...props
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const inputType = isPassword ? (visible ? 'text' : 'password') : type

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-white/55">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
        )}
        <input
          id={id}
          type={inputType}
          className={`field ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-11' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/35 transition-colors hover:text-white/70"
          >
            {visible ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </div>
  )
}
