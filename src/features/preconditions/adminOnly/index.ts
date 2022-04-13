export default (role: string) => {
  if (role !== "administrator") {
    throw new Error("You are not an administrator");
  }
};
