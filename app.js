// app.js
const bcrypt = require('bcrypt');
const session = require('express-session');
const express = require('express');
const sequelize = require('./config/database');
const ResourceOrder = require('./models/ResourceOrder');

// Import modeli
const Room = require('./models/Room');
const User = require('./models/User');
const Reservation = require('./models/Reservation');
const Notification = require('./models/Notification');

const app = express();
// Konfiguracja silnika widoków EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware do obsługi danych z formularzy (POST) oraz plików statycznych (CSS)
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;

// DEFINICJA RELACJI (Asocjacje)
// Użytkownik ma wiele rezerwacji, rezerwacja należy do jednego użytkownika
User.hasMany(Reservation, { foreignKey: 'userId', onDelete: 'CASCADE' });
Reservation.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ResourceOrder, { foreignKey: 'userId', onDelete: 'CASCADE' });
ResourceOrder.belongsTo(User, { foreignKey: 'userId' });

// Sala ma wiele rezerwacji, rezerwacja dotyczy jednej sali
Room.hasMany(Reservation, { foreignKey: 'roomId', onDelete: 'CASCADE' });
Reservation.belongsTo(Room, { foreignKey: 'roomId' });


// Konfiguracja mechanizmu sesji
app.use(session({
    secret: 'super_tajny_klucz_projektu_deskzone', // Klucz szyfrujący sesję
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Sesja wygasa po 24 godzinach
}));

// Globalny middleware udostępniający dane zalogowanego usera w widokach EJS
app.use(async (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            res.locals.currentUser = req.session.user;
            req.user = req.session.user;

            // Pobieramy nieprzeczytane powiadomienia dla zalogowanego użytkownika
            const notifications = await Notification.findAll({
                where: { userId: req.session.user.id, isRead: false },
                order: [['createdAt', 'DESC']]
            });
            res.locals.userNotifications = notifications;
        } else {
            res.locals.currentUser = null;
            req.user = null;
            res.locals.userNotifications = [];
        }
        next();
    } catch (error) {
        next(error);
    }
});

// ==========================================
// REJESTRACJA ROUTERÓW (Musi być POD sesjami!)
// ==========================================

const roomRoutes = require('./routes/roomRoutes');
app.use('/', roomRoutes);

const reservationRoutes = require('./routes/reservationRoutes');
app.use('/', reservationRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

const statsRoutes = require('./routes/statsRoutes');
app.use('/', statsRoutes);

const resourceRoutes = require('./routes/resourceRoutes');
app.use('/', resourceRoutes); // <-- Ta linijka musi tu być!

// Obsługa błędu 404 (Zawsze na samym końcu tras!)
app.use((req, res) => {
    res.status(404).render('error', { errorMessage: 'Przepraszamy, szukana strona nie istnieje.' });
});
// Synchronizacja z bazą danych
sequelize.sync({ alter: true })
    .then(async () => {
        console.log('✅ Połączono z PostgreSQL i zsynchronizowano tabele.');

        // Sprawdzamy czy tabela użytkowników jest pusta
        const userCount = await User.count();
        if (userCount === 0) {
            // Generujemy bezpieczne, zahashowane hasło (np. '123456')
            const hashedPassword = await bcrypt.hash('123456', 10);

            // 1. Tworzymy startowego zwykłego użytkownika
            await User.create({
                firstName: 'Jan',
                lastName: 'Kowalski',
                email: 'jan.kowalski@firma.pl',
                role: 'user',
                password: hashedPassword // Przechowujemy hash, nie czysty tekst!
            });

            // 2. Tworzymy startowego Administratora
            await User.create({
                firstName: 'Tomasz',
                lastName: 'Adminowski',
                email: 'tomasz.admin@firma.pl',
                role: 'admin',
                password: hashedPassword
            });

            console.log('👤 Stworzono domyślne konta (Hasło dla obu to: 123456)');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Serwer działa na porcie http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Błąd połączenia z bazą danych:', err);
    });