/**
 * Authenticated admin payload injected by JWT strategy.
 */
export interface AuthenticatedAdmin {
    id: number;
    email: string;
    role: 'ADMIN';
    adminRole: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT';
}
