var jwt = require('jsonwebtoken');
const fetch = require('node-fetch')

var token='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1URkJPRFUzTURrd01UazRRemczTURKQ05FSTBNREpHTTBKRE5UUTJSa1UyTmtRd1FrRkJPUSJ9.eyJpc3MiOiJodHRwczovL2thbWFtaXNodS5ldS5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NWU0ZmVlMWY2ZDgyMmEwZDZiMjZkMTU3IiwiYXVkIjpbImh0dHBzOi8va2FtYW1pc2h1LmNvbS9hcGkvdjEiLCJodHRwczovL2thbWFtaXNodS5ldS5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNTgyNDY4NTE0LCJleHAiOjE1ODI1NTQ5MTQsImF6cCI6IlRrYlE3WkpvaVB1YWNCYm9xR3BtNHhGbUM1emdzRVF0Iiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsInBlcm1pc3Npb25zIjpbInJlYWQ6b3JkZXIiLCJyZWFkOnVzZXIiXX0.fDfou0H43ByXXspXIwaTBCdVPmng71WQc2X7-2P5XktuIFuihJd94sZ_K032bg5hQJyBkQFfxomA49EegxkPgifhgOkTbq3PuakkieuokLwhNI0Jk_emCjseNZ-uGC0VDgphSETv7lNe0DTPAjf1PWs4y8xv-sN8oPTs_sQMcsovjDWZrYftRDArCOYh4dcHzklpvKwRY4ex8qvlSI8GkbBEqRYtqb5Lhgt6ruC2MXdkqccKRrTK2NRRGn-YiVepddgSwLaSv714LTunF-HAVeGNnv-4bdINWgAfJ020QB7zSho-9eWphMK-ni5GhiHaHw9Qa9emUujx8JuMMMzxsA'

//var options={audience: 'https://kamamishu.com/api/v1', issuer: 'https://kamamishu.eu.auth0.com/', algorithms:"RS256"};
var options={audience: 'https://kamamishu.com/api/v1', algorithms:"RS256"};

/*
var pem = fetch('https://kamamishu.eu.auth0.com/.well-known/jwks.json').then(res => res.json()).then(body => {
   console.log(body)
   jwt.verify(token, body, options, function(err, decoded) {
      console.log('err=',err);
      console.log('decoded=', decoded);
   })
});
*/

var jwksClient = require('jwks-rsa');
var client = jwksClient({
  jwksUri: 'https://kamamishu.eu.auth0.com/.well-known/jwks.json'
});

function getKey(header, callback) {
   client.getSigningKey(header.kid, function(err, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
   });
}

jwt.verify(token, getKey, options, function(err, decoded) {
      console.log('err=',err);
      console.log('decoded=', decoded);
})
