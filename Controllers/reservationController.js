// controllers/reservationController.js
const { Op } = require('sequelize');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Wyświetlanie formularza i listy rezerwacji dla konkretnej sali
exports.getRoomReservations = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Pobieramy salę wraz z rezerwacjami posortowanymi chronologicznie
        const room = await Room.findByPk(roomId, {
            include: [{
                model: Reservation,
                include: [User]
            }],
            order: [[Reservation, 'startTime', 'ASC']]
        });

        if (!room) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono takiej sali.' });
        }

        // Pobieramy wszystkich pracowników z rolą 'user' do listy rozwijanej dla Admina
        const allUsers = await User.findAll({ where: { role: 'user' }, order: [['lastName', 'ASC']] });

        res.render('room-reservations', {
            room,
            reservations: room.Reservations,
            users: allUsers,
            currentUser: req.session.user,
            errorMessage: req.query.error || null // Przechwytywanie błędu przekazanego w URL
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { errorMessage: 'Błąd ładowania harmonogramu sali.' });
    }
};

// Zmiana w tworzeniu rezerwacji - integracja z dynamicznymi komunikatami błędów
exports.createReservation = async (req, res) => {
    let { roomId } = req.params;
    try {
        const { title, startTime, endTime, targetUserId } = req.body;

        // Funkcja pomocnicza do przeładowania strony z błędem bez niszczenia kontekstu aplikacji
        const reloadWithError = async (msg) => {
            const room = await Room.findByPk(roomId, {
                include: [{ model: Reservation, include: [User] }],
                order: [[Reservation, 'startTime', 'ASC']]
            });
            const allUsers = await User.findAll({ where: { role: 'user' }, order: [['lastName', 'ASC']] });
            return res.status(400).render('room-reservations', {
                room,
                reservations: room.Reservations,
                users: allUsers,
                currentUser: req.session.user,
                errorMessage: msg // Wyświetli piękny czerwony boks na tej samej stronie!
            });
        };

        // 1. USTALANIE USERA (Kto jest właścicielem)
        let finalUserId;
        if (req.session.user.role === 'admin') {
            if (!targetUserId || targetUserId === '') {
                return await reloadWithError('🛑 Jako Administrator musisz wybrać pracownika z listy.');
            }
            finalUserId = targetUserId;
        } else {
            finalUserId = req.session.user.id;
        }

        const chosenUser = await User.findByPk(finalUserId);
        if (!chosenUser || chosenUser.role !== 'user') {
            return await reloadWithError('🛑 Rezerwacja jest możliwa wyłącznie dla kont o typie pracownika (USER).');
        }

        // 2. KONWERSJA DAT NA OBIEKTY JS
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return await reloadWithError('🛑 Podano nieprawidłowy lub niepełny format daty i godziny.');
        }
        if (start < now) {
            return await reloadWithError('🛑 Nie możesz rezerwować sali w czasie przeszłym! Wybierz aktualną lub przyszłą godzinę.');
        }
        if (start >= end) {
            return await reloadWithError('🛑 Czas zakończenia spotkania musi być późniejszy niż czas jego rozpoczęcia.');
        }

        // 3. WALIDACJA RAM GODZINOWYCH (Dostępność sali 7:00 - 23:00)
        const startHour = start.getHours();
        const endHour = end.getHours();
        const endMinutes = end.getMinutes();

        if (startHour < 7 || startHour >= 23) {
            return await reloadWithError('🛑 Sala jest zamknięta. Rezerwacji można dokonywać tylko od godziny 07:00.');
        }
        if (endHour > 23 || (endHour === 23 && endMinutes > 0)) {
            return await reloadWithError('🛑 Sala musi zostać zwolniona maksymalnie o godzinie 23:00.');
        }

        // 4. WALIDACJA CZASU TRWANIA (Minimum 1 godzina, Maksimum 12 godzin)
        const durationInHours = (end - start) / (1000 * 60 * 60);

        if (durationInHours < 1) {
            return await reloadWithError('🛑 Minimalny czas rezerwacji sali konferencyjnej to 1 godzina.');
        }
        if (durationInHours > 12) {
            return await reloadWithError('🛑 Maksymalny dopuszczalny czas trwania jednej rezerwacji to 12 godzin.');
        }

        // 5. SPRAWDZANIE KOLIZJI TERMINÓW (Anti-Overlapping Check)
        const overlappingReservation = await Reservation.findOne({
            where: {
                roomId: roomId,
                [Op.and]: [
                    { startTime: { [Op.lt]: end } },
                    { endTime: { [Op.gt]: start } }
                ]
            }
        });

        if (overlappingReservation) {
            return await reloadWithError(`🛑 Kolizja terminów! W tych godzinach sala jest już zajęta przez spotkanie: "${overlappingReservation.title}".`);
        }

        // 6. ZAPIS DO BAZY DANYCH
        await Reservation.create({
            title: title.trim(),
            startTime,
            endTime,
            roomId,
            userId: finalUserId
        });

        res.redirect(`/rooms/${roomId}/reservations`);

    } catch (error) {
        console.error('Krytyczny błąd walidacji rezerwacji:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd serwera podczas weryfikacji rezerwacji.' });
    }
};

