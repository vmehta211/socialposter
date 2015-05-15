
var quotes = [
    { author : 'Audrey Hepburn', text : "Nothing is impossible, the word itself says 'I'm possible'!"},
    { author : 'Walt Disney', text : "You may not realize it when it happens, but a kick in the teeth may be the best thing in the world for you"},
    { author : 'Unknown', text : "Even the greatest was once a beginner. Don’t be afraid to take that first step."},
    { author : 'Neale Donald Walsch', text : "You are afraid to die, and you’re afraid to live. What a way to exist."}
];

var express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql')

var app = express()
var db = mysql.createConnection({
    host: 'localhost',
    user: 'socialposter',
    password: 'socialposter123!',
    database: 'socialposter'
});


// create application/json parser
var jsonParser = bodyParser.json()

app.post('/register/:rfid/:time/:signature', jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400)
    // create user in req.body

	console.log('request params: ', req.params);
	console.log('request body: ', req.body);

    register(req.params.rfid, req.body);

    res.json({result:true});

})


app.get('/getquote/:mac', function(req, res) {
    console.log('in getquote');
    if( req.params.mac ==  '') {
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
    }
    getQuote(req.params.mac, res);
});

//app.get('/getquote', jsonParser, function (req, res) {
//    if (!req.body) return res.sendStatus(400)
//    // create user in req.body
//    console.log(req.body.a)
//    res.send(JSON.stringify(req.body));
//
//})

app.post('/post', jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400)
    // create user in req.body
    res.json(quotes);

})

app.listen(process.env.PORT || 22605)


//
//// create application/x-www-form-urlencoded parser
//var urlencodedParser = bodyParser.urlencoded({ extended: false })
//
//// POST /login gets urlencoded bodies
//app.post('/login', urlencodedParser, function (req, res) {
//    if (!req.body) return res.sendStatus(400)
//    res.send('welcome, ' + req.body.username)
//})
//
//app.post('/api/users', jsonParser, function (req, res) {
//    if (!req.body) return res.sendStatus(400)
//    // create user in req.body
//    res.json(quotes);
//
//})
//



//app.use(bodyParser());
//
//app.get('/', function(req, res) {
//    res.json(quotes);
//});
//
//app.get('/quote/random', function(req, res) {
//    var id = Math.floor(Math.random() * quotes.length);
//    var q = quotes[id];
//    res.json(q);
//});
//
//app.get('/quote/:id', function(req, res) {
//    if(quotes.length <= req.params.id || req.params.id < 0) {
//        res.statusCode = 404;
//        return res.send('Error 404: No quote found');
//    }
//
//    var q = quotes[req.params.id];
//    res.json(q);
//});
//
//app.post('/quote', function(req, res) {
//    if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
//        res.statusCode = 400;
//        return res.send('Error 400: Post syntax incorrect.');
//    }
//
//    var newQuote = {
//        author : req.body.author,
//        text : req.body.text
//    };
//
//    quotes.push(newQuote);
//    res.json(true);
//});
//
//app.delete('/quote/:id', function(req, res) {
//    if(quotes.length <= req.params.id) {
//        res.statusCode = 404;
//        return res.send('Error 404: No quote found');
//    }
//
//    quotes.splice(req.params.id, 1);
//    res.json(true);
//});
//
//app.listen(process.env.PORT || 3412);


function getQuote(mac, res) {
    var sql = "SELECT * " +
        "FROM quotes as q JOIN device_config as dc USING(quote_id) " +
        "WHERE ? LIMIT 1";
    db.query(sql, {mac_address: mac}, function (err, rows) {
        console.log(rows);
        if (rows.length > 0) {
         res.send(rows[0]);
        } else {
            res.statusCode = 404;
            res.json({'error':'no quote'})
            //res.send('Error 404: No quote found');
        }
    });
}

function register(rfid, p){
    var sql = "INSERT INTO users SET ?";

    var data = {
                rfid:rfid,
                twitter_accessToken: p.tat,
                twitter_accessTokenSecret: p.tats,
                twitter_profile: p.tp,
                facebook_accessToken: p.fat,
                facebook_accessTokenSecret: p.fats,
                facebook_profile: p.fp
                };
    var query = db.query(sql,data,function(err,result){
       console.log('err',err,'result',result)
    });
    console.log('query.sql',query.sql);

}
