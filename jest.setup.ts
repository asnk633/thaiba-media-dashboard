// jest.setup.ts
import '@testing-library/jest-dom';

// Mock global fetch for components/pages that call it during effects
beforeAll(() => {
  if (!('fetch' in global)) {
    // @ts-expect-error - add to Node global for tests
    global.fetch = jest.fn(async () =>
      Promise.resolve({
        ok: true,
        json: async () => ({ tasks: [] }),
      } as any),
    );
  }
});

// Keep tests quiet if something still calls console.error
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
afterAll(() => errorSpy.mockRestore());
