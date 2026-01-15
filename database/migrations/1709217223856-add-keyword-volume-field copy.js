// Migration: Adds volume field to the keyword table.
const { DataTypes } = require('sequelize');

// Umzug Migration (receives queryInterface as context)
module.exports = {
   up: async ({ context: queryInterface }) => {
      try {
         const keywordTableDefinition = await queryInterface.describeTable('keyword');
         if (keywordTableDefinition) {
            if (!keywordTableDefinition.volume) {
               await queryInterface.addColumn('keyword', 'volume', {
                  type: DataTypes.STRING, allowNull: false, defaultValue: '0',
               });
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
            if (keywordTableDefinition.volume) {
               await queryInterface.removeColumn('keyword', 'volume');
            }
         }
      } catch (error) {
         console.log('migration error:', error);
      }
   },
};
