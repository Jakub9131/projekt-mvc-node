// controllers/resourceController.js
const ResourceOrder = require('../models/ResourceOrder');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Statyczna baza dostępnych kurierów i ich rejonów (województw)
const COURIERS_DATABASE = [
    { name: 'DHL Express (Północ)', provinces: ['Pomorskie', 'Zachodniopomorskie', 'Warmińsko-Mazurskie'] },
    { name: 'DPD Polska (Centrum)', provinces: ['Mazowieckie', 'Łódzkie', 'Wielkopolskie'] },
    { name: 'InPost Logistyka (Południe)', provinces: ['Dolnośląskie', 'Śląskie', 'Małopolskie', 'Opolskie'] },
    { name: 'Pocztex Serwis (Wschód)', provinces: ['Lubelskie', 'Podlaskie', 'Podkarpackie', 'Świętokrzyskie'] },
    { name: 'FedEx Transport (Zachód)', provinces: ['Lubuskie', 'Wielkopolskie', 'Dolnośląskie'] }
];

// Lista wszystkich 16 województw do formularza
const ALL_PROVINCES = [
    'Dolnośląskie', 'Kujawsko-Pomorskie', 'Lubelskie', 'Lubuskie', 'Łódzkie',
    'Małopolskie', 'Mazowieckie', 'Opolskie', 'Podkarpackie', 'Podlaskie',
    'Pomorskie', 'Śląskie', 'Świętokrzyskie', 'Warmińsko-Mazurskie', 'Wielkopolskie', 'Zachodniopomorskie'
];

exports.getResourcesPage = async (req, res) => {
    try {
        let rawOrders = [];

        if (req.session.user.role === 'admin') {
            rawOrders = await ResourceOrder.findAll({ include: [User], order: [['createdAt', 'DESC']] });
        } else {
            rawOrders = await ResourceOrder.findAll({ where: { userId: req.session.user.id }, order: [['createdAt', 'DESC']] });
        }

        // Mapujemy zamówienia, aby dla każdego "oczekującego" dobrać tylko pasujących kurierów
        const orders = rawOrders.map(order => {
            const orderJson = order.toJSON();

            // Filtrujemy kurierów, których tablica 'provinces' zawiera województwo zamówienia
            orderJson.matchingCouriers = COURIERS_DATABASE.filter(courier =>
                courier.provinces.map(p => p.toLowerCase()).includes(orderJson.province.toLowerCase())
            );

            return orderJson;
        });

        res.render('resources', {
            orders,
            provinces: ALL_PROVINCES
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { errorMessage: 'Błąd ładowania strony zasobów.' });
    }
};

exports.createOrder = async (req, res) => {
    try {
        // ZABEZPIECZENIE: Admin nie może tworzyć zamówień
        if (req.session.user.role === 'admin') {
            return res.status(403).render('error', {
                errorMessage: '🛑 Odmowa dostępu. Jako Administrator posiadasz wyłącznie uprawnienia do akceptacji zamówień, nie możesz ich samodzielnie tworzyć.'
            });
        }
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 10 || parsedQuantity > 25) {
            return res.status(400).render('error', {
                errorMessage: '🛑 Hurtowe zamówienie! Jednorazowo możesz złożyć zapotrzebowanie na minimum 10 i maksymalnie 25 sztuk wybranego wyposażenia.'
            });
        }

        const { resourceType, quantity, province, city, street, deliveryDate } = req.body;

        // Walidacja daty (którą robiliśmy krok wcześniej)
        const today = new Date().toISOString().split('T')[0];
        if (deliveryDate < today) {
            return res.status(400).render('error', { errorMessage: '🛑 Data dostawy nie może być datą z przeszłości.' });
        }

        // Zapis do bazy danych
        await ResourceOrder.create({
            resourceType,
            quantity,
            province,
            city,
            street,
            deliveryDate,
            userId: req.session.user.id,
            status: 'oczekujace' // <-- Upewnij się, że jest dokładnie tak, bez polskich znaków
        });

        res.redirect('/resources');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { errorMessage: 'Nie udało się złożyć zamówienia.' });
    }
};

exports.approveOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { courierName } = req.body;

        if (!courierName || courierName === '') {
            return res.status(400).render('error', { errorMessage: 'Musisz wybrać kuriera z listy obsługującej to województwo.' });
        }

        const order = await ResourceOrder.findByPk(orderId);
        if (!order) {
            return res.status(404).render('error', { errorMessage: 'Nie znaleziono takiego zamówienia.' });
        }

        order.status = 'zaakceptowane';
        order.courierName = courierName;
        await order.save();

        await Notification.create({
            userId: order.userId,
            message: `📦 Twoje zamówienie na ${order.quantity}x ${order.resourceType} do miejscowości ${order.city} (${order.province}) zostało ZAAKCEPTOWANE. Dostawę realizuje dedykowany kurier: ${courierName}.`
        });

        res.redirect('/resources');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { errorMessage: 'Błąd podczas akceptacji zamówienia.' });
    }
};