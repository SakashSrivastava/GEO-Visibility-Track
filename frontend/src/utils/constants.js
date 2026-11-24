// Real models queried directly. The dashboard also renders whatever the API
// returns in result.models, so this is just the default/legend set.
export const MODELS = [
  { id: 'gemini',      name: 'Gemini Flash Lite', provider: 'Google',  color: '#6b46e0' },
  { id: 'gpt-oss-120b',name: 'GPT-OSS 120B',     provider: 'OpenAI',  color: '#1f8a5b' },
  { id: 'qwen3',       name: 'Qwen3 27B',        provider: 'Alibaba', color: '#bb7d17' },
  { id: 'gpt-oss-20b', name: 'GPT-OSS 20B',      provider: 'OpenAI',  color: '#1f8f9e' },
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
