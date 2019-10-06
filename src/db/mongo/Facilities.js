/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    Fuse = require('fuse.js'),
    mongoose = require('mongoose');

var FacilitySchema = new mongoose.Schema({
        hotel_id: {type: String, required: true, index: true}, // this is the "address1" field
        f_name: {type: String, required: true, index: true},
        f_type: {type: String, index: true},
        synonyms: [String],
        present: {
            flag: {type: String, required: true},
            message: {type: mongoose.Schema.Types.Mixed}
        }
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false});

FacilitySchema.index({hotel_id: 1, f_name: 1}, {unique: true});

module.exports = mongoose.model('Facility', FacilitySchema);

// function test_mongo() {
//     console.log('...test_conn...');
//     // var conn = require('./Conn');
//     // conn.init();
    
//     var mongoose = require('mongoose');
//     var Schema = mongoose.Schema;
    
//     var commentSchema = new Schema({
//         CommentBody: String,
//         UserName: String,
//         DatePosted: Date,
//     });
    
//     var Comment = mongoose.model('Comment', commentSchema);
    
//     Comment.find({UserName: 'Nick'}, function(error, comments) {
//         console.log(comments); //Display the comments returned by MongoDB, if any were found. Executes after the query is complete.
//     });
//   }

// test_mongo();