import axios from 'axios'

// Extrai uma mensagem legível do erro de uma chamada à API, para mostrar na
// tela o que realmente aconteceu (em vez de um texto genérico sempre igual).
// O backend às vezes responde com uma string simples (BadRequest("...")) e
// às vezes com um ValidationProblemDetails (quando falha a validação
// automática do model binding) — os dois formatos são tratados aqui.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Sem conexão com o servidor. Verifique a rede e tente novamente.'
    }

    const data = err.response.data

    if (typeof data === 'string' && data.trim()) {
      return data
    }

    if (data && typeof data === 'object') {
      const problema = data as { title?: string; detail?: string; errors?: Record<string, string[]> }

      if (problema.errors) {
        const mensagens = Object.values(problema.errors).flat()
        if (mensagens.length > 0) return mensagens.join(' ')
      }
      if (problema.detail) return problema.detail
      if (problema.title) return problema.title
    }
  }

  return fallback
}
