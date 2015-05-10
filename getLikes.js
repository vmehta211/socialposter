var ACCESS_TOKEN = 'CAAMdcqIMnuABAKZCMKRhGZCaqZA75u9tlMkq9iBsCwB5WnxtEPUr08z8oz4wGhLt8FLJY2y3zXtZB91xswA7MVjrnYReKBpr6Y3jZAAH9CBE6xCD6iXaAz8wP4YL1eGyTVqGA6Fb95eCqZBrPZAqm3KHODhzrZCYYRfnJRXLWq8pmdFTatcf7w3w';
ACCESS_TOKEN = 'CAAMdcqIMnuABAKGVEgWjssFQfnOSEam4FYFkdpT6jMBsg4LcZAygDNOccH9BiCyKbsyjbFV6XkUoq2Rz97i04T0YmD3Qe9xygOU3F5F5kL1w4EZBT9g6XmgWB0jQywnrqWNRu57qqPAZBcXgtNT3CWrRe3bdl3VDrOScFKNjsIHtdsgGlb9BNWEYBZAwenoZD';
var https = require('https'); //Https module of Node.js
var http = require('http'); //Https module of Node.js

var itemInfos = [];
var totalInfosCount = 0;
var completedInfosCount = 0;

var options = {
    method: 'get',
    host: 'graph.facebook.com',
    port: 443,
    path: '/me/likes?access_token=' + ACCESS_TOKEN + '&limit=100'
}

console.log('starting GETs request to facebook');
https.get(options, function(res) {
    var data = '';

    res.on('data', function(chunk) {
        data += chunk;
    });

    res.on('end', function() {
        //console.log(data);

        var json = JSON.parse(data);
        console.log(json);
        var item = null;
        for (var i = 0; i < json.data.length && i < 10; i++) {
            item = json.data[i];
            getFBInfoWithId(item.id, item);
            totalInfosCount++;
        }



    });
});


function getFBInfoWithId(id, item) {

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

            }

        });
    });
}

