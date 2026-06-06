// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Imiê nie mo¿e byæ puste." } }
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Nazwisko nie mo¿e byæ puste." } }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Adres e-mail musi byæ unikalny w bazie
        validate: {
            isEmail: { msg: "WprowadŸ poprawny adres e-mail." },
            notEmpty: { msg: "E-mail nie mo¿e byæ pusty." }
        }
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user', // Ka¿dy nowy u¿ytkownik jest domyœlnie zwyk³ym pracownikiem
        validate: {
            isIn: {
                args: [['user', 'admin']],
                msg: "Rola musi byæ typu: user lub admin."
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Has³o nie mo¿e byæ puste." },
            len: { args: [6, 100], msg: "Has³o musi mieæ co najmniej 6 znaków." }
        }
    }

}, {
    timestamps: true
});

module.exports = User;