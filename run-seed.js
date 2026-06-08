const { Sequelize } = require('sequelize');
const sequelize = require('./config/database');
const seeder = require('./seeders/demo-data');

async function run() {
    try {
        console.log('⏳ [SEEDER] Nawiązywanie połączenia z bazą danych...');

        const queryInterface = sequelize.getQueryInterface();

        console.log('🚀 [SEEDER] Rozpoczynam zasilanie bazy danych DeskZone...');
        await seeder.up(queryInterface, Sequelize);

        console.log('🎉 [SYSTEM] Sukces! Baza danych została pomyślnie zasilona danymi demo.');
        process.exit(0);
    } catch (error) {
        console.error('❌ [BŁĄD] Coś poszło nie tak podczas ręcznego seedowania:', error);
        process.exit(1);
    }
}

run();