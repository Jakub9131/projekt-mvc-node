// models/Room.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const Room = sequelize.define('Room', {
    // Sequelize automatycznie doda pole id jako klucz g³ówny
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Nazwa sali nie mo¿e byæ pusta." }
        }
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: "Pojemnoœæ musi byæ liczb¹ ca³kowit¹." },
            min: { args: [1], msg: "Sala musi pomieœciæ przynajmniej 1 osobê." }
        }
    },
    city: { // NOWOŒÆ: Kolumna na miasto
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Warszawa' // wartoœæ domyœlna dla starych rekordów
    },
    address: { // NOWOŒÆ: Dok³adny adres budynku
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'ul. G³ówna 1'
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Np. Piêtro 1, Skrzyd³o B"
    },
    hasProjector: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hasAirConditioning: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    hasWhiteboard: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: true // Automatycznie doda kolumny createdAt i updatedAt
});

module.exports = Room;