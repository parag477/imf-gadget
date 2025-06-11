const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // default user
  const defaultUsername = 'admin';
  const defaultPassword = '12345';
  
  const existingUser = await prisma.user.findUnique({
    where: { username: defaultUsername }
  });

  if (!existingUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    
    await prisma.user.create({
      data: {
        username: defaultUsername,
        password: hashedPassword
      }
    });
    
    console.log('Default user created successfully');
    console.log(`Username: ${defaultUsername}`);
    console.log(`Password: ${defaultPassword}`);
  } else {
    console.log('Default user already exists');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
