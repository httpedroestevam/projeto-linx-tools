import { resolve } from 'node:path'
import { createLocalRepository } from '../legacy/repositories/local.js'
import { createSupabaseRepository } from '../legacy/repositories/supabase.js'
let repository: any
export function getRepository(): any {
  if (!repository) {
    const config = useRuntimeConfig()
    // Variáveis diretas também funcionam no servidor já compilado. Não expor ao cliente.
    const provider = process.env.DATA_PROVIDER || String(config.dataProvider || 'local')
    const dataFile = process.env.DATA_FILE || String(config.dataFile || 'storage/data.json')
    const url = process.env.SUPABASE_URL || String(config.supabaseUrl || '')
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || String(config.supabaseServiceRoleKey || '')
    repository = provider === 'supabase'
      ? createSupabaseRepository({url, serviceRoleKey:key})
      : createLocalRepository(resolve(dataFile))
  }
  return repository
}
