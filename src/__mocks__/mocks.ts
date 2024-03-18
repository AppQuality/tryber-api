jest.mock("@appquality/wp-auth");
jest.mock("@src/features/database");
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

// Allow to use jest.useFakeTimers() in tests
Object.defineProperty(global, "performance", {
  writable: true,
});
export {};
