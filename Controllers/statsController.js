const { sequelize } = require('../config/database');
const Room = require('../models/Room');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { Sequelize } = require('sequelize');

exports.getStatsPage = async (req, res) => {
    try {
        const totalRooms = await Room.count();
        const totalReservations = await Reservation.count();
        const totalUsers = await User.count({ where: { role: 'user' } });

        const mostPopularRoomData = await Reservation.findOne({
            attributes: [
                'roomId',
                [Sequelize.fn('COUNT', Sequelize.col('roomId')), 'reservationCount']
            ],
            group: ['roomId', 'Room.id'],
            include: [{ model: Room, attributes: ['name'] }],
            order: [[Sequelize.literal('\"reservationCount\"'), 'DESC']],
            limit: 1
        });

        //Ranking u¿ytkowników
        const userRanking = await Reservation.findAll({
            attributes: [
                'userId',
                [Sequelize.fn('COUNT', Sequelize.col('userId')), 'userReservationCount']
            ],
            group: ['userId', 'User.id'],
            include: [{
                model: User,
                attributes: ['firstName', 'lastName', 'email'],
                where: { role: 'user' }
            }],
            order: [[Sequelize.literal('\"userReservationCount\"'), 'DESC']],
            limit: 5
        });

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