import CryptJS from 'crypto-js';

export const PassDecrypted = (payload: string) => {
  const secretKey = process.env.CRYPTO_SECRET;
  const dcrypt = CryptJS.AES.decrypt(
    payload,
    secretKey || 'a8sd98f7a9s8df7as9df',
  );

  console.log(dcrypt);

  const output = dcrypt.toString(CryptJS.enc.Utf8).toString();

  console.log(output);

  return JSON.parse(output) as { email: string; password: string };
};
