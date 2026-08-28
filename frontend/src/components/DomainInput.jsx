import { Globe, ArrowUpRight, CircleAlert, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { normalizeDomain } from '../utils/formatters'

export default function DomainInput({ onSubmit, disabled }) {
  const [input, setInput] = useState('')
  const [validation, setValidation] = useState('')

  function submit(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    const raw = input.trim()
    if (!raw) {
      setValidation('Please enter a domain or website name (e.g. google.com or railfeast).')
      return
    }
    const domain = normalizeDomain(raw)
    if (!domain) {
      setValidation('Enter a valid domain or website name (e.g., scanme.nmap.org, example.com, or https://target.com).')
      return
    }
    setValidation('')
    setInput(domain)
    onSubmit(domain)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      submit(event)
    }
  }

  function handlePreset(domain) {
    setInput(domain)
    setValidation('')
    onSubmit(domain)
  }

  return (
    <form className="target-form" onSubmit={submit} noValidate>
      <label htmlFor="domain">Target Domain / Website Name</label>
      <div className="input-wrap">
        <Globe size={18} aria-hidden="true" style={{ color: 'var(--primary)' }} />
        <input
          id="domain"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            if (validation) setValidation('')
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. example.com, railfeast.com, or https://scanme.nmap.org"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
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
