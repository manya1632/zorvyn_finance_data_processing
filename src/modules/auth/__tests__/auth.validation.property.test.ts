import * as fc from 'fast-check';
import { registerSchema, loginSchema } from '../auth.schema';

describe('Property 2: Invalid auth payload rejection', () => {
  it('rejects registration payloads with password shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }),
          email: fc.emailAddress(),
          password: fc.string({ maxLength: 7 }),
          role: fc.constantFrom('VIEWER', 'ANALYST', 'ADMIN'),
        }),
        (payload) => {
          const result = registerSchema.safeParse({ body: payload });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('rejects registration payloads with invalid email format', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@')),
        (invalidEmail) => {
          const result = registerSchema.safeParse({
            body: { name: 'Test', email: invalidEmail, password: 'password123' },
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('rejects login payloads with missing email', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (password) => {
          const result = loginSchema.safeParse({ body: { password } });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });
});
