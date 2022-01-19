import child_process from 'child_process';

export default () => {
  return child_process.execSync("git rev-parse --short HEAD").toString().trim();
};
