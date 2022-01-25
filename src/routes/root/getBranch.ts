import child_process from "child_process";

export default () => {
  return child_process
    .execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();
};
