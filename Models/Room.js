const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const Room = sequelize.define('Room', {
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
    city: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Warszawa'
    },
    address: {
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
    timestamps: true
});

module.exports = Room;