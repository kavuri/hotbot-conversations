/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const _ = require('lodash'),
      mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
   email: {type: String, required: true, unique: true},
   name: {type: String, required: true},
   hotel: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Hotel'},
   status: {type: String, required: true, enum: ['active', 'inactive']}
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('User', UserSchema);