// Migration: Seeds the initial admin user from environment variables
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = {
   up: async ({ context: queryInterface }) => {
      try {
         const sequelize = queryInterface.sequelize;

         // Check if users table has any users
         const [results] = await sequelize.query('SELECT COUNT(*) as count FROM user');
         const userCount = results[0].count || results[0].COUNT;

         if (userCount > 0) {
            console.log('[Migration] Users already exist, skipping admin seed...');
            return;
         }

         // Get credentials from env vars (same as current single-user auth)
         const username = process.env.USER_NAME || process.env.USER || 'admin';
         const password = process.env.PASSWORD || 'changeme123';
         const apiKey = process.env.APIKEY || crypto.randomBytes(32).toString('hex');

         // Hash the password
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(password, salt);

         const now = new Date().toISOString();

         await queryInterface.bulkInsert('user', [{
            email: 'admin@localhost',
            username: username,
            password: hashedPassword,
            role: 'admin',
            apiKey: apiKey,
            isActive: true,
            lastLogin: null,
            createdAt: now,
            updatedAt: now,
         }]);

         console.log(`[Migration] Created initial admin user: ${username}`);
         console.log('[Migration] IMPORTANT: Update the admin email in Settings after first login!');
      } catch (error) {
         console.log('[Migration Error] Seeding admin user:', error);
      }
   },
   down: async ({ context: queryInterface }) => {
      // Don't remove the admin user on rollback - that would be destructive
      console.log('[Migration] Rollback: Admin user not removed for safety');
   },
};
