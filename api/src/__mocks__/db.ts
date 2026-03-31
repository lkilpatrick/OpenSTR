// Mock database pool for tests
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};
mockConnect.mockResolvedValue(mockClient);

export const pool = {
  query: mockQuery,
  connect: mockConnect,
};

export const mockClient_ = mockClient;

export function resetMocks() {
  mockQuery.mockReset();
  mockConnect.mockReset();
  mockClient.query.mockReset();
  mockClient.release.mockReset();
  mockConnect.mockResolvedValue(mockClient);
}
