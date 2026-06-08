const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');

// Wyświetlanie listy wszystkich sal
exports.getAllRooms = async (req, res) => {
    try {
        const { city } = req.query;

        let whereClause = {};
        if (city && city !== '') {
            whereClause.city = city;
        }

        const rooms = await Room.findAll({ where: whereClause, order: [['name', 'ASC']] });

        const allRoomsForCities = await Room.findAll({ attributes: ['city'] });
        const uniqueCities = [...new Set(allRoomsForCities.map(r => r.city))].sort();

        res.render('index', {
            rooms: rooms,
            cities: uniqueCities,         
            selectedCity: city || ''    
        });

    } catch (error) {
        console.error('Błąd podczas pobierania sal i miast:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd podczas ładowania strony głównej.' });
    }
};

// Wyświetlanie strony głównej
exports.getHomePage = async (req, res) => {
    try {
        const { city } = req.query;

        let whereClause = {};
        if (city && city !== '') {
            whereClause.city = city;
        }

        const rooms = await Room.findAll({ where: whereClause, order: [['name', 'ASC']] });

        const allRoomsForCities = await Room.findAll({ attributes: ['city'] });
        const uniqueCities = [...new Set(allRoomsForCities.map(r => r.city))].sort();

        res.render('index', {
            rooms,
            cities: uniqueCities,
            selectedCity: city || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { errorMessage: 'Błąd ładowania strony głównej.' });
    }
};

// Obsługa wysyłania formularza
exports.createRoom = async (req, res) => {
    try {
        const {
            name,
            capacity,
            location,
            city,
            address,
            hasProjector,
            hasAirConditioning,
            hasWhiteboard
        } = req.body;

        await Room.create({
            name: name.trim(),
            capacity: parseInt(capacity, 10),
            location: location.trim(),
            city: city.trim(),
            address: address.trim(),
            hasProjector: hasProjector === 'on',
            hasAirConditioning: hasAirConditioning === 'on',
            hasWhiteboard: hasWhiteboard === 'on'
        });

        res.redirect('/');
    } catch (error) {
        console.error('Błąd podczas dodawania nowej sali:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się dodać nowej sali.' });
    }
};

// Usuwanie sali
exports.deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        console.log(`[SYSTEM] Próba usunięcia sali o ID: ${roomId}`);

        const room = await Room.findByPk(roomId, {
            include: [{
                model: Reservation,
                include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }]
            }]
        });

        if (!room) {
            console.log(`[SYSTEM] Nie znaleziono sali o ID: ${roomId}`);
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono takiej sali.' });
        }

        const now = new Date();
        const futureReservations = room.Reservations.filter(r => new Date(r.endTime) > now);
        console.log(`[SYSTEM] Znaleziono przyszłych rezerwacji do anulowania: ${futureReservations.length}`);

        if (futureReservations.length > 0) {
            const notificationsToCreate = futureReservations.map(reservation => {
                const formattedDate = new Date(reservation.startTime).toLocaleString('pl-PL');
                return {
                    userId: reservation.userId,
                    message: `⚠️ Twoja rezerwacja "${reservation.title}" zaplanowana na dzień ${formattedDate} w sali "${room.name}" została anulowana, ponieważ Administrator usunął tę salę z systemu.`
                };
            });

            await Notification.bulkCreate(notificationsToCreate);
            console.log(`[SYSTEM] Powiadomienia zostały pomyślnie rozesłane do bazy.`);
        }

        const deletedReservationsCount = await Reservation.destroy({ where: { roomId: roomId } });
        console.log(`[SYSTEM] Usunięto powiązanych rekordów rezerwacji: ${deletedReservationsCount}`);

        await room.destroy();
        console.log(`[SYSTEM] Sala "${room.name}" została pomyślnie usunięta z bazy danych.`);

        res.redirect('/');
    } catch (error) {
        console.error('❌ KRYTYCZNY BŁĄD PODCZAS USUWANIA SALI:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się usunąć sali. Szczegóły błędu loguje terminal serwera.' });
    }
};

//Aktualizacja danych istniejącej sali przez Admina
exports.updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const {
            name,
            capacity,
            location,
            city,
            address,
            hasProjector,
            hasAirConditioning,
            hasWhiteboard
        } = req.body;

        console.log(`[SYSTEM] Próba aktualizacji danych sali ID: ${roomId}`);

        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono wskazanej sali do edycji.' });
        }

        await room.update({
            name: name.trim(),
            capacity: parseInt(capacity, 10),
            location: location.trim(),
            city: city.trim(),
            address: address.trim(),
            hasProjector: hasProjector === 'on',
            hasAirConditioning: hasAirConditioning === 'on',
            hasWhiteboard: hasWhiteboard === 'on'
        });

        console.log(`[SYSTEM] Pomyślnie zaktualizowano dane sali: "${name}"`);

        res.redirect('/');
    } catch (error) {
        console.error('❌ BŁĄD PODCZAS AKTUALIZACJI SALI:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd serwera podczas zapisywania zmian w sali.' });
    }
};