/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import CryptJS from 'crypto-js';

export const PassDecrypted = (payload: string) => {
  const secretKey = process.env.CRYPTO_SECRET;
  const dcrypt = CryptJS.AES.decrypt(
    payload,
    secretKey || 'a8sd98f7a9s8df7as9df',
  );

  const output = dcrypt.toString(CryptJS.enc.Utf8);

  return JSON.parse(output as string) as { email: string; password: string };
};
