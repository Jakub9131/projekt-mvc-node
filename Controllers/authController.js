// controllers/authController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Notification = require('../models/Notification');

// Wyświetlanie strony logowania i rejestracji
exports.getAuthPage = (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('auth');
};

// Obsługa rejestracji nowego użytkownika
exports.register = async (req, res) => {
    try {
        let { firstName, lastName, email, password, confirmPassword } = req.body;

        // 1. Walidacja i czyszczenie spacji (Sanitazyzacja danych)
        firstName = firstName ? firstName.trim() : '';
        lastName = lastName ? lastName.trim() : '';
        email = email ? email.trim().toLowerCase() : '';

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).render('auth', {
                errorMessage: 'Wszystkie pola są wymagane.',
                isRegisterError: true
            });
        }

        // 2. Walidacja tożsamości haseł na backendzie
        if (password !== confirmPassword) {
            return res.status(400).render('auth', {
                errorMessage: 'Podane hasła nie są identyczne.',
                isRegisterError: true
            });
        }

        // 3. Walidacja siły hasła na backendzie (Min. 8 znaków, 1 wielka litera, 1 cyfra)
        const passwordRegex = /(?=.*\d)(?=.*[A-Z]).{8,}/;
        if (!passwordRegex.test(password)) {
            return res.status(400).render('auth', {
                errorMessage: 'Hasło musi mieć min. 8 znaków, zawierać co najmniej jedną wielką literę i jedną cyfrę.',
                isRegisterError: true
            });
        }

        // 4. Sprawdzamy, czy użytkownik o takim mailu już istnieje
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).render('auth', {
                errorMessage: 'Użytkownik o podanym adresie e-mail już istnieje w systemie.',
                isRegisterError: true
            });
        }

        // Hashujemy hasło przed zapisem do bazy
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tworzymy użytkownika w bazie (domyślnie z rolą 'user')
        await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'user'
        });

        // Po udanej rejestracji przekierowujemy na stronę logowania
        res.redirect('/auth');
    } catch (error) {
        console.error(error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message).join(', ');
            return res.status(400).render('auth', { errorMessage: messages, isRegisterError: true });
        }
        res.status(500).render('error', { errorMessage: 'Błąd serwera podczas rejestracji.' });
    }
};

// Obsługa logowania
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Czyszczenie danych wejściowych logowania
        email = email ? email.trim().toLowerCase() : '';

        if (!email || !password) {
            return res.status(400).render('auth', { errorMessage: 'Wprowadź adres e-mail oraz hasło.' });
        }

        // Szukamy użytkownika w bazie po adresie e-mail
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).render('auth', { errorMessage: 'Nieprawidłowy e-mail lub hasło.' });
        }

        // Porównujemy wpisane hasło z hashem zapisanym w bazie danych
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('auth', { errorMessage: 'Nieprawidłowy e-mail lub hasło.' });
        }

        // Zapisujemy dane użytkownika w sesji (oprócz hasła dla bezpieczeństwa)
        req.session.user = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { errorMessage: 'Błąd serwera podczas logowania.' });
    }
};

// Obsługa wylogowania
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).render('error', { errorMessage: 'Nie udało się wylogować.' });
        }
        res.clearCookie('connect.sid');
        res.redirect('/auth');
    });
};

// Wyświetlanie profilu i listy pracowników
exports.getProfilePage = async (req, res) => {
    try {
        let allUsers = [];
        let userReservations = [];
        const currentUserId = req.session.user.id;

        if (req.session.user.role === 'admin') {
            allUsers = await User.findAll({ order: [['lastName', 'ASC']] });
        } else {
            userReservations = await Reservation.findAll({
                where: { userId: currentUserId },
                include: [Room],
                order: [['startTime', 'ASC']]
            });
        }

        res.render('profile', {
            user: req.session.user,
            allUsers: allUsers,
            userReservations: userReservations,
            currentUser: req.session.user,
            errorMessage: req.query.error || null // Możliwość przechwycenia komunikatu błędu z URL
        });
    } catch (error) {
        console.error('Błąd podczas ładowania profilu:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się załadować profilu.' });
    }
};

