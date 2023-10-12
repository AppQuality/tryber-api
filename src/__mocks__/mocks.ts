jest.mock("@appquality/wp-auth");
jest.mock("@src/features/database");
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));
export {};
