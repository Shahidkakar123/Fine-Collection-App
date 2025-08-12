const bcrypt = require('bcrypt');

async function hashPassword() {
  const plainPassword = '@12344321';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Hashed Password:', hashedPassword);
}

hashPassword().catch(console.error);