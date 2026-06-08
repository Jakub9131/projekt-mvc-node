exports.isAdmin = (req, res, next) => {

    if (req.user && req.user.role === 'admin') {
        return next(); 
    }

    return res.status(403).render('error', {
        errorMessage: '🛑 Brak uprawnień. Ta operacja jest dostępna wyłącznie dla Administratorów.'
    });
};

exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/auth');
};