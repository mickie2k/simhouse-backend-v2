/**
 * Authenticated host payload injected by JWT strategy.
 */
export interface AuthenticatedHost {
    id: number;
    email: string;
    role: 'HOST';
}
