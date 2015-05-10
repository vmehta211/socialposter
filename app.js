var magenta = '\u001b[35m';
var green = '\u001b[32m';
var red = '\u001b[31m';
var reset = '\u001b[0m';

var port = 22605;
//var express = require('express');
//MemoryStore = express.session.MemoryStore;
//
//var app = express();
//var server = require('http').createServer(app)
//
//var session_store = new MemoryStore();

var currentRfid = '';

var KEY = 'express.sid'
        , SECRET = 'express';

var express = require('express')
        , app = express()
        , server = require('http').createServer(app)
        , io = require('socket.io').listen(server)
        , cookie = express.cookieParser(SECRET)
        , store = new express.session.MemoryStore()
        , session = express.session({secret: SECRET
            , key: KEY
            , store: store});



var config = require('./oauth.js')
var fs = require('fs');
var routes = require('./routes');
var path = require('path');
var passport = require('passport')

var sys = require('sys')
var exec = require('child_process').exec;
var Tail = require('tail').Tail;

var listenToRfid = true;

//var io = null;
console.log('about to call listen');
server.listen(port, function() {
    console.log(magenta + 'server started and listening on port ' + port + reset);
    //io = require('socket.io').listen(server);

});





var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;



// serialize and deserialize
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// config
passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'displayName', 'photos']
},
function(accessToken, refreshToken, profile, done) {
    console.log('accessToken ', accessToken, ' profile ', profile);


    var fbdata = {accessToken: accessToken, profile: profile};
    fbdata = JSON.stringify(fbdata);

    console.log(fbdata);


    process.nextTick(function() {
        return done(null, profile);
    });
}
));



passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: config.twitter.callbackURL,
    profileFields: ['id', 'displayName', 'photos']
},
function(accessToken, refreshToken, profile, done) {
    console.log('access token: ', accessToken);
    console.log('access token secret: ', refreshToken);
    console.log(profile);

    var twdata = {accessToken: accessToken, accessTokenSecret: refreshToken, profile: profile};
    twdata = JSON.stringify(twdata);

    console.log('tw data',twdata)

    process.nextTick(function() {
        return done(null, profile);
    });
}
));


app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(function(req, res, next) {
        console.log('%s %s', req.method, req.url);
        next();
    });

    app.use(cookie);
    app.use(session);
    //app.use(express.logger());
    //app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //app.use(express.session({secret: COOKIE_SECRET, key: 'connect.sid', store: session_store}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});



// routes
app.get('/', routes.register);
app.get('/registerrfid', function(req, res) {
    listenToRfid = true;
    res.render('registerrfid', {title: "Take a Picture - reged"});
});

app.get('/ping', routes.ping);
//app.get('/twittertest', routes.twittertest);
app.get('/account', function(req, res) {
    res.render('account', {user: req.user});
});

app.get('/', function(req, res) {
    req.session.name = "this be da session name";
    res.render('login', {user: req.user});
});

app.get('/auth/facebook',
        passport.authenticate('facebook', {scope: ['user_status', 'user_checkins', 'user_about_me', 'publish_actions', 'publish_stream', 'user_likes']}),
function(req, res) {
});
app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {failureRedirect: '/'}),
function(req, res) {
    res.redirect('/socialize');
});


app.get('/auth/twitter',
        passport.authenticate('twitter'),
        function(req, res) {
        });
app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {failureRedirect: '/'}),
function(req, res) {
    res.redirect('/socialize');
});

app.get('/socialize', function(req, res) {
    console.log('the session data is ', req.session);

    getRfidData(function(data) {

        res.render('socialize', {pageData: JSON.stringify(data)});
    });
});


app.get('/completesocialize', function(req, res) {
    console.log('socializing complete');
    res.render('completesocialize');

});


app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


