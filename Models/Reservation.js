// models/Reservation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfterToday(value) {
                if (new Date(value) < new Date()) {
                    throw new Error('Data rozpoczêcia nie mo¿e byæ z przesz³oœci.');
                }
            }
        }
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfterStartTime(value) {
                if (new Date(value) <= new Date(this.startTime)) {
                    throw new Error('Data zakoñczenia musi byæ póŸniejsza ni¿ data rozpoczêcia.');
                }
            }
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Podaj cel rezerwacji / tytu³ spotkania." } }
    }
}, {
    timestamps: true
});

module.exports = Reservation;