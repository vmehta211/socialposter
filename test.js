var ACCESS_TOKEN = 'CAAMdcqIMnuABAK1AAfjWFCGXPBtHG7ni2CZA2x9hLb7ZCcNpeOEZAZB1VAEuWiLzZAWcVkvwu1UXo5eisJZBDmZCH6ZBmez654mn1v45Da39UShZBfxJDxvaST9DAP0W2E3tZCkZCjkCZCrU0sIxRhtpVt2ZCWd1V6zKR1lvkeNsMslKZBTjsTqYN4ZCs1b';
var https = require('https'); //Https module of Node.js
var fs = require('fs'); //FileSystem module of Node.js
var FormData = require('form-data'); //Pretty multipart form maker.
 
var form = new FormData(); //Create multipart form
form.append('file', fs.createReadStream('/var/www/eyefi/pix/DSC00268.JPG')); //Put file
form.append('message', "mrboombastic"); //Put message
 
//POST request options, notice 'path' has access_token parameter
var options = {
    method: 'post',
    host: 'graph.facebook.com',
    path: '/me/photos?access_token='+ACCESS_TOKEN,
    headers: form.getHeaders(),
}
 
//Do POST request, callback for response
var request = https.request(options, function (res){
     console.log(res);
});
 
//Binds form to request
form.pipe(request);
 
//If anything goes wrong (request-wise not FB)
request.on('error', function (error) {
     console.log(error);
});