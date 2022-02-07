export default (str: string) => {
  str = str.replace(/-/g, "").replace(/ /g, "");
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx".replace(
    /[x]/g,
    function (c, p) {
      return result[p % result.length];
    }
  );
};
