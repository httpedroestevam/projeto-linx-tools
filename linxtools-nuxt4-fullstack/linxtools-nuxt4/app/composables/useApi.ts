export function apiMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as {data?:{error?:string;message?:string};statusMessage?:string;message?:string}
    return e.data?.error || e.data?.message || e.statusMessage || e.message || 'Não foi possível concluir a operação.'
  }
  return 'Ocorreu um erro inesperado.'
}
export const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('pt-BR', {day:'2-digit',month:'short',year:'numeric'}) : '—'
