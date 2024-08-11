app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' }));




app.get('/settings', ensureLoggedIn('/login'), function (req, res) {

    res.render('settings', { user: req.user });
});



