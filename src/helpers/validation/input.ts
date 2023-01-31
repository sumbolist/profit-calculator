export const normalizePercentageOnChange = (val: string) => {
  if (!val) return;
  const chars = val.split("");
  const charsLength = chars.length;
  if (charsLength > 3) return;
  const first = chars[0];
  if (first === "0") return;
  if (first !== "1") return val.slice(0, 2);
  if (first === "1") {
    if (charsLength === 2 && chars[1] !== "0") return "10";
    if (charsLength === 3 && chars[2] !== "0") return "100";
  }
  return val;
};
