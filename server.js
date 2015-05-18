var express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql')
var fs = require('fs');
var OAuth = require('oauth').OAuth;
var util = require('util');
var https = require('https');
var http = require('http');

var config;
if(fs.existsSync('/home/piptastic/var/secure/twitterwall/config.js')){
    console.log('found config file in /var/secure');
    config = require('/home/piptastic/var/secure/twitterwall/config.js');
}
else{
    config = require('./config.js')
}

var app = express()
var db = mysql.createConnection(config.app.db);


// create application/json parser
var jsonParser = bodyParser.json()

app.post('/register/:rfid/:time/:signature', jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400)

    register(req.params.rfid, req.body, res);

})


app.get('/getquote/:mac/:time/:signature', function (req, res) {
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
        postToTwitter(userData.twitter_accessToken, userData.twitter_accessTokenSecret, quoteData.quote_text, quoteData.quote_filepath);

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


function postToTwitter(twitter_access_token,twitter_authtoken_secret, msg, fileLocation) {
    console.log('gonna post to fb', msg, fileLocation);


        var fileName = fileLocation;
        var tweet = msg;
        var photoName = fileName.split('/');
        photoName = photoName[photoName.length - 1];
        var data = fs.readFileSync(fileName);
        var oauth = new OAuth(
            'https://api.twitter.com/oauth/request_token',
            'https://api.twitter.com/oauth/access_token',
            config.twitter.consumerKey, config.twitter.consumerSecret,
            '1.0', null, 'HMAC-SHA1');
        var crlf = "\r\n";
        var boundary = '---------------------------10102754414578508781458777923';
        var separator = '--' + boundary;
        var footer = crlf + separator + '--' + crlf;
        var fileHeader = 'Content-Disposition: file; name="media[]"; filename="' + photoName + '"';
        var contents = separator + crlf
            + 'Content-Disposition: form-data; name="status"' + crlf
            + crlf
            + tweet + crlf
            + separator + crlf
            + fileHeader + crlf
            + 'Content-Type: image/jpeg' + crlf
            + crlf;
        var multipartBody = Buffer.concat([
            new Buffer(contents),
            data,
            new Buffer(footer)]);
        var hostname = 'api.twitter.com';
        var authorization = oauth.authHeader(
            'https://api.twitter.com/1.1/statuses/update_with_media.json',
            config.twitter.accessToken, config.twitter.accessTokenSecret, 'POST');
        var authorization = oauth.authHeader(
            'https://api.twitter.com/1.1/statuses/update_with_media.json',
            twitter_access_token, twitter_authtoken_secret, 'POST');
        var headers = {
            'Authorization': authorization,
            'Content-Type': 'multipart/form-data; boundary=' + boundary,
            'Host': hostname,
            'Content-Length': multipartBody.length,
            'Connection': 'Keep-Alive'
        };
        var options = {
            host: hostname,
            port: 443,
            path: '/1.1/statuses/update_with_media.json',
            method: 'POST',
            headers: headers
        };
        var request = https.request(options);
        request.write(multipartBody);
        request.end();
        request.on('error', function (err) {
            console.log('Error: Something is wrong.\n' + JSON.stringify(err) + '\n');
        });
        request.on('response', function (response) {
            response.setEncoding('utf8');
            response.on('data', function (chunk) {
                console.log(chunk.toString());
            });
            response.on('end', function () {
                twitterLoadComplete();
                console.log(response.statusCode + '\n');
            });
        });
}

function twitterLoadComplete(){
    console.log('completed tweeting');
}

function postToFB(rfidin, msg, fileLocation) {
    console.log('gonna post to fb', msg, fileLocation);
//    setTimeout(function(){
//         facebookLoadComplete();
//    },2000);
//    return false;


    addOverlay(fileLocation, function(loc) {
        console.log('########@@@@@@@@@ filelocation', loc);
        fileLocation = loc;
        var thelink = '';
        var theimage = '';
        var ACCESS_TOKEN = '';
        connection.query('SELECT * from picture_taker.users WHERE ? LIMIT 1', {rfid: rfidin}, function(err, rows) {
            if (rows.length > 0 && rows[0].facebook_data != null) {
                var mydata = JSON.parse(rows[0].facebook_data);
                ACCESS_TOKEN = mydata.accessToken;
                var user_id = rows[0].user_id;
//                 thelink = 'http://hadleymedia.com/?campain=takeapic&user='+user_id;
//                 theimage = 'http://hadleymedia.com/wp-content/uploads/2013/02/hadley1.png';


            } else {
                console.log('could not locate auth token');
                return false;
            }

            console.log('using the followibg token: ', ACCESS_TOKEN);
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
                console.log(res);
                facebookLoadComplete();
            });
//Binds form to request
            form.pipe(request);
//If anything goes wrong (request-wise not FB)
            request.on('error', function(error) {
                console.log(error);
            });
        });
    });
}

function  facebookLoadComplete(){
    console.log('facebook upload complete');
}