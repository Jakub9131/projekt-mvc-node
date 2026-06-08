const bcrypt = require('bcrypt');
const session = require('express-session');
const express = require('express');
const sequelize = require('./config/database');
const ResourceOrder = require('./models/ResourceOrder');

//Import modeli
const Room = require('./models/Room');
const User = require('./models/User');
const Reservation = require('./models/Reservation');
const Notification = require('./models/Notification');

const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;

User.hasMany(Reservation, { foreignKey: 'userId', onDelete: 'CASCADE' });
Reservation.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ResourceOrder, { foreignKey: 'userId', onDelete: 'CASCADE' });
ResourceOrder.belongsTo(User, { foreignKey: 'userId' });

Room.hasMany(Reservation, { foreignKey: 'roomId', onDelete: 'CASCADE' });
Reservation.belongsTo(Room, { foreignKey: 'roomId' });


//Konfiguracja mechanizmu sesji
app.use(session({
    secret: 'super_tajny_klucz_projektu_deskzone',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(async (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            res.locals.currentUser = req.session.user;
            req.user = req.session.user;

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

const roomRoutes = require('./routes/roomRoutes');
app.use('/', roomRoutes);

const reservationRoutes = require('./routes/reservationRoutes');
app.use('/', reservationRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

const statsRoutes = require('./routes/statsRoutes');
app.use('/', statsRoutes);

const resourceRoutes = require('./routes/resourceRoutes');
app.use('/', resourceRoutes);

app.use((req, res) => {
    res.status(404).render('error', { errorMessage: 'Przepraszamy, szukana strona nie istnieje.' });
});
// Synchronizacja z bazą danych
sequelize.sync({ alter: true })
    .then(async () => {
        console.log('✅ Połączono z PostgreSQL i zsynchronizowano tabele.');

        const userCount = await User.count();
        if (userCount === 0) {
            const hashedPassword = await bcrypt.hash('123456', 10);

            await User.create({
                firstName: 'Jan',
                lastName: 'Kowalski',
                email: 'jan.kowalski@firma.pl',
                role: 'user',
                password: hashedPassword
            });

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