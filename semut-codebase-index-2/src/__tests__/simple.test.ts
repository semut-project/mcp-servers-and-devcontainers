// Simple test to verify basic jest functionality
describe('Simple test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async code', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});
