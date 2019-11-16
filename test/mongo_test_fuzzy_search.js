/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';
var mongoose_fuzzy_searching = require('mongoose-fuzzy-searching'),
    mongoose = require('mongoose');

var mongo = require('../src/mongo.js');
mongo();

var UserSchema = new mongoose.Schema({
    firstName: {type: String,text:true},
    lastName: {type: String,text:true},
    email: {type: String,text:true},
    age: Number
});

UserSchema.plugin(mongoose_fuzzy_searching, {fields: ['firstName', 'lastName']});
UserSchema.index({firstName: 'text', lastName: 'text', email: 'text'});
 
var User = mongoose.model('User', UserSchema);
 
var user = new User({ firstName: 'kjoe',  lastName: 'myDoe', email: 'joe.doe@mail.com', age: 30});
 
user.save(function () {
    // mongodb: { ..., firstName_fuzzy: [String], lastName_fuzzy: [String] }
 
    User.fuzzySearch('jo', function (err, users) {
        console.error(err);
        console.log(users);
        // each user object will not contain the fuzzy keys:
        // Eg.
        // {
        //   "firstName": "Joe",
        //   "lastName": "Doe",
        //   "email": "joe.doe@mail.com",
        //   "age": 30,
        //   "confidenceScore": 34.3 ($text meta score)
        // }
    });
});