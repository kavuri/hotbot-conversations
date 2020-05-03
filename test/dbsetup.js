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

const hotelData = {
    group: { name: 'Keys Group of Hotels', description: 'Keys group of hotels' },
    hotel: { name: 'Keys Hotel', description: 'This is a Keys hotel', address: { address1: 'ITPL Main Road 7, 7', address2: 'Near SAP office ', address3: 'Whitefield', city: 'Bengaluru', pin: '560037', state: 'Karnataka', country: 'India' }, contact: { phone: ['9888888888', '11111111'], email: ['whitefield@keyshotels.com'] }, coordinates: { lat: '12.979326', lng: '77.709559' }, rooms: [], front_desk_count: 2, reception_number: '9' },
    rooms: [{ room_no: '100', mtype: 'Deluxe' }, { room_no: '101', mtype: 'Supreme' }, { room_no: '102', mtype: 'Deluxe' }]
};

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
    let room = [], r;
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
    let hotel;
    try {
        console.log('Setting up database...');
        let group = await createHotelGroup();
        //console.log('created group=', group);
        hotel = await createHotel(group, '1');
        //console.log('created hotel=', hotel);
        let rooms = await createRooms(hotel);
        //console.log('created rooms=', rooms);

        return group;
    } catch (error) {
        throw error;
    }
}

module.exports.destroy = async () => {
    console.log('deleting data');
    await RoomModel.deleteMany({ hotel_id: '1' });
    await HotelModel.deleteOne({ hotel_id: '1' });
    await HotelGroupModel.deleteOne({ name: hotelData.group.name });
    await GraphModel.deleteOne({ value: '1' });
}