// Usuwanie rezerwacji (Tylko dla Admina) z podaniem powodu
exports.deleteReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { reason } = req.body;

        const reservation = await Reservation.findByPk(reservationId, { include: [Room] });

        if (!reservation) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono takiej rezerwacji.' });
        }

        const savedRoomId = reservation.roomId;
        const formattedDate = new Date(reservation.startTime).toLocaleString('pl-PL');

        // Tworzenie powiadomienia systemowego dla użytkownika o usunięciu jego rezerwacji
        await Notification.create({
            userId: reservation.userId,
            message: `⚠️ Twoja rezerwacja "${reservation.title}" (${formattedDate}) w sali "${reservation.Room ? reservation.Room.name : 'Nieznana'}" została ODWOŁANA przez Administratora. Powód: "${reason}"`
        });

        await reservation.destroy();
        res.redirect(`/rooms/${savedRoomId}/reservations`);

    } catch (error) {
        console.error('Błąd podczas usuwania rezerwacji z powodem:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się usunąć rezerwacji.' });
    }
};

// Anulowanie rezerwacji przez zwykłego pracownika (Minimum 48h przed)
exports.cancelReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const currentUserId = req.session.user.id;

        const reservation = await Reservation.findByPk(reservationId);

        if (!reservation) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono takiej rezerwacji.' });
        }

        if (reservation.userId !== currentUserId) {
            return res.status(403).render('error', { errorMessage: '🛑 Nie masz uprawnień do anulowania tej rezerwacji.' });
        }

        // Walidacja czasu: 48h przed spotkaniem
        const now = new Date();
        const eventStart = new Date(reservation.startTime);
        const hoursDifference = (eventStart - now) / (1000 * 60 * 60);

        if (hoursDifference < 48) {
            return res.status(400).render('error', {
                errorMessage: '🛑 Za późno! Rezerwację możesz anulować samodzielnie najpóźniej na 48 godzin przed jej rozpoczęciem. W nagłych wypadkach skontaktuj się z administratorem.'
            });
        }

        await reservation.destroy();
        res.redirect('/profile');

    } catch (error) {
        console.error('Błąd podczas anulowania rezerwacji:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd serwera podczas próby anulowania rezerwacji.' });
    }
};

// Pomocniczy menedżer widoku strony harmonogramu
exports.getRoomRoomsReservationsPage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findByPk(roomId, {
            include: [{ model: Reservation, include: [User] }],
            order: [[Reservation, 'startTime', 'ASC']]
        });

        if (!room) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono takiej sali.' });
        }

        res.render('room-reservations', {
            room,
            reservations: room.Reservations,
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Błąd podczas ładowania strony rezerwacji:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd podczas ładowania harmonogramu sali.' });
    }
};

