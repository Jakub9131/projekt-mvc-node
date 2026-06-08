'use strict';
const bcrypt = require('bcrypt');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const saltRounds = 10;
        const passwordUser = await bcrypt.hash('User123!', saltRounds);
        const passwordAdmin = await bcrypt.hash('Admin123!', saltRounds);

        await queryInterface.bulkInsert('Users', [
            {
                firstName: 'Tomasz',
                lastName: 'Adminowski',
                email: 'tomasz@deskzone.pl',
                password: passwordAdmin,
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Jan',
                lastName: 'Kowalski',
                email: 'jan.kowalski@deskzone.pl',
                password: passwordUser,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Anna',
                lastName: 'Nowak',
                email: 'anna.nowak@deskzone.pl',
                password: passwordUser,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Micha³',
                lastName: 'Zieliñski',
                email: 'michal.zielinski@deskzone.pl',
                password: passwordUser,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                firstName: 'Katarzyna',
                lastName: 'Wiœniewska',
                email: 'katarzyna.w@deskzone.pl',
                password: passwordUser,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});

        const [users] = await queryInterface.sequelize.query(`SELECT id, email FROM "Users";`);
        const getUserMap = (email) => users.find(u => u.email === email).id;

        await queryInterface.bulkInsert('Rooms', [
            {
                name: 'Diamentowa',
                city: 'Poznañ',
                address: 'ul. Towarowa 14',
                location: 'Piêtro 2, pokój 204',
                capacity: 12,
                hasProjector: true,
                hasAirConditioning: true,
                hasWhiteboard: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Szklana',
                city: 'Poznañ',
                address: 'ul. Towarowa 14',
                location: 'Piêtro 1, pokój 101',
                capacity: 6,
                hasProjector: false,
                hasAirConditioning: true,
                hasWhiteboard: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Srebrna',
                city: 'Warszawa',
                address: 'Al. Jerozolimskie 45',
                location: 'Piêtro 5, sala zbiorcza A',
                capacity: 20,
                hasProjector: true,
                hasAirConditioning: true,
                hasWhiteboard: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Kameralna',
                city: 'Warszawa',
                address: 'Al. Jerozolimskie 45',
                location: 'Piêtro 5, pokój 512',
                capacity: 4,
                hasProjector: false,
                hasAirConditioning: false,
                hasWhiteboard: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Ba³tycka',
                city: 'Gdañsk',
                address: 'ul. Grunwaldzka 102',
                location: 'Piêtro 3, pokój 302',
                capacity: 10,
                hasProjector: true,
                hasAirConditioning: true,
                hasWhiteboard: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});

        const [rooms] = await queryInterface.sequelize.query(`SELECT id, name FROM "Rooms";`);
        const getRoomMap = (name) => rooms.find(r => r.name === name).id;

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        await queryInterface.bulkInsert('Reservations', [
            {
                title: 'Sprint Planning - Team Alpha',
                startTime: new Date(today.setHours(9, 0, 0, 0)),
                endTime: new Date(today.setHours(11, 0, 0, 0)),
                roomId: getRoomMap('Diamentowa'),
                userId: getUserMap('jan.kowalski@deskzone.pl'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Rozmowa rekrutacyjna Senior Node.js',
                startTime: new Date(today.setHours(12, 0, 0, 0)),
                endTime: new Date(today.setHours(13, 0, 0, 0)),
                roomId: getRoomMap('Kameralna'),
                userId: getUserMap('jan.kowalski@deskzone.pl'), 
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Burza mózgów - Nowy Design SaaS',
                startTime: new Date(today.setHours(14, 0, 0, 0)),
                endTime: new Date(today.setHours(16, 0, 0, 0)),
                roomId: getRoomMap('Diamentowa'),
                userId: getUserMap('anna.nowak@deskzone.pl'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Spotkanie Zarz¹du i Inwestorów',
                startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
                endTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
                roomId: getRoomMap('Srebrna'),
                userId: getUserMap('michal.zielinski@deskzone.pl'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Krótkie spotkanie 1on1',
                startTime: new Date(tomorrow.setHours(15, 30, 0, 0)),
                endTime: new Date(tomorrow.setHours(16, 30, 0, 0)),
                roomId: getRoomMap('Kameralna'),
                userId: getUserMap('katarzyna.w@deskzone.pl'),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Reservations', null, {});
        await queryInterface.bulkDelete('Rooms', null, {});
        await queryInterface.bulkDelete('Users', null, {});
    }
};