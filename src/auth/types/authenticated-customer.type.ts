/**
 * Authenticated customer payload injected by JWT strategy.
 */
export interface AuthenticatedCustomer {
  id: number;
  email: string;
  role: 'CUSTOMER';
}
