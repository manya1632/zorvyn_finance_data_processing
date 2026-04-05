// Feature: finance-data-processing-api
import { sendSuccess, sendError } from '../response';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('sendSuccess', () => {
  it('returns { success: true, data } envelope', () => {
    const res = makeRes();
    sendSuccess(res, { id: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: '1' } });
  });

  it('includes meta when provided', () => {
    const res = makeRes();
    const meta = { page: 1, limit: 20, total: 100, totalPages: 5 };
    sendSuccess(res, [], 200, meta);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta });
  });

  it('uses provided statusCode', () => {
    const res = makeRes();
    sendSuccess(res, { id: '1' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('does not include meta when not provided', () => {
    const res = makeRes();
    sendSuccess(res, { id: '1' });
    const call = res.json.mock.calls[0][0];
    expect(call).not.toHaveProperty('meta');
  });
});

describe('sendError', () => {
  it('returns { success: false, error: { code, message } } envelope', () => {
    const res = makeRes();
    sendError(res, 404, 'NOT_FOUND', 'Resource not found');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  });

  it('includes details when provided', () => {
    const res = makeRes();
    sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', [{ field: 'email' }]);
    const call = res.json.mock.calls[0][0];
    expect(call.error).toHaveProperty('details');
  });

  it('does not include details when not provided', () => {
    const res = makeRes();
    sendError(res, 500, 'INTERNAL_ERROR', 'Server error');
    const call = res.json.mock.calls[0][0];
    expect(call.error).not.toHaveProperty('details');
  });
});
