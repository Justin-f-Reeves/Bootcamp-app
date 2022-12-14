if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const session = require(`express-session`);
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const userRoutes = require('./routes/users');
const { timeSince } = require('./utils/humanTime');


mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);


app.get('/', (req, res) => {
    const visitedHomePage = new Date;
    visitedHomePage.setDate(visitedHomePage.getDate() - 1);
    console.log(visitedHomePage);
    console.log(typeof visitedHomePage);
    console.log(`You visited the homepage ${timeSince(visitedHomePage)} ago`)

    res.render('home');
})

app.get('/testuser', async (req, res) => {
    const testUser = new User({ email: 'testuser@gmail.com', username: 'testuser' });
    const registeredUser = await User.register(testUser, 'testpassword');
    res.send(registeredUser)
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { status = 500 } = err;
    if (err) {
        req.flash("error", `${err.message}.`, "Please try again!");
        return res.redirect(`/campgrounds`);
    }
    if (!err.message) err.message = 'Oh boy, something went wrong!';
    res.status(status).render('error', { err });
})

app.listen(3000, () => {
    console.log('serving on port 3000!');
})




