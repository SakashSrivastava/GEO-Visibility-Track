export const MODELS = [
  { id: 'claude', name: 'Claude',  provider: 'Anthropic', color: '#4f8ef7' },
  { id: 'gpt',    name: 'GPT-4',   provider: 'OpenAI',    color: '#34d399' },
  { id: 'gemini', name: 'Gemini',  provider: 'Google',    color: '#a78bfa' },
  { id: 'llama',  name: 'Llama',   provider: 'Meta',      color: '#f59e0b' },
]

export const REGIONS = [
  { value: 'global', label: 'Global',         flag: '🌐' },
  { value: 'us',     label: 'United States',  flag: '🇺🇸' },
  { value: 'uk',     label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'in',     label: 'India',          flag: '🇮🇳' },
  { value: 'de',     label: 'Germany',        flag: '🇩🇪' },
  { value: 'jp',     label: 'Japan',          flag: '🇯🇵' },
  { value: 'br',     label: 'Brazil',         flag: '🇧🇷' },
  { value: 'au',     label: 'Australia',      flag: '🇦🇺' },
]

export const PROMPT_TEMPLATES = [
  'Top AI companies',
  'Best LLM platforms',
  'AI safety leaders',
  'Frontier AI labs',
  'Enterprise AI tools',
]

export const SENTIMENT_COLOR = {
  positive: 'var(--green)',
  neutral:  'var(--amber)',
  negative: 'var(--red)',
}
