/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const _ = require('lodash');
const HotelGroupModel = require('../src/db/HotelGroup');
const HotelModel = require('../src/db/Hotel');
const RoomModel = require('../src/db/Room');
const GraphModel = require('../src/db/Graph');
const DeviceModel = require('../src/db/Device');

const graphlib = require('graphlib');
var g;
module.exports.initGraph = async () => {
    let graph = await GraphModel.findOne({ value: '1' }).lean().exec();
    g = graphlib.json.read(graph);
}

const hotelData = {
    group: { name: 'Keys Group of Hotels', description: 'Keys group of hotels' },
    hotel: { name: 'Keys Hotel', description: 'This is a Keys hotel', address: { address1: 'ITPL Main Road 7, 7', address2: 'Near SAP office ', address3: 'Whitefield', city: 'Bengaluru', pin: '560037', state: 'Karnataka', country: 'India' }, contact: { phone: ['9888888888', '11111111'], email: ['whitefield@keyshotels.com'] }, coordinates: { lat: '12.979326', lng: '77.709559' }, rooms: [], front_desk_count: 2, reception_number: '9' },
    rooms: [{ room_no: '100', mtype: 'Deluxe' }, { room_no: '101', mtype: 'Supreme' }, { room_no: '102', mtype: 'Deluxe' }]
};

var GLOBAL_STATE = {
    hotel: {},
    room: []
};

let hotel = {}, room = [];

async function createHotelGroup() {
    let group;
    const hg = new HotelGroupModel(hotelData.group);
    try {
        group = await hg.save();
    } catch (error) {
        console.log('error in storing hotel group:', error);
        throw error;
    }
    return group;
}

async function createHotel(group, hotel_id) {
    let hotel;
    if (!_.isUndefined(hotel_id)) {
        hotelData.hotel.hotel_id = hotel_id;
    }
    hotelData.hotel.group_id = group.group_id;
    const h = new HotelModel(hotelData.hotel);

    try {
        hotel = await h.save();
    } catch (error) {
        console.log('error in storing hotel:', error);
        throw error;
    }
    return hotel;
}

async function createRooms(hotel) {
    let r;
    try {
        for (let i = 0; i < hotelData.rooms.length; i++) {
            hotelData.rooms[i].hotel_id = hotel.hotel_id;
            r = new RoomModel(hotelData.rooms[i]);
            room[i] = await r.save();
        }
    } catch (error) {
        console.log('error in storing hotel:', error);
        throw error;
    }
    return room;
}

module.exports.build = async () => {
    try {
        //console.log('Setting up database...');
        let group = await createHotelGroup();
        //console.log('created group=', group);
        hotel = await createHotel(group, '1');
        //console.log('created hotel=', hotel);
        let rooms = await createRooms(hotel);
        //console.log('created rooms=', rooms);

        GLOBAL_STATE.hotel = hotel;
        GLOBAL_STATE.room = rooms;
        return GLOBAL_STATE;
    } catch (error) {
        throw error;
    }
}

module.exports.destroy = async (GLOBAL_STATE) => {
    //console.log('deleting data:', GLOBAL_STATE);
    await RoomModel.deleteMany({ hotel_id: '1' });
    await HotelModel.deleteOne({ hotel_id: '1' });
    await HotelGroupModel.deleteOne({ name: hotelData.group.name });
    await GraphModel.deleteOne({ value: '1' });
    await DeviceModel.deleteOne({ hotel_id: '1', room_no: hotelData.rooms[0].room_no });
}

module.exports.createAndAssignDevice = async () => {
    // Get the hotel object and the room object references
    let hotelObjId = await HotelModel.findOne({ hotel_id: '1' });
    let roomObjId = await RoomModel.findOne({ hotel_id: '1', room_no: hotelData.rooms[0].room_no })
    const dummyDevice = {
        status: "active",   // Got this device id from the testing. In two runs, the device id did not change. Can't be sure. If this changes, all further tests will fail
        device_id: "amzn1.ask.device.XXXXXA6LX6BOBJF6XNWQM2ZO4NVVGZRFFEL6PMXKWLOHI36IY3B4XCSZKZPR42RAWCBSQEDNGS746OCC2PKR5KDIVAUY6F2DX5GV2SQAXPD7GMKQRWLG4LFKXFPVLVTXHFGLCQKHB7ZNBKLHQU4SJG6NNGA",
        user_id: "xxxxx123xxxxx",
        hotel_id: '1',
        room_no: hotelData.rooms[0].room_no,
        address: hotelData.hotel.address,
        belongs_to: hotelObjId,
        room: roomObjId
    };

    await DeviceModel.findOneAndUpdate({ hotel_id: '1', room_no: hotelData.rooms[0].room_no }, dummyDevice, { new: false, upsert: true });
}

