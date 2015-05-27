var express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql')
var fs = require('fs');
var OAuth = require('oauth').OAuth;
var util = require('util');
var https = require('https');
var http = require('http');
var md5 = require('MD5');
var utf8 = require('utf8');
var Twitter = require('node-twitter');


var config;
if(fs.existsSync('/home/piptastic/var/secure/twitterwall/config.js')){
    console.log('found config file in /var/secure');
    config = require('/home/piptastic/var/secure/twitterwall/config.js');
}
else{
    config = require('./config.js')
}

var app = express()
//var db = mysql.createConnection(config.app.db);

//handleDisconnect also connects and handles connection errors
var db;
handleDisconnect();


// create application/json parser
var jsonParser = bodyParser.json()


app.post('/register/:rfid/:time/:signature', jsonParser, function (req, res) {
    checkSignature(req, res);

    if (!req.body) return res.sendStatus(400)

    register(req.params.rfid, req.body, res);

})


app.get('/getquote/:mac/:time/:signature', function (req, res) {
    checkSignature(req, res);
    console.log('in getquote');
    if (req.params.mac == '') {
        res.statusCode = 403;
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

app.post('/post/:rfid/:quote_id/:time/:signature', jsonParser, function (req, res) {
    checkSignature(req, res);
    if (req.params.rfid == '' ||req.params.quote_id == '') return res.sendStatus(400)
    postSocial(req.params.rfid, req.params.quote_id, res);
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

function checkSignature(req,res){
    var url = req.url;

    var urlParts = url.split('/');
    var sig = req.params.signature;

    //  console.log(req,res);
    var baseUri = '';
    for(var i=0; i < urlParts.length-1; i++){
        baseUri += urlParts[i] + '/';
    }

    /*
     if(md5(baseUri+config.app.apikey) != sig){
     res.statusCode = 403;
     return res.send('Error 403: Invalid signature');
     }

     if(Math.abs(req.params.time - Date.now()) > 120000){
     res.statusCode = 403;
     return res.send('Error 403: Invalid timestamp');
     }
     */

}


function postSocial(rfid, quote_id, res) {

    var queriesToPerform = 2;
    var queriesPerformed = 0;
    var userData = null;
    var quoteData = null;


    _getQuoteById(quote_id, function (err, rows) {
        queriesPerformed++;

        if(err == null && rows.length){
            quoteData = rows[0];
        }

        if(queriesToPerform == queriesPerformed){
            _postSocial(userData, quoteData, res);
        }

    });
    _getSocialInfo(rfid, function (err, rows) {
        queriesPerformed++;

        if(err == null && rows.length){
            userData = rows[0];
        }

        if(queriesToPerform == queriesPerformed){
            _postSocial(userData, quoteData, res);
        }
    })
}

function _postSocial(userData, quoteData, res){

    if(userData != null && quoteData != null){
        if (userData.twitter_accessToken != null) {
            postToTwitter(userData.twitter_accessToken, userData.twitter_accessTokenSecret, quoteData.quote_text, quoteData.quote_filepath);
        }

        if (userData.facebook_accessToken != null) {
            postToFB(userData.facebook_accessToken, quoteData.quote_text, quoteData.quote_filepath);
        }

        var output = {result: 'success'};
        res.json(output);
    }else{
        var msg = new Array();
        if(userData == null){
            msg.push('Could not find rfid data');
        }
        if(quoteData == null){
            msg.push('Could not find quote data');
        }
        res.json({
            result: 'fail',
            error: msg
        })
    }

}

function _getSocialInfo(id, cb) {
    var sql = "SELECT * FROM users WHERE ? ORDER BY `user_id` DESC";
    db.query(sql, {rfid: id}, function (err, rows) {
        cb(err, rows);
    });
}

function _getQuoteById(id, cb) {
    var sql = "SELECT * FROM quotes WHERE ?";
    db.query(sql, {quote_id: id}, function (err, rows) {
        cb(err, rows);
    });
}

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
            res.json({
                result: 'fail',
                error: 'unregistered mac'
            })
            //res.send('Error 404: No quote found');
        }
    });
}

function register(rfid, p, res) {
    var sql = "INSERT INTO users SET ?";

    var data = {
        rfid: rfid,
        twitter_accessToken: p.tat,
        twitter_accessTokenSecret: p.tats,
        twitter_profile: (p.tp != null)?JSON.stringify(p.tp):null,
        facebook_accessToken: p.fat,
        facebook_accessTokenSecret: p.fats,
        facebook_profile: (p.fp != null)?JSON.stringify(p.fp):null
    };
    var query = db.query(sql, data, function (err, result) {
        var output;
        if (err != null) {
            console.log('err', err, 'result', result);
            output = {result: 'fail'};
        } else {
            output = {result: 'success', user_id: result.insertId};
        }
        res.json(output);
    });
    console.log('query.sql',query.sql);

}


function postToTwitter(twitter_access_token,twitter_authtoken_secret, msg, fileLocation)
{
    console.log('gonna post to twitter', msg, fileLocation);
    console.log('using credentials: access_token:',twitter_access_token, ' auth token secret',twitter_authtoken_secret);
    // Encode in UTF-8
    msg = utf8.encode(msg);


    var twitterRest = new Twitter.RestClient(
        config.twitter.consumerKey,
        config.twitter.consumerSecret,
        twitter_access_token,
        twitter_authtoken_secret
    );


    twitterRest.statusesUpdateWithMedia(
        {
            'status': msg,
            'media[]': fileLocation
        },
        function(error, result) {
            if (error)
            {
                console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
            }

            if (result)
            {
                twitterLoadComplete();
            }
        }
    );


}


function twitterLoadComplete(){
    console.log('completed tweeting');
}

function postToFB(accessToken, msg, fileLocation) {
    console.log('gonna post to fb', msg, fileLocation);
//    setTimeout(function(){
//         facebookLoadComplete();
//    },2000);
//    return false;


    //addOverlay(fileLocation, function(loc) {
    var thelink = '';
    var theimage = '';
    var ACCESS_TOKEN = accessToken;


    var https = require('https'); //Https module of Node.js

    var FormData = require('form-data'); //Pretty multipart form maker.

    var form = new FormData(); //Create multipart form
    form.append('file', fs.createReadStream(fileLocation)); //Put file
    //form.append('message', msg); //Put message
// facebook doesn't allow us to put a message right now.

    var https = require('https'); //Https module of Node.js

    var FormData = require('form-data'); //Pretty multipart form maker.

    var form = new FormData(); //Create multipart form
    form.append('file', fs.createReadStream(fileLocation)); //Put file
    form.append('message', msg); //Put message
//            form.append('link', thelink);
//            form.append('picture',theimage);
//            form.append('type', 'link')
//            form.append('name','hadley media event');
//POST request options, notice 'path' has access_token parameter
    var options = {
        method: 'post',
        host: 'graph.facebook.com',
        path: '/me/photos?access_token=' + ACCESS_TOKEN,
        headers: form.getHeaders(),
    }

    console.log('starting POST request to facebook');
//Do POST request, callback for response
    var request = https.request(options, function(res) {
//            console.log(res);
        facebookLoadComplete();
    });
//Binds form to request
    form.pipe(request);
//If anything goes wrong (request-wise not FB)
    request.on('error', function(error) {
        console.log(error);
    });
    // });
}

function  facebookLoadComplete(){
    console.log('facebook upload complete');
}



function handleDisconnect() {
    db = mysql.createConnection(config.app.db); // Recreate the connection, since
    // the old one cannot be reused.

    db.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    db.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

