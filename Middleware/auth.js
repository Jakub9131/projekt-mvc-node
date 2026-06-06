// middleware/auth.js

// Funkcja przepuszczająca tylko Administratorów
exports.isAdmin = (req, res, next) => {
    // req.user został ustawiony wcześniej w app.js przez nasz mechanizm logowania
    if (req.user && req.user.role === 'admin') {
        return next(); // Użytkownik jest adminem, pozwól mu przejść dalej
    }

    // Jeśli to nie admin, przekieruj na stronę błędu z odpowiednim komunikatem
    return res.status(403).render('error', {
        errorMessage: '🛑 Brak uprawnień. Ta operacja jest dostępna wyłącznie dla Administratorów.'
    });
};

exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next(); // Użytkownik jest zalogowany, puść go dalej
    }
    // Jeśli nie jest zalogowany, przekieruj na stronę logowania
    res.redirect('/auth');
};