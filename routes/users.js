const express = require('express');
const router = express.Router();
const User = require('../models/user');
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');

router.get('/register', (req, res) => {
    res.render('users/registration');
});

router.post('/register', wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp');
            res.redirect('/campgrounds');
        })

    } catch (e) {
        if (e.code === 11000) {
            req.flash('error', `${e.keyValue.email} - this email is already registered.`)
        } else {
            req.flash('error', e.message)
        }
        res.redirect('/register')
    }
}))

router.get('/login', (req, res) => {
    res.render('users/login');
});

router.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login',
    keepSessionInfo: true
}), (req, res) => {
    req.flash('success', 'welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', "Logged out!");
        res.redirect('/campgrounds');
    });
});

module.exports = router;
