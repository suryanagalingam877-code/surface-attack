import { Globe, ArrowUpRight, CircleAlert, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { normalizeDomain } from '../utils/formatters'

export default function DomainInput({ onSubmit, disabled }) {
  const [input, setInput] = useState('')
  const [validation, setValidation] = useState('')

  function submit(event) {
    event?.preventDefault?.()
    const domain = normalizeDomain(input)
    if (!domain) {
      setValidation('Enter a valid domain name (e.g., scanme.nmap.org or example.com).')
      return
    }
    setValidation('')
    setInput(domain)
    onSubmit(domain)
  }

  function handlePreset(domain) {
    setInput(domain)
    setValidation('')
    onSubmit(domain)
  }

  return (
    <form className="target-form" onSubmit={submit}>
      <label htmlFor="domain">Target Domain</label>
      <div className="input-wrap">
        <Globe size={18} aria-hidden="true" style={{ color: 'var(--primary)' }} />
        <input
          id="domain"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            if (validation) setValidation('')
          }}
          placeholder="e.g. example.com or scanme.nmap.org"
          autoComplete="url"
          autoFocus
          disabled={disabled}
        />
        <button type="submit" className="btn-primary" disabled={disabled || !input.trim()}>
          {disabled ? (
            'Analyzing...'
          ) : (
            <>
              Launch Scan <ArrowUpRight size={16} />
            </>
          )}
        </button>
      </div>
      {validation && (
        <p className="validation">
          <CircleAlert size={14} />
          <span>{validation}</span>
        </p>
      )}
      <div className="preset-targets">
        <span>Quick Presets:</span>
        <button
          type="button"
          className="preset-btn"
          disabled={disabled}
          onClick={() => handlePreset('scanme.nmap.org')}
        >
          <Sparkles size={10} style={{ marginRight: 4 }} /> scanme.nmap.org
        </button>
        <button
          type="button"
          className="preset-btn"
          disabled={disabled}
          onClick={() => handlePreset('example.com')}
        >
          example.com
        </button>
      </div>
    </form>
  )
}
