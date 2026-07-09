// Re-exporta desde AuthContext para mantener compatibilidad con el header.
export type { CurrentUser } from '@/context/auth-context';
export { useAuth as useCurrentUser } from '@/context/auth-context';
