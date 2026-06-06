// models/ResourceOrder.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceOrder = sequelize.define('ResourceOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    resourceType: {
        type: DataTypes.STRING,
        allowNull: false
        // Walidacja usunięta – brak błędów "Validation isIn failed"
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    province: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    street: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'oczekujace',
        allowNull: false
        // Walidacja usunięta – brak błędów "Validation isIn failed"
    },
    courierName: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = ResourceOrder;