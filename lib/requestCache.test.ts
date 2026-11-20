import { renderHook, act } from '@testing-library/react';
import { useRequestCache } from './requestCache';

describe('requestCache', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('does not warn about state updates when unmounted during an in-flight async call', async () => {
    let resolveRequest: (value: string) => void = () => {};
    const pending = new Promise<string>((resolve) => {
      resolveRequest = resolve;
    });

    const { result, unmount } = renderHook(() =>
      useRequestCache<string>('unmount-during-flight', () => pending),
    );

    // Kick off the async call so it is in-flight.
    act(() => {
      void result.current.run();
    });

    // Unmount while the request is still pending.
    unmount();

    // Resolve the in-flight call after unmount.
    await act(async () => {
      resolveRequest('done');
      await pending;
    });

    const stateUpdateWarnings = consoleErrorSpy.mock.calls.filter((call) =>
      String(call[0]).includes('unmounted component'),
    );
    expect(stateUpdateWarnings).toHaveLength(0);
  });
});
