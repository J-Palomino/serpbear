// Migration: Creates the invite table for user registration invites
const { DataTypes } = require('sequelize');

module.exports = {
   up: async ({ context: queryInterface }) => {
      try {
         // Check if table already exists
         const tables = await queryInterface.showAllTables();
         if (tables.includes('invite')) {
            console.log('[Migration] Invite table already exists, skipping...');
            return;
         }

         await queryInterface.createTable('invite', {
            ID: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
               allowNull: false,
            },
            token: {
               type: DataTypes.STRING,
               allowNull: false,
               unique: true,
            },
            email: {
               type: DataTypes.STRING,
               allowNull: true,
            },
            role: {
               type: DataTypes.STRING,
               allowNull: false,
               defaultValue: 'viewer',
            },
            createdBy: {
               type: DataTypes.INTEGER,
               allowNull: false,
               references: {
                  model: 'user',
                  key: 'ID',
               },
            },
            expiresAt: {
               type: DataTypes.DATE,
               allowNull: false,
            },
            used: {
               type: DataTypes.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            usedBy: {
               type: DataTypes.INTEGER,
               allowNull: true,
               references: {
                  model: 'user',
                  key: 'ID',
               },
            },
            usedAt: {
               type: DataTypes.DATE,
               allowNull: true,
            },
            createdAt: {
               type: DataTypes.DATE,
               allowNull: false,
            },
            updatedAt: {
               type: DataTypes.DATE,
               allowNull: false,
            },
         });
         console.log('[Migration] Invite table created successfully');
      } catch (error) {
         console.log('[Migration Error] Creating invite table:', error);
      }
   },
   down: async ({ context: queryInterface }) => {
      try {
         await queryInterface.dropTable('invite');
         console.log('[Migration] Invite table dropped');
      } catch (error) {
         console.log('[Migration Error] Dropping invite table:', error);
      }
   },
};
