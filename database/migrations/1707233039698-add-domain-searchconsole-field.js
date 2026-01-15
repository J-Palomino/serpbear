// Migration: Adds search_console field to domain table to assign search console property type, url and api.
const { DataTypes } = require('sequelize');

// Umzug Migration (receives queryInterface as context)
module.exports = {
   up: async ({ context: queryInterface }) => {
      try {
         const domainTableDefinition = await queryInterface.describeTable('domain');
         if (domainTableDefinition && !domainTableDefinition.search_console) {
            await queryInterface.addColumn('domain', 'search_console', { type: DataTypes.STRING });
         }
      } catch (error) {
         console.log('migration error:', error);
      }
   },
   down: async ({ context: queryInterface }) => {
      try {
         const domainTableDefinition = await queryInterface.describeTable('domain');
         if (domainTableDefinition && domainTableDefinition.search_console) {
            await queryInterface.removeColumn('domain', 'search_console');
         }
      } catch (error) {
         console.log('migration error:', error);
      }
   },
};
