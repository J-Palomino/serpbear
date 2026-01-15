// Migration: Adds city, latlong and settings keyword to keyword table.
const { DataTypes } = require('sequelize');

// Umzug Migration (receives queryInterface as context)
module.exports = {
   up: async ({ context: queryInterface }) => {
      try {
         const keywordTableDefinition = await queryInterface.describeTable('keyword');
         if (keywordTableDefinition) {
            if (!keywordTableDefinition.city) {
               await queryInterface.addColumn('keyword', 'city', { type: DataTypes.STRING });
            }
            if (!keywordTableDefinition.latlong) {
               await queryInterface.addColumn('keyword', 'latlong', { type: DataTypes.STRING });
            }
            if (!keywordTableDefinition.settings) {
               await queryInterface.addColumn('keyword', 'settings', { type: DataTypes.STRING });
            }
         }
      } catch (error) {
         console.log('migration error:', error);
      }
   },
   down: async ({ context: queryInterface }) => {
      try {
         const keywordTableDefinition = await queryInterface.describeTable('keyword');
         if (keywordTableDefinition) {
            if (keywordTableDefinition.city) {
               await queryInterface.removeColumn('keyword', 'city');
            }
            if (keywordTableDefinition.latlong) {
               await queryInterface.removeColumn('keyword', 'latlong');
            }
            if (keywordTableDefinition.settings) {
               await queryInterface.removeColumn('keyword', 'settings');
            }
         }
      } catch (error) {
         console.log('migration error:', error);
      }
   },
};
