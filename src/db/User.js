/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const mongoose = require('mongoose'),
      DBConn = require('./index').DBConn;

var UserSchema = new mongoose.Schema({
   email: {type: String, required: true, unique: true},
   email_verified: {type: Boolean, required: true},
   username: {type: String, required: true, unique: true},
   name: {type: String, required: true},
   nickname: {type: String},
   phone_number: {type: String, required: true},
   password: {type: String},
   hotel: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Hotel'},
   status: {type: String, required: true, enum: ['active', 'inactive']}
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

UserSchema.index({email: 1});

module.exports = DBConn.model('User', UserSchema);