// Logika tworzenia użytkownika przez Admina
exports.createUserByAdmin = async (req, res) => {
    try {
        let { firstName, lastName, email, password, role } = req.body;

        firstName = firstName ? firstName.trim() : '';
        lastName = lastName ? lastName.trim() : '';
        email = email ? email.trim().toLowerCase() : '';

        // Funkcja pomocnicza do przeładowania strony profilu z błędem walidacji
        const reloadProfileWithError = async (msg) => {
            const allUsers = await User.findAll({ order: [['lastName', 'ASC']] });
            return res.status(400).render('profile', {
                user: req.session.user,
                allUsers: allUsers,
                userReservations: [],
                currentUser: req.session.user,
                errorMessage: msg
            });
        };

        // Sprawdzamy czy mail nie jest zajęty
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return await reloadProfileWithError('🛑 Użytkownik o takim adresie e-mail już istnieje.');
        }

        // Weryfikacja hasła nadawanego przez Admina
        if (!password || password.length < 8) {
            return await reloadProfileWithError('🛑 Hasło pracownika musi mieć przynajmniej 8 znaków.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd podczas tworzenia użytkownika.' });
    }
};

// NOWOŚĆ: Aktualizacja danych pracownika przez Admina
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        let { firstName, lastName, email, role } = req.body;

        firstName = firstName ? firstName.trim() : '';
        lastName = lastName ? lastName.trim() : '';
        email = email ? email.trim().toLowerCase() : '';

        const userToUpdate = await User.findByPk(userId);
        if (!userToUpdate) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono wskazanego użytkownika.' });
        }

        // Sprawdzamy czy nowy e-mail nie jest zajęty przez innego użytkownika
        if (email !== userToUpdate.email) {
            const emailCheck = await User.findOne({ where: { email } });
            if (emailCheck) {
                // Generowanie błędu przekazywanego w query parametrze dla zachowania spójności
                return res.redirect(`/profile?error=${encodeURIComponent('🛑 Podany adres e-mail jest już zajęty przez innego pracownika.')}`);
            }
        }

        // Aktualizacja rekordu
        await userToUpdate.update({
            firstName,
            lastName,
            email,
            role: role || 'user'
        });

        // Jeśli admin edytował własne konto, aktualizujemy jego dane w aktywnej sesji
        if (req.session.user.id === parseInt(userId, 10) || req.session.user.id === userId) {
            req.session.user.firstName = firstName;
            req.session.user.lastName = lastName;
            req.session.user.email = email;
            req.session.user.role = role;
        }

        res.redirect('/profile');
    } catch (error) {
        console.error('Błąd edycji użytkownika przez admina:', error);
        res.status(500).render('error', { errorMessage: 'Wystąpił błąd serwera podczas zapisywania zmian użytkownika.' });
    }
};

// NOWOŚĆ: Usuwanie konta użytkownika przez Admina
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentAdminId = req.session.user.id;

        // Zabezpieczenie przed usunięciem samego siebie
        if (parseInt(userId, 10) === currentAdminId || userId === currentAdminId) {
            return res.status(400).render('error', { errorMessage: '🛑 Nie możesz usunąć swojego własnego konta administratora!' });
        }

        const userToDelete = await User.findByPk(userId);
        if (!userToDelete) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono użytkownika o podanym ID.' });
        }

        // Kaskadowe czyszczenie bazy danych (usuwanie rezerwacji pracownika przed kontem)
        await Reservation.destroy({ where: { userId: userId } });

        // Usunięcie konta
        await userToDelete.destroy();
        res.redirect('/profile');
    } catch (error) {
        console.error('Błąd podczas usuwania użytkownika:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się usunąć użytkownika z systemu.' });
    }
};

// Obsługa powiadomień
exports.markNotificationsAsRead = async (req, res) => {
    try {
        const currentUserId = req.session.user.id;

        await Notification.update(
            { isRead: true },
            { where: { userId: currentUserId, isRead: false } }
        );

        console.log(`[SYSTEM] Użytkownik ID: ${currentUserId} oznaczył powiadomienia jako przeczytane.`);
        res.redirect('/');
    } catch (error) {
        console.error('Błąd podczas odczytywania powiadomień:', error);
        res.status(500).render('error', { errorMessage: 'Nie udało się zaktualizować statusu powiadomień.' });
    }
};