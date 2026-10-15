// Real models queried directly. The dashboard also renders whatever the API
// returns in result.models, so this is just the default/legend set.
export const MODELS = [
  { id: 'gemini',      name: 'Gemini Flash',     provider: 'Google',  color: '#a78bfa' },
  { id: 'gpt-oss-120b',name: 'GPT-OSS 120B',     provider: 'OpenAI',  color: '#34d399' },
  { id: 'qwen3',       name: 'Qwen3 27B',        provider: 'Alibaba', color: '#f59e0b' },
  { id: 'gpt-oss-20b', name: 'GPT-OSS 20B',      provider: 'OpenAI',  color: '#4f8ef7' },
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
