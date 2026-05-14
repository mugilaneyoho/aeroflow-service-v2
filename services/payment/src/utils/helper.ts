export function genereateRecipetID() {
  const nowDate = new Date();
  const receiptNumber =
    'PI' +
    nowDate.getMilliseconds() +
    nowDate.getSeconds() +
    nowDate.getHours() +
    'TSD' +
    nowDate.getFullYear() +
    nowDate.getMonth() +
    nowDate.getDate();

  return receiptNumber;
}
