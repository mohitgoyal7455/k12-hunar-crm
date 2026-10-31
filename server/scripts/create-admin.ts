/**
 * Create (or reset the password of) an admin account.
 *
 *   npm run create-admin -- "Full Name" email@example.com "StrongPassword1"
 */
import { pool } from '../src/db/pool';
import { createAdmin } from '../src/services/authService';

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -- "Full Name" email@example.com "Password"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const id = await createAdmin(name, email, password);
  console.log(`Admin ready: id=${id} email=${email.toLowerCase()}`);
}

main()
  .catch((err) => {
    console.error('Failed to create admin:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
