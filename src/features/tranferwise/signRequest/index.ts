import child_process from "child_process";

export default (str: string): Promise<string> => {
  const command = `printf '${str}' | openssl sha256 -sign ./keys/private_tw.pem | base64 -w 0`;
  return new Promise((resolve, reject) => {
    child_process.exec(command, function (error, stdout, stderr) {
      if (error) return reject(error);
      return resolve(`${stdout}${stderr}`);
    });
  });
};
