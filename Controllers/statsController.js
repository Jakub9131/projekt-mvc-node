// controllers/statsController.js
const { sequelize } = require('../config/database');
const Room = require('../models/Room');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { Sequelize } = require('sequelize');

exports.getStatsPage = async (req, res) => {
    try {
        // 1. Proste liczniki (Ogólne podsumowanie)
        const totalRooms = await Room.count();
        const totalReservations = await Reservation.count();
        // POPRAWKA: Liczymy tylko osoby z rol¹ 'user'
        const totalUsers = await User.count({ where: { role: 'user' } });

        // 2. Najpopularniejsza sala (Grupowanie po roomId i liczenie wyst¹pieñ)
        const mostPopularRoomData = await Reservation.findOne({
            attributes: [
                'roomId',
                [Sequelize.fn('COUNT', Sequelize.col('roomId')), 'reservationCount']
            ],
            group: ['roomId', 'Room.id'], // Grupowanie po ID sali
            include: [{ model: Room, attributes: ['name'] }], // Pobieramy nazwê sali
            order: [[Sequelize.literal('\"reservationCount\"'), 'DESC']], // Sortujemy od najwiêkszej liczby
            limit: 1
        });

        // 3. Ranking u¿ytkowników (Kto zrobi³ najwiêcej rezerwacji)
        const userRanking = await Reservation.findAll({
            attributes: [
                'userId',
                [Sequelize.fn('COUNT', Sequelize.col('userId')), 'userReservationCount']
            ],
            group: ['userId', 'User.id'],
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'email'],
                where: { role: 'user' } // TO DODAJE BLOKADÊ DLA ADMINA W RANKINGU
            }],
            order: [[Sequelize.literal('\"userReservationCount\"'), 'DESC']],
            limit: 5
        });

        // Renderujemy nowy widok i przekazujemy zebrane dane
        res.render('stats', {
            totalRooms,
            totalUsers,
            totalReservations,
            mostPopularRoom: mostPopularRoomData ? mostPopularRoomData.Room.name : 'Brak danych',
            mostPopularCount: mostPopularRoomData ? mostPopularRoomData.getDataValue('reservationCount') : 0,
            userRanking
        });

    } catch (error) {
        console.error('B³¹d podczas generowania statystyk:', error);
        res.status(500).render('error', { errorMessage: 'Wyst¹pi³ b³¹d podczas ³adowania panelu analitycznego.' });
    }
};