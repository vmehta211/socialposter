"use strict";
console.log("app started");
process.chdir('/');
var ip = false; //listen on the ip address - not only localhost
var port = 22605;
var pourTimeoutId = '';
var pourTimeoutSeconds = 45; // in seconds, amount of time we wait before we give up on the arduino sending up pour information
// this value should be some number of seconds more than the arduino timeout

var allClients = [];
var socketCount = 0;
//var server = require('/home/pi/public_html/beerondemand/webServer').start(ip, port);
var server = require('./webServer').start(ip, port);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
//var FB = require('fb');
var fs = require('fs'); //FileSystem module of Node.js
var OAuth = require('oauth').OAuth;
var util = require('util');
var config = require('./oauth.js');
var http = require('http');
var https = require('https');
var sys = require('sys')
var exec = require('child_process').exec;
var Tail = require('tail').Tail;
//used for facebook like info
var itemInfos = [];
var totalInfosCount = 0;
var completedInfosCount = 0;
var currentFacebookAccessToken = '';

var overlayLocation = '/home/pi/public_html/test/www/images/hadley-512.png';
var convertedPixLocation = '/var/www/eyefi/converted_pix/';
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Hamburger123!',
});

//getConfig();
//setInterval(function() {
//    getConfig()
//}, 5000);


//beer - removed
var user_id = 0; //this is for the demo - when we have multiple users this wont work

//
//    socket.on('addtotwitter', function(info) {
//        var filename = '/var/www/eyefi/pix/' + info.filename.trim();
//        var msg = info.msg;
//        var rfid = info.rfid;
//        console.log('you want to upload ', filename, ' to twitter');
//        postToTwitter(rfid, msg, filename);
//    });

function twitterLoadComplete() {
    console.log('twitter upload complete');

}


function facebookLoadComplete() {
    console.log('facebookloadcomplete');

}



function postToTwitter(rfidin, msg, fileLocation) {
    console.log('gonna post to fb', msg, fileLocation);

    console.log('########@@@@@@@@@ filelocation', loc);
    fileLocation = loc;
    var sql = "SELECT * FROM picture_taker.users WHERE ? LIMIT 1";
    var twitter_access_token = '';
    var twitter_authtoken_secret = '';
    connection.query(sql, {rfid: rfidin}, function(err, rows) {

        if (rows.length > 0 && rows[0].twitter_data != null) {
            var mydata = JSON.parse(rows[0].twitter_data);
            twitter_access_token = mydata.accessToken;
            twitter_authtoken_secret = mydata.accessTokenSecret;
        } else {
            console.log('could not locate auth token');
            return false;
        }

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
        request.on('error', function(err) {
            console.log('Error: Something is wrong.\n' + JSON.stringify(err) + '\n');
        });
        request.on('response', function(response) {
            response.setEncoding('utf8');
            response.on('data', function(chunk) {
                console.log(chunk.toString());
            });
            response.on('end', function() {
                twitterLoadComplete();
                console.log(response.statusCode + '\n');
            });
        });
    });

}



function addOverlay(fileLocation, callback) {
    var photoName = fileLocation.split('/');
    photoName = photoName[photoName.length - 1];
    var cmd = "convert -composite " + fileLocation + " " + overlayLocation + " " + convertedPixLocation + photoName;
    exec(cmd, function(error, stdout, stderr) {
        if (error == '' || error == null) {
            fileLocation = convertedPixLocation + photoName;
        }
        else {
            console.log('error adding overlay to image', error, stdout, stderr);
        }

        if (callback) {
            callback(fileLocation);
        }

    });
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

function getDataWithRfid(rfidin, callback) {
    var data = false;
    var sql = "SELECT * FROM picture_taker.users WHERE ? LIMIT 1";
    var qry = connection.query(sql, {rfid: rfidin}, function(err, rows) {
        if (rows.length > 0) {
            console.log('there was data!!!!!');
            data = rows[0];
        }

        if (callback) {
            callback(data);
        }
    });
}




function getLikes(access_token) {
    console.log('getting likes with access_token', access_token)
    var options = {
        method: 'get',
        host: 'graph.facebook.com',
        port: 443,
        path: '/me/likes?access_token=' + access_token + '&limit=100'
    }
    https.get(options, function(res) {
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            var json = JSON.parse(data);
            console.log(json);
            var item = null;
            for (var i = 0; i < json.data.length && i < 10; i++) {
                item = json.data[i];
                try {
                    getFBInfoWithId(item.id, item);
                } catch (e) {
                    console.log('there was a problem getting info about facebook id', item.id);
                }
                totalInfosCount++;
            }
        });
    });
}

function getFBInfoWithId(id, item) {
    itemInfos = []; //reset item info - better to check for what is updated in case we are passing diffs
    var options = {
        method: 'get',
        host: 'graph.facebook.com',
        path: "/" + id
    }

    http.get(options, function(res) {
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            var json = JSON.parse(data);
            console.log(json);
            completedInfosCount++;
            if (json.cover) {
                item.info = json.cover;
                itemInfos.push(item);
            }

            if (completedInfosCount == totalInfosCount) {
                console.log('COMPLETE!!!!!!!!!!', itemInfos);
                console.log('there were a total of ', totalInfosCount, ' of which we got info for ', completedInfosCount);
                completedGatherLikeData();
            }

        });
    });
}

function completedGatherLikeData() {
    var likedata = [];
    var likeitem = {};
    var c = {};
    for (var i = 0; i < itemInfos.length; i++) {
        c = itemInfos[i];

        likeitem = {
            title: c.name,
            id: c.id,
            image_url: c.info.source
        }

        likedata.push(likeitem);
    }

    io.sockets.emit('facebook_likedata', likedata);
}