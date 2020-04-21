/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const mongoose = require('mongoose'),
      DBConn = require('./index').DBConn;

var UserSchema = new mongoose.Schema({
   user_id: {type: String, required: true, unique: true},   // user_id from Auth0 (sub)
   email: {type: String, required: true, unique: true},
   email_verified: {type: Boolean, required: true},
   name: {type: String, required: true},
   nickname: {type: String},
   hotel: {type: mongoose.Schema.Types.ObjectId,  ref: 'Hotel'},
   status: {type: String, enum: ['active', 'inactive']}
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false});

UserSchema.index({email: 1}, {unique: true});
UserSchema.index({user_id: 1}, {unique: true});

module.exports = DBConn.model('User', UserSchema);