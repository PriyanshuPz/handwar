/**
 * Generates a random alphanumeric code of the specified length
 * @param length Length of the code to generate
 * @returns Random alphanumeric code
 */
export function generateRandomCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous characters (0, 1, I, O)
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
