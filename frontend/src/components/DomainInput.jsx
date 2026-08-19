import { Globe, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { normalizeDomain } from '../utils/formatters'

export default function DomainInput({ onSubmit, disabled }) {
  const [input, setInput] = useState('')
  const [validation, setValidation] = useState('')
  function submit(event) {
    event.preventDefault()
    const domain = normalizeDomain(input)
    if (!domain) { setValidation('Enter a valid domain name, such as example.com.'); return }
    setValidation('')
    setInput(domain)
    onSubmit(domain)
  }
  return <form className="target-form" onSubmit={submit}>
    <label htmlFor="domain">Target domain</label>
    <div className="input-wrap">
      <Globe size={18} aria-hidden="true" />
      <input id="domain" value={input} onChange={(event) => setInput(event.target.value)} placeholder="example.com" autoComplete="url" disabled={disabled} />
      <button type="submit" disabled={disabled}>{disabled ? 'Running' : 'Start Recon'} <ArrowUpRight size={17} /></button>
    </div>
    {validation && <p className="validation">{validation}</p>}
  </form>
}