/*
 * 
 * 
 * 
 * https://graph.facebook.com/ID
 * 
 * {
 "id": "108396272526361",
 "about": "We make movies.  beyondcinemaprod.com twitter.com/beyondcinema beyondcinema.tumblr.com youtube.com/beyondcinema",
 "can_post": false,
 "category": "Artist",
 "checkins": 0,
 "cover": {
 "cover_id": 686372948062021,
 "offset_x": 0,
 "offset_y": 37,
 "source": "https://scontent-a.xx.fbcdn.net/hphotos-xpa1/t1.0-9/1526310_686372948062021_304174458_n.jpg"
 },
 "has_added_app": false,
 "is_community_page": false,
 "is_published": true,
 "likes": 2138,
 "link": "https://www.facebook.com/beyondcinema",
 "name": "Beyond Cinema Productions",
 "personal_info": "Beyond Cinema Productions, LLC is a Southern California based video production company. Our first feature film, \"BANG BANG\", will be released in 2011.  Hitting festivals in the spring, and worldwide release soon after that!  \n\nofficial website: http://www.bangbangthemovie.com\n\nSpread the word!  Thanks for the support fam!!",
 "personal_interests": "Filmmaking, Music, Art",
 "talking_about_count": 25,
 "username": "beyondcinema",
 "website": "http://www.beyondcinemaprod.com\nhttp://www.twitter.com/beyondcinema\nhttp://www.beyondcinema.tumblr.com\nhttp://www.youtube.com/beyondcinema",
 "were_here_count": 0
 }
 * 
 * https://graph.facebook.com/v1.0/1038310389/likes?access_token=CAAMdcqIMnuABAKZCMKRhGZCaqZA75u9tlMkq9iBsCwB5WnxtEPUr08z8oz4wGhLt8FLJY2y3zXtZB91xswA7MVjrnYReKBpr6Y3jZAAH9CBE6xCD6iXaAz8wP4YL1eGyTVqGA6Fb95eCqZBrPZAqm3KHODhzrZCYYRfnJRXLWq8pmdFTatcf7w3w&limit=100&after=MTE1NTA1ODI1MTMwODIw
 * 
 * {
 "data": [
 {
 "category": "Tv show",
 "name": "Blue Mountain State",
 "created_time": "2010-11-06T07:31:46+0000",
 "id": "111977838819513"
 },
 {
 "category": "Book",
 "name": "Of Mice and Men",
 "created_time": "2010-11-06T07:31:46+0000",
 "id": "103731679665568"
 },
 {
 "category": "Tv show",
 "name": "The Wire",
 "created_time": "2010-11-06T07:31:46+0000",
 "id": "5991693871"
 },
 {
 "category": "Musician/band",
 "name": "Notorious B.I.G",
 "created_time": "2010-11-06T07:31:45+0000",
 "id": "110131379016959"
 },
 {
 "category": "Book series",
 "name": "Goosebumps",
 "created_time": "2010-11-06T07:31:45+0000",
 "id": "109890709037905"
 },
 {
 "category": "Book",
 "name": "Highlights",
 "created_time": "2010-11-06T07:31:45+0000",
 "id": "100864483286960"
 },
 {
 "category": "Musician/band",
 "name": "JAY Z",
 "created_time": "2010-11-06T07:31:45+0000",
 "id": "48382669205"
 },
 {
 "category": "Musician/band",
 "name": "Club Nouveau",
 "created_time": "2010-11-06T07:31:44+0000",
 "id": "103840162988022"
 },
 {
 "category": "Musician/band",
 "name": "Boys to Men",
 "created_time": "2010-11-06T07:31:44+0000",
 "id": "102177603157070"
 },
 {
 "category": "Musician/band",
 "name": "Kid Cudi",
 "created_time": "2010-11-06T07:31:44+0000",
 "id": "90352253585"
 },
 {
 "category": "Musician/band",
 "name": "Lil Wayne",
 "created_time": "2010-11-06T07:31:44+0000",
 "id": "6885814958"
 },
 {
 "category": "Interest",
 "name": "Sleeping",
 "created_time": "2010-11-06T07:31:43+0000",
 "id": "102168219824412"
 },
 {
 "category": "Tv show",
 "name": "Entourage",
 "created_time": "2010-09-20T19:25:51+0000",
 "id": "6459871686"
 },
 {
 "category": "Tv show",
 "name": "Weeds",
 "created_time": "2010-09-20T19:25:51+0000",
 "id": "5943153747"
 },
 {
 "category": "Tv show",
 "name": "Two and a Half Men",
 "created_time": "2010-09-20T19:25:50+0000",
 "id": "36211311648"
 },
 {
 "category": "Tv show",
 "name": "The Office",
 "created_time": "2010-09-20T19:25:50+0000",
 "id": "6092929747"
 },
 {
 "category": "Movie",
 "name": "Juice",
 "created_time": "2010-09-20T19:25:49+0000",
 "id": "112667112077990"
 },
 {
 "category": "Movie",
 "name": "Poetic Justice",
 "created_time": "2010-09-20T19:25:49+0000",
 "id": "112340122111259"
 },
 {
 "category": "Tv show",
 "name": "True Blood",
 "created_time": "2010-09-20T19:25:49+0000",
 "id": "69144888562"
 },
 {
 "category": "Movie",
 "name": "Devil's Advocate",
 "created_time": "2010-09-20T19:25:48+0000",
 "id": "110817042275315"
 },
 {
 "category": "Movie",
 "name": "Above the Rim",
 "created_time": "2010-09-20T19:25:48+0000",
 "id": "105705919462287"
 },
 {
 "category": "Movie",
 "name": "Scarface",
 "created_time": "2010-09-20T19:25:47+0000",
 "id": "109236852435224"
 },
 {
 "category": "Movie",
 "name": "New Jack City",
 "created_time": "2010-09-20T19:25:47+0000",
 "id": "108164535870299"
 },
 {
 "category": "Movie",
 "name": "Donnie Brasco",
 "created_time": "2010-09-20T19:25:47+0000",
 "id": "103096339730254"
 },
 {
 "category": "Field of study",
 "name": "Watching TV",
 "created_time": "2010-09-20T19:25:43+0000",
 "id": "115550171789384"
 },
 {
 "category": "Interest",
 "name": "Water Sports",
 "created_time": "2010-09-20T19:25:42+0000",
 "id": "114093551940621"
 },
 {
 "category": "Company",
 "name": "Brookstone",
 "created_time": "2010-09-01T05:23:42+0000",
 "id": "68120344353"
 },
 {
 "category": "Community",
 "name": "Mochi",
 "created_time": "2010-08-18T21:28:50+0000",
 "id": "15400913606"
 },
 {
 "category": "Company",
 "category_list": [
 {
 "id": "133436743388217",
 "name": "Arts & Entertainment"
 }
 ],
 "name": "454 Life Entertainment",
 "created_time": "2010-08-18T21:28:21+0000",
 "id": "337685113986"
 },
 {
 "category": "Artist",
 "name": "Beyond Cinema Productions",
 "created_time": "2010-08-18T21:28:19+0000",
 "id": "108396272526361"
 },
 {
 "category": "Product/service",
 "name": "Parrot",
 "created_time": "2010-08-17T03:51:44+0000",
 "id": "49623718343"
 }
 ],
 "paging": {
 "cursors": {
 "after": "NDk2MjM3MTgzNDM=",
 "before": "MTExOTc3ODM4ODE5NTEz"
 },
 "previous": "https://graph.facebook.com/v1.0/1038310389/likes?limit=100&access_token=CAAMdcqIMnuABAKZCMKRhGZCaqZA75u9tlMkq9iBsCwB5WnxtEPUr08z8oz4wGhLt8FLJY2y3zXtZB91xswA7MVjrnYReKBpr6Y3jZAAH9CBE6xCD6iXaAz8wP4YL1eGyTVqGA6Fb95eCqZBrPZAqm3KHODhzrZCYYRfnJRXLWq8pmdFTatcf7w3w&before=MTExOTc3ODM4ODE5NTEz"
 }
 }
 * 
 */

