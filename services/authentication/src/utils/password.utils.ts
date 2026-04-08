import * as aragon2 from 'argon2';

export class PasswordUtils {
  static hash(password: string) {
    return aragon2.hash(password, {
      type: aragon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });
  }

  static verify(hash: string, password: string) {
    return aragon2.verify(hash, password);
  }
}

export function GeneratedRandomPassword() {
  const charset =
    'abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:<>?ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}