module.exports.deleteDevice = async () => {
    await DeviceModel.deleteOne({ hotel_id: '1', room_no: hotelData.rooms[0].room_no });
}

/**
 * Method takes a response from server, removes the breaks and returns the response.
 * The tests do not have to compare the SSML break tags
 * @param {any} response
 */
module.exports.removeSpace = (response) => {
    //return response.replace(/<.*>/, '').replace(/ +(?= )/g, '');
    return response.replace(/\s/g, '');
    //return response.replace(/ +(?= )/g, '');
}

module.exports.ConversationConfig = {
    runtime: 'app',
    userId: '111',
    locale: 'en-IN',
    //locale: 'keys-only',
    defaultDbDirectory: './test/user/',
    httpOptions: {
        host: 'localhost',
        port: 3002,
        path: '/webhook',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'jovo-test': 'true'
        },
    },
};

/**
 * Updates a graph node with new value
 * GraphModel.find({value:'1', 'nodes.v':'Gym'}, {'nodes.$.v':1})
 * @param {any} name
 * @param {any} key
 * @param {any} value
 */
module.exports.setValue = async (name, key, value) => {
    var field = 'nodes.$.value.' + key, fieldObj = {};
    fieldObj[field] = value;
    let ret = await GraphModel.findOneAndUpdate({ value: '1', 'nodes.v': name }, { $set: fieldObj }, { upsert: false, fields: { 'nodes.$': 1 } }).exec();
    //console.log('++++ After updated=', fieldObj, ',---', JSON.stringify(ret));
}

/**
 * Returns the node of the item
 * @param {any} key
 */
module.exports.item = async (key) => {
    let ret = await GraphModel.findOne({ value: '1', 'nodes.v': key }, { 'nodes.$.v': 1 });
    //console.log('---ret+++++=', ret.nodes[0].value);
    return !_.isUndefined(ret.nodes[0].value) ? ret.nodes[0].value : {};
}

module.exports.allItems = () => {
    return g.nodes();
}

/**
 * Function to create a dummy item
 * @param {any} type The type of the item
 * @returns {any} the created item
 */
module.exports.createItem = async (type, settings = {}) => {
    let facility = {
        v: 'Fagra',
        value: {
            f: true, iType: 'f',
            a: true,
            o: false,
            msg: { yes: 'There is one Fagra available in the hotel', no: 'We do not have Fagra in this hotel' },
            timings: { msg: 'The Fagra is open from 06:00 AM to 11:00 PM', time: { from: '0500', to: '1200' } },
            location: { msg: 'Fagra is located next to the cafe on the 4th floor' },
            price: { msg: 'The Fagra is free of cost to use for our guests', price: 0 },
            reserve: { msg: { yes: 'Call up the frontdesk to make a reservation', no: 'No reservation is required. You can walk-in to the gym' } },
        }
    };

    let menuitem = {
        v: 'Magra',
        value: {
            o: true,
            mtype: 'd',
            iType: 'm',
            a: true,
            c: true,
            m: true,
            qty: 1,
            price: 50
        }
    };

    let roomitem = {
        v: 'Ragra',
        value: {
            iType: 'ri',
            a: true,
            o: true,
            price: 0,
            ri: true,
            c: true,
            limit: { count: -1, for: 'stay' },
            msg: { yes: 'There is Lukra in you bathroom', no: 'We do not provide any Lukra' }
        }
    };

    let policy = {
        v: 'Pagra',
        value: {
            iType: 'p',
            p: true,
            a: true,
            msg: 'Makra is allowed in the room'
        }
    };

    let item = {};
    switch (type) {
        case 'm':
            item = menuitem;
            break;
        case 'f':
            item = facility;
            break;
        case 'ri':
            item = roomitem;
            break;
        case 'p':
            item = policy;
            break;
        default:
            // Invalid item type
            return;
    };
    let updated = _.merge({}, item.value, settings);
    item.value = updated;

    await GraphModel.findOneAndUpdate({ value: '1', 'nodes.v': 'all_items' }, { $push: { 'nodes.$.value': item.v } }).exec();   // Add to all_items node, since search uses this to find the item
    let ret = await GraphModel.findOneAndUpdate({ value: '1' }, { $push: { nodes: item } }, { upsert: true }).exec();
    return item;
}

module.exports.deleteItem = async (name) => {
    await GraphModel.findOneAndUpdate({ value: '1' }, { $pull: { 'nodes.$.v': name } }).exec();
    await GraphModel.findOneAndUpdate({ value: '1', 'nodes.v': 'all_items' }, { $pull: { 'nodes.$.value': name } }).exec();
}

async function test() {
    var createItem = require('./dbsetup').createItem;
    let r = await createItem('m');
    r = await createItem('ri');
    r = await createItem('f');
    //console.log(r);
    r = await createItem('p');
}

//test();
