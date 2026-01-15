// Migration: Creates the user table for multi-user support
const { DataTypes } = require('sequelize');

module.exports = {
   up: async ({ context: queryInterface }) => {
      try {
         // Check if table already exists
         const tables = await queryInterface.showAllTables();
         if (tables.includes('user')) {
            console.log('[Migration] User table already exists, skipping...');
            return;
         }

         await queryInterface.createTable('user', {
            ID: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
               allowNull: false,
            },
            email: {
               type: DataTypes.STRING,
               allowNull: false,
               unique: true,
            },
            username: {
               type: DataTypes.STRING,
               allowNull: false,
               unique: true,
            },
            password: {
               type: DataTypes.STRING,
               allowNull: false,
            },
            role: {
               type: DataTypes.STRING,
               allowNull: false,
               defaultValue: 'viewer',
            },
            apiKey: {
               type: DataTypes.STRING,
               allowNull: true,
               unique: true,
            },
            isActive: {
               type: DataTypes.BOOLEAN,
               allowNull: false,
               defaultValue: true,
            },
            lastLogin: {
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
         console.log('[Migration] User table created successfully');
      } catch (error) {
         console.log('[Migration Error] Creating user table:', error);
      }
   },
   down: async ({ context: queryInterface }) => {
      try {
         await queryInterface.dropTable('user');
         console.log('[Migration] User table dropped');
      } catch (error) {
         console.log('[Migration Error] Dropping user table:', error);
      }
   },
};
