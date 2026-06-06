// controllers/roomController.js
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');

// Wyświetlanie listy wszystkich sal
exports.getAllRooms = async (req, res) => {
    try {
        // 1. Pobieramy miasto z adresu URL (filtrowanie)
        const { city } = req.query;

        let whereClause = {};
        if (city && city !== '') {
            whereClause.city = city;
        }

        // 2. Pobieramy sale pasujące do wybranego miasta
        const rooms = await Room.findAll({ where: whereClause, order: [['name', 'ASC']] });

        // 3. Wyciągamy z bazy unikalne miasta, żeby zapełnić listę rozwijaną (Select)
        const allRoomsForCities = await Room.findAll({ attributes: ['city'] });
        const uniqueCities = [...new Set(allRoomsForCities.map(r => r.city))].sort();

        // 4. Renderujemy index.ejs i przekazujemy WSZYSTKIE potrzebne zmienne
        res.render('index', {
            rooms: rooms,
            cities: uniqueCities,          // <-- To naprawia błąd "cities is not defined"
            selectedCity: city || ''       // <-- To jest potrzebne do zachowania stanu w select
        });

    } catch (error) {
        console.error('Błąd podczas pobierania sal i miast:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd podczas ładowania strony głównej.' });
    }
};

// Wyświetlanie strony głównej (alternatywny handler)
exports.getHomePage = async (req, res) => {
    try {
        // 1. Pobieramy miasto z adresu URL (np. /?city=Poznan)
        const { city } = req.query;

        let whereClause = {};
        if (city && city !== '') {
            whereClause.city = city; // Jeśli wybrano miasto, dodajemy je do warunku WHERE
        }

        // 2. Pobieramy sale spełniające kryterium wyszukiwania
        const rooms = await Room.findAll({ where: whereClause, order: [['name', 'ASC']] });

        // 3. Pobieramy listę WSZYSTKICH unikalnych miast, jakie istnieją w bazie,
        // żeby dynamicznie zbudować listę w filtrze na stronie głównej
        const allRoomsForCities = await Room.findAll({ attributes: ['city'] });
        const uniqueCities = [...new Set(allRoomsForCities.map(r => r.city))].sort();

        // 4. Renderujemy stronę główną
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

// Obsługa wysyłania formularza - dodawanie nowej sali
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

        // Zapis do bazy danych PostgreSQL
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

        // Po udanym dodaniu wracamy na stronę główną
        res.redirect('/');
    } catch (error) {
        console.error('Błąd podczas dodawania nowej sali:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się dodać nowej sali.' });
    }
};

// Usuwanie sali wraz z kaskadowym czyszczeniem powiązanych danych i wysyłaniem powiadomień
exports.deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        console.log(`[SYSTEM] Próba usunięcia sali o ID: ${roomId}`);

        // 1. Znajdź salę wraz ze wszystkimi przypisanymi rezerwacjami i danymi użytkowników
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

        // 2. Filtrujemy tylko przyszłe rezerwacje, aby powiadomić o nich użytkowników
        const now = new Date();
        const futureReservations = room.Reservations.filter(r => new Date(r.endTime) > now);
        console.log(`[SYSTEM] Znaleziono przyszłych rezerwacji do anulowania: ${futureReservations.length}`);

        // 3. Generujemy i zapisujemy powiadomienia w bazie danych
        if (futureReservations.length > 0) {
            const notificationsToCreate = futureReservations.map(reservation => {
                const formattedDate = new Date(reservation.startTime).toLocaleString('pl-PL');
                return {
                    userId: reservation.userId,
                    message: `⚠️ Twoja rezerwacja "${reservation.title}" zaplanowana na dzień ${formattedDate} w sali "${room.name}" została ANULOWANA, ponieważ Administrator usunął tę salę z systemu.`
                };
            });

            await Notification.bulkCreate(notificationsToCreate);
            console.log(`[SYSTEM] Powiadomienia zostały pomyślnie rozesłane do bazy.`);
        }

        // 4. BEZWZGLĘDNE CZYSZCZENIE REZERWACJI: 
        const deletedReservationsCount = await Reservation.destroy({ where: { roomId: roomId } });
        console.log(`[SYSTEM] Usunięto powiązanych rekordów rezerwacji: ${deletedReservationsCount}`);

        // 5. Dopiero gdy tabela rezerwacji jest czysta, usuwamy samą salę
        await room.destroy();
        console.log(`[SYSTEM] Sala "${room.name}" została pomyślnie usunięta z bazy danych.`);

        // Sukces - wracamy na stronę główną
        res.redirect('/');
    } catch (error) {
        console.error('❌ KRYTYCZNY BŁĄD PODCZAS USUWANIA SALI:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się usunąć sali. Szczegóły błędu loguje terminal serwera.' });
    }
};

// NOWOŚĆ: Aktualizacja danych istniejącej sali przez Administratora
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

        // 1. Szukamy wybranej sali w bazie danych
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono wskazanej sali do edycji.' });
        }

        // 2. Nadpisujemy wartości i wywołujemy zapis w bazie PostgreSQL
        await room.update({
            name: name.trim(),
            capacity: parseInt(capacity, 10),
            location: location.trim(),
            city: city.trim(),
            address: address.trim(),
            // Mapowanie stanu checkboxów ('on' -> true, brak -> false)
            hasProjector: hasProjector === 'on',
            hasAirConditioning: hasAirConditioning === 'on',
            hasWhiteboard: hasWhiteboard === 'on'
        });

        console.log(`[SYSTEM] Pomyślnie zaktualizowano dane sali: "${name}"`);

        // 3. Po pomyślnej modyfikacji przekierowujemy admina na stronę główną
        res.redirect('/');
    } catch (error) {
        console.error('❌ BŁĄD PODCZAS AKTUALIZACJI SALI:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd serwera podczas zapisywania zmian w sali.' });
    }
};