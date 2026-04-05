// Feature: finance-data-processing-api, Property 14: Response envelope standardization
import * as fc from 'fast-check';
import { sendSuccess, sendError } from '../response';
import { ErrorCode } from '../errors';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Property 14: Response envelope standardization', () => {
  it('sendSuccess always produces { success: true, data }', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        fc.integer({ min: 200, max: 299 }),
        (data, statusCode) => {
          const res = makeRes();
          sendSuccess(res, data, statusCode);
          const body = res.json.mock.calls[0][0];
          expect(body.success).toBe(true);
          expect(body).toHaveProperty('data');
          expect(body).not.toHaveProperty('error');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('sendError always produces { success: false, error: { code, message } }', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }),
        fc.constantFrom(...Object.keys(ErrorCode) as Array<keyof typeof ErrorCode>),
        fc.string({ minLength: 1 }),
        (statusCode, code, message) => {
          const res = makeRes();
          sendError(res, statusCode, code, message);
          const body = res.json.mock.calls[0][0];
          expect(body.success).toBe(false);
          expect(body.error).toHaveProperty('code', code);
          expect(body.error).toHaveProperty('message', message);
          expect(body).not.toHaveProperty('data');
        }
      ),
      { numRuns: 20 }
    );
  });
});