// NOWOŚĆ: Edycja istniejącej rezerwacji przez Administratora z kompletem walidacji (Anti-Overlapping Check)
exports.updateReservationByAdmin = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { title, startTime, endTime, targetUserId } = req.body;

        console.log(`[SYSTEM] Administrator próbuje edytować rezerwację o ID: ${reservationId}`);

        // 1. Sprawdzamy czy modyfikowana rezerwacja istnieje
        const reservation = await Reservation.findByPk(reservationId);
        if (!reservation) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono wskazanej rezerwacji do edycji.' });
        }

        const roomId = reservation.roomId;

        // Funkcja pomocnicza przekierowująca błąd z zachowaniem czytelności panelu harmonogramu
        const reloadProfileWithEditError = async (msg) => {
            const room = await Room.findByPk(roomId, {
                include: [{ model: Reservation, include: [User] }],
                order: [[Reservation, 'startTime', 'ASC']]
            });
            const allUsers = await User.findAll({ where: { role: 'user' }, order: [['lastName', 'ASC']] });
            return res.status(400).render('room-reservations', {
                room,
                reservations: room.Reservations,
                users: allUsers,
                currentUser: req.session.user,
                errorMessage: msg // Wyświetli ładny czerwony boks z błędem edycji
            });
        };

        // 2. Walidacja obecności wymaganych pól
        if (!title || !startTime || !endTime || !targetUserId) {
            return await reloadProfileWithEditError('🛑 Wszystkie pola formularza edycji są wymagane.');
        }

        // 3. Konwersja i logiczna weryfikacja dat i godzin
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return await reloadProfileWithEditError('🛑 Podano nieprawidłowy format daty lub godziny.');
        }
        if (start >= end) {
            return await reloadProfileWithEditError('🛑 Czas zakończenia spotkania musi być późniejszy niż czas rozpoczęcia.');
        }

        // 4. Walidacja ram godzinowych (07:00 - 23:00)
        const startHour = start.getHours();
        const endHour = end.getHours();
        const endMinutes = end.getMinutes();

        if (startHour < 7 || startHour >= 23) {
            return await reloadProfileWithEditError('🛑 Sala jest zamknięta. Rezerwacji można dokonywać od godziny 07:00.');
        }
        if (endHour > 23 || (endHour === 23 && endMinutes > 0)) {
            return await reloadProfileWithEditError('🛑 Sala musi zostać zwolniona maksymalnie o godzinie 23:00.');
        }

        // 5. Walidacja czasu trwania (Min 1h, Max 12h)
        const durationInHours = (end - start) / (1000 * 60 * 60);
        if (durationInHours < 1) {
            return await reloadProfileWithEditError('🛑 Minimalny czas rezerwacji sali konferencyjnej to 1 godzina.');
        }
        if (durationInHours > 12) {
            return await reloadProfileWithEditError('🛑 Maksymalny dopuszczalny czas trwania jednej rezerwacji to 12 godzin.');
        }

        // 6. ZAAWANSOWANY ANTI-OVERLAPPING CHECK
        // Szukamy kolizji, wykluczając ID aktualnie edytowanej rezerwacji [Op.ne]: reservationId
        const overlappingReservation = await Reservation.findOne({
            where: {
                roomId: roomId,
                id: { [Op.ne]: reservationId }, // IGNORUJEMY sprawdzanie kolizji z samym sobą
                [Op.and]: [
                    { startTime: { [Op.lt]: end } },
                    { endTime: { [Op.gt]: start } }
                ]
            }
        });

        if (overlappingReservation) {
            return await reloadProfileWithEditError(`🛑 Kolizja terminów! W wybranych godzinach sala jest już zajęta przez spotkanie: "${overlappingReservation.title}".`);
        }

        // 7. Generowanie powiadomienia systemowego dla pracownika o zmianie jego rezerwacji przez Admina
        if (reservation.userId !== parseInt(targetUserId, 10) || reservation.startTime.getTime() !== start.getTime()) {
            const formattedDate = start.toLocaleString('pl-PL');
            await Notification.create({
                userId: targetUserId,
                message: `ℹ️ Administrator zmodyfikował szczegóły Twojej rezerwacji "${title.trim()}". Nowy termin rozpoczęcia: ${formattedDate}.`
            });
        }

        // 8. Zapis zmian w bazie PostgreSQL
        await reservation.update({
            title: title.trim(),
            startTime: start,
            endTime: end,
            userId: targetUserId
        });

        console.log(`[SYSTEM] Rezerwacja ID: ${reservationId} została pomyślnie zaktualizowana przez Admina.`);
        res.redirect(`/rooms/${roomId}/reservations`);

    } catch (error) {
        console.error('Krytyczny błąd podczas edycji rezerwacji przez admina:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd serwera podczas aktualizacji rezerwacji.' });
    }
};