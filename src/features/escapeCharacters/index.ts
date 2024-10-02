export default (value: string) => {
  let ret = "";
  value
    .replace(
      /[^\x00-\x7F]/g,
      (a) => "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
    )
    .replace(/(([A-Za-zÀ-ÿ' 0-9,-]|\(|\)|\\u[0-9a-z]*))/gmu, (a) => (ret += a));
  return ret.replace(/\\u[0-9a-z]{4}/gmu, function (a) {
    return String.fromCharCode(parseInt(a.slice(2), 16));
  });
};
