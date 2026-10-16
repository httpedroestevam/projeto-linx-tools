import type { Capability, User } from '../../shared/types'
export function useSession() {
  const user = useState<User | null>('lt:user', () => null)
  const loaded = useState('lt:loaded', () => false)
  const loading = useState('lt:loading', () => false)
  async function refresh() {
    loading.value = true
    try { user.value = (await $fetch<{user: User|null}>('/api/auth/me', {credentials:'include'})).user }
    catch { user.value = null }
    finally { loaded.value = true; loading.value = false }
    return user.value
  }
  async function login(email: string, password: string) {
    const data = await $fetch<{user: User}>('/api/auth/login', {method:'POST', body:{email,password}, credentials:'include'})
    user.value = data.user; loaded.value = true
    return data.user
  }
  async function logout() {
    try { await $fetch('/api/auth/logout',{method:'POST',body:{},credentials:'include'}) }
    finally { user.value=null; loaded.value=true; await navigateTo('/') }
  }
  const can = (permission:Capability) => user.value?.role === 'admin' || Boolean(user.value?.permissions?.includes(permission))
  return {user,loaded,loading,refresh,login,logout,can}
}
