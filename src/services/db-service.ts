import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';

// In-memory store — swap body of each function for Supabase/Vercel KV calls in production.
// Key: userId (request IP in stub; auth session ID in production).
const creditStore = new Map<string, number>();
const INITIAL_CREDITS = 15;

export async function checkUserCredits(
  userId: string,
): Promise<Result<{ credits: number }>> {
  const credits = creditStore.get(userId) ?? INITIAL_CREDITS;
  return ok({ credits });
}

export async function decrementUserCredit(
  userId: string,
): Promise<Result<{ success: boolean; remaining: number }>> {
  const current = creditStore.get(userId) ?? INITIAL_CREDITS;
  if (current <= 0) {
    return err(new Error('No credits remaining'));
  }
  const remaining = current - 1;
  creditStore.set(userId, remaining);
  return ok({ success: true, remaining });
}
