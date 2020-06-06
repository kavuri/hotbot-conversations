/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    DBConn = require('./index').DBConn,
    AutoIncrement = require('./index').AutoIncrement;

var DummySchema = new mongoose.Schema({
    name: {type: String, required: true, index: true},
    my_id: {type: String, required: true, unique: true}
   }, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false});


DummySchema.plugin(AutoIncrement.plugin, {
    model: 'DummyModel',
    field: 'my_id',
    startAt: 100,
    incrementBy: 1
});

console.log('created dummy');
module.exports = DBConn.model('Dummy', DummySchema);

async function test() {
    var a = {name:'abc'};
    var DummyModel = require('./Dummy');
    let hg = new DummyModel(a);
    hg = await hg.save();
    console.log('@@hg=',hg);
    return hg;
}
