/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

/**
 * Create a graph representation of the facilities
 */
const graphlib = require('graphlib');
const Graph = graphlib.Graph;

var g = new Graph({ directed: true, compound: true });
const _ = require('lodash');

const facilities = 'facilities';
const policies = 'policies';
const roomitem = 'roomitem';
const menuitem = 'menuitem';

const GraphModel = require('../db/Graph');
/**
 * The Node names in the graphlib have to be unique. If the same node name is used, then the old one will be overwritten
 * 
 * Every main node has the following attributes
 * policy(p): true/false = indicates that the specific node has policy information
 *          Not mandatory. Mark only for nodes that are policies
 * facility(f): true/false = indicates that it is a facility
 *          Not mandatory. Mark only for nodes that are facilities
 * roomitem(ri): true/false = is the item in question a room item, like a fan,TV, remote, dustbin etc.
 *          Room item would have 'facility: false', since if the user asks for all_facilities, then it would be bad to say, 
 *          Not mandatory. Mark only for room items
 *          "We have facilities like dustbin, fan, TV". Rather facilities should be "swimming pool, fitness center"
 * menu(m): true/false = its a menu item
 *          Not mandatory. Mark only for menu items
 * eatable(e): true/false = it's an eatable
 *          Not mandatory. Mark only for eatables
 * drink(d): true/false = its a drink
 *          Not mandatory. Mark only for drinks
 * available(a): true/false = Is the item available in the hotel
 *          Mandatory for all nodes. Indicates whether the hotel has that facility or not
 * order(o): true/false = can the facility/item be ordered. Same as reserve (like a table in restaurant, reserve a pool)
 *          Not mandatory. Mark true only for items that can be ordered
 *          Like I would like to have some coffee.
 *          It would be wrong for another invocation like "I would like to have a gym"
 *          In the case of "gym", the flag order would be false
 * count(c): true/false = signifies that the item has a count
 *          Not mandatory. Mark true only if the item has a count to it
 *          Like, I would like to order 2 coffee
 * reserve(r): true/false = can the item be booked/reserved. NOT USED FOR NOW.
 *          Like: "I would like to reserve a table in the restaurant at 09:00PM" or "I would like to book a taxi"
 *          Not mandatory. Mark only for facilities that are bookable/reservable
 *          For other items, like food, book would be false, since the user cannot say "I would like to book a dosa"
 * limit: {count: 1, for:'day/stay'} = the limit on the items to be served for free
 * price: amount > 0' = the price of the item
 *          Set only if price > 0, else if no price is set for the item, it is deemed as free
 *          An item cannot have limit and price at the sametime. Because, the hotel can serve the item at a price
 *          
 * Meta Nodes
 * 'all_items': Holds all the items that can be searched
 * 'facilities': all facilities
 * 'menu': all menu items
 * 'roomitem': all room items (like AC, TV, fridge, napkins)
 */
function createGraph(hotel) {
    if (_.isUndefined(hotel)) {
        throw new Error('invalid hotel_id or hotel_name:', hotel);
    }

    g.setGraph(hotel.hotel_id);

    // Create hotel & its nodes
    g.setNode(hotel.hotel_id, hotel.name);

    // Hotel points to the following nodes
    // hotel_id->main_facilities, hotel_id->facilities, hotel_id->policies
    g.setEdge(hotel.hotel_id, 'main_facilities', { label: 'main_facilities' });
    g.setEdge(hotel.hotel_id, facilities, { label: 'facilities' });
    g.setEdge(hotel.hotel_id, policies, { label: 'policies' });
    g.setEdge(hotel.hotel_id, roomitem, { label: 'roomitem' });
    g.setEdge(hotel.hotel_id, menuitem, { label: 'menuitem' });

    // Create policies nodes
    g.setNode('smoking', { iType: 'p', p: true, a: true, msg: 'smoking is not allowed in the hotel premises.' });
    g.setParent('smoke', 'smoking');
    g.setParent('cigar', 'smoking');
    g.setParent('cigarette', 'smoking');
    g.setParent('beedi', 'smoking');
    g.setParent('vape', 'smoking');
    g.setParent('vaping', 'smoking');
    g.setParent('electronic', 'smoking');
    g.setParent('cigar', 'smoking');
    g.setParent('hookah', 'smoking');

    g.setNode('alcohol', { iType: 'p', p: true, a: true, msg: 'alcohol consumption is not allowed in your room or hotel premises' });
    g.setParent('rum', 'alcohol');
    g.setParent('gin', 'alcohol');
    g.setParent('whiskey', 'alcohol');
    g.setParent('brandy', 'alcohol');
    g.setParent('vodka', 'alcohol');
    g.setParent('beer', 'alcohol');
    g.setParent('draft beer', 'alcohol');
    g.setParent('cognac', 'alcohol');
    g.setParent('wine', 'alcohol');

    g.setNode('cancellation', { iType: 'p', p: true, a: true, msg: 'The room cancellation policy is mentioned in your booking details.' });
    g.setParent('room cancellation', 'cancellation');

    g.setNode('infants', { p: true, iType: 'p', a: true, msg: 'There are no charges for children below the age of 5 years.' });
    g.setParent('children policy', 'infants');
    g.setParent('infants stay', 'infants');

    g.setNode('checkout time', { p: true, iType: 'p', a: true, msg: 'The checkout time for the room is 12:00PM. If you want to extend your stay, you will need to contact the reception.' });
    g.setParent('vacate time', 'checkout time');

    g.setNode('no show', { p: true, iType: 'p', a: true, msg: 'In case of no show the first nights room rent would be charged. The rest of the booking amount would be refunded to your account.' });

    g.setNode('outside food', { p: true, iType: 'p', a: true, msg: 'We do not allow outside food to be brought into the hotel' });
    g.setParent('food from outside', 'outside food');

    g.setNode('checkin time', { p: true, iType: 'p', a: true, msg: 'The check in time for this hotel is 12:00PM' });

    g.setNode('pets', { p: true, iType: 'p', a: true, msg: 'Usually pets are not allowed in this hotel. For special requests, please talk to the reception ' });
    g.setParent('cat', 'pets');
    g.setParent('dog', 'pets');
    g.setParent('my pet', 'pets');

    g.setNode('payment methods', { p: true, iType: 'p', a: true, msg: 'We accept payment by PayTM, Credit card, debit card, cash' });
    g.setParent('credit card', 'payment method');
    g.setParent('debit card', 'payment method');
    g.setParent('cash', 'payment method');
    g.setParent('bank transfer', 'payment method');
    g.setParent('wire transfer', 'payment method');
    g.setParent('electronic transfer', 'payment method');
    g.setParent('UPI', 'payment method');
    g.setParent('paytm', 'payment method');
    g.setParent('Google Pay', 'payment method');
    g.setParent('Net banking', 'payment method');

    // Set the edges
    createEdges(policies, ['smoking', 'alcohol', 'cancellation', 'infants', 'checkout time', 'no show', 'outside food', 'check-in time', 'pets', 'payment methods'], { label: 'policy' });

    g.setNode('main_facilities', {
        f: true, iType: 'f', a: false, o: false,
        msg: { yes: ' We have facilitie like restaurant, luggage storage, clothes ironing, room service', no: ' ' },
        timings: { msg: ' ', time: { from: ' ', to: ' ' } },
        location: { msg: ' ' },
        price: { msg: ' ', price: 0 },
        reserve: { msg: { yes: ' ', no: ' ' } },
    });

    g.setNode('Cuisines', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We serve South India, North Indian food', no: 'We do not have restaurant facility' },
        timings: { msg: ' ', time: { from: ' ', to: ' ' } },
        location: { msg: ' ' },
        price: { msg: ' ', price: 0 },
        reserve: { msg: { yes: ' ', no: ' ' } },
    });

    // Create facilities
    g.setNode('Gym', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'There is one fitness center available on the 4th floor next to the cafe', no: 'There is no gym in this hotel' },
        timings: { msg: 'The gym is open from 06:00 AM to 11:00 PM', time: { from: '0500', to: '1200' } },
        location: { msg: 'gym is located next to the cafe on the 4th floor' },
        price: { msg: 'The gym is free to use for our guests', price: 0 },
        reserve: { msg: { yes: 'Call up the frontdesk to make a reservation', no: 'No reservation is required. You can walk-in to the gym' } },
    });
    g.setParent('fitness center', 'Gym');   // synonyms of the facility are set as children
    g.setParent('workout place', 'Gym');

    g.setNode('Kids pool', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have a childrens pool on the ground floor', no: 'There is no childrens pool in this hotel' },
        location: { msg: 'kids pool is located on the groud floor. You can take the lift to reach the floor' },
        timings: { msg: 'The childrens pool is open from morning 06:00 A.M to 02:00 P.M and again in the evening 06:00 P.M to 11:00 P.M', time: { 'from': '0500', 'to': '1200' } },
        price: { price: 200, msg: 'There is a charge of 200 rupees for using the childrens pool' },
        reserve: { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } },
    });
    g.setParent('childrens pool', 'Kids pool');
    g.setParent('childrens swimming pool', 'Kids pool');
    g.setParent('kids swimming pool', 'Kids pool');

    g.setNode('Adults pool', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have an an adults pool and it is on the west wing of the hotel', no: 'There is no adults swimming pool in this hotel' },
        location: { msg: 'The adults swimming pool is on the west wing of the hotel ' },
        timings: { msg: 'The adults pool is open from morning 06:00 AM to 05:00 PM and again in the evening 0600 to 2200', time: { 'from': '0500', 'to': '1200' } },
        reserve: { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } },
        price: { price: 200, msg: 'The adults pool is free to use for our guests' }
    });
    g.setParent('adults pool', 'Adults pool');
    g.setParent('big swimming pool', 'Adults pool');

    g.setNode('Sauna', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have a sauna facility in our hotel. Its on the top floor and you can take the lift ', no: 'We do not have sauna facility in this hotel' },
        location: { msg: 'Sauna is located on the top floor and you can take the lift to reach it' },
        timings: { msg: 'The Sauna is open from morning 06:00 AM to 09:00 PM and again in the evening 0600 to 2200', time: { from: '0500', to: '1200' } },
        reserve: { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } },
        price: { price: 200, msg: 'There is a charge of 500 rupees for using the Sauna. The cost will be added to your hotel bill' }
    });
    g.setParent('steam room', 'Sauna');
    g.setParent('steam bath', 'Sauna');

    g.setNode('Dry cleaning', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'we offer dry cleaning service of your clothes at our hotel', no: 'we do not have Dry cleaning service at our hotel' },
        location: { msg: 'To use the dry cleaning service, please leave the clothes in the bag provided in the closet. We will dry clean and return to your room on completion' },
        timings: { msg: 'We pick up clothes two times per day, once in the morning around 08:00 A.M and another in the evening around 04:00 P.M', time: { 'from': '0500', 'to': '1200' } },
        reserve: { flag: true, msg: { yes: 'you will need to register with the front desk to book a slot', no: 'There is no registration required' } },
        price: { price: 400, msg: 'The dry cleaning charges are mentioned in the laundry charges sheet in the closet ' }
    });
    g.setParent('Dry wash', 'Dry cleaning');

    g.setNode('Laundry', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We offer Laundry service at our hotel', no: 'We do not have Laundry service at our hotel' },
        location: { msg: 'To use the laundry service, please leave the clothes in the bag provided in the closet. We will wash and iron the clothes and return to your room on completion' },
        timings: { msg: 'For clothes laundry, We pick up clothes two times per day, once in the morning around 08:00 A.M and another in the evening around 04:00 P.M', time: { 'from': '0500', 'to': '1200' } },
        reserve: { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } },
        price: { price: 400, msg: 'The dry cleaning charges are mentioned in the laundry charges sheet in the closet ' }
    });
    g.setParent('washing', 'Laundry');
    g.setParent('clothes wash', 'Laundry');

    g.setNode('Ironing', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'For ironing clothes, we have an iron box in your room. It is in the closet', no: 'We do not have clothes Ironing facility at this hotel' },
        location: { msg: 'The iron box is available in the closet in your room' },
        timings: { msg: 'You can use the iron box any time of the day ', time: { 'from': '0500', 'to': '1200' } },
        reserve: { flag: true, msg: { yes: 'You can place an order for Ironing clothes', no: 'You can do the Ironing yourself with the iron box provided in the room' } },
        price: { price: 200, msg: 'The iron box is free to use for our guests' }
    });
    g.setParent('clothes iron', 'Ironing');

    g.setNode('Taxi', {
        f: true, iType: 'f', a: true, o: true,
        msg: { yes: 'For taxi service, we suggest our guests to use services like Ola or Uber', no: 'For taxi service, we suggest our guests to use services like Ola or Uber' },
        location: { msg: 'The taxi will arrive right in front of the hotel' },
        timings: { msg: 'The taxi services are available round the clock', time: { 'from': '0500', 'to': '2400' } },
        reserve: { flag: true, msg: { yes: 'I can place an order to book a taxi', no: 'I cannot make a taxi booking. You will have to use the taxi apps like Ola or Uber to book one' } },
        price: { price: 200, msg: 'You will pay to the taxi can operator as per the usage' },
        billing: { flag: true, msg: { yes: 'The taxi charges are included in your bill', no: 'You have to pay the driver yourself' } }
    });
    g.setParent('cab', 'Taxi');
    g.setParent('car rental', 'Taxi');
    g.setParent('car hire', 'Taxi');    //FIXME: Complete the flow of taxi booking

    g.setNode('Shuttle', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have a shuttle service that can take you around 2 kilometers radius from the hotel', no: 'We do not have shuttle service at the hotel' },
        reserve: { flag: true, msg: { yes: 'I can place an order to book a taxi', no: 'I cannot make a taxi booking. You will have to use the taxi apps like Ola or Uber to book one' } },
        timings: { msg: 'The shuttle service is available from morning 0800 to evening 1800hrs at a gap of 30 minutes. You will need to wait at the reception to board a shuttle ', time: { from: '0700', to: '1200' } },
        location: { msg: 'The shuttle service is available near the entrance of the hotel ' },
        price: { price: 200, msg: 'The shuttle service is free of charge for our guests' },
        billing: { flag: true, msg: { yes: 'You do not have to pay for the shuttle', no: 'You will have to pay the driver directly' } }
    });

    g.setNode('Wifi', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have wifi facility all across the hotel. The hotel reception will provide your the login details for usage', no: 'We do not have wifi facility for our guests' },
        location: { msg: 'Wifi is available everywhere in the hotel' },
        timings: { msg: 'The wifi is available round the clock', time: { from: '0000', to: '0000' } },
        price: { price: 200, msg: 'Wifi facility is free to use for our guests' },
        billing: { flag: true, msg: { yes: 'Wifi charges will be added to your bill', no: 'You will have to pay for your wifi charges separately' } },
        password: { flag: true, msg: { yes: 'The frontdesk will provide the wifi password', no: 'There is no wifi password' } }
    });
    g.setParent('internet', 'Wifi');
    g.setParent('data connection', 'Wifi');
    g.setParent('wireless network', 'Wifi');
    g.setParent('wireless', 'Wifi');

    g.setNode('Massage', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have body massage facility at the hotel. Please get in touch with the front desk for details', no: 'We do not have massage facility at the hotel' },
        location: { msg: 'The massage facility is available on the 3rd floor in a room marked as massage' },
        timings: { msg: 'The massage facility is open from morning 06:00 AM to 05:00 PM and again in the evenings from 1600 to 2200', time: { 'from': '0700', 'to': '1400' } },
        reserve: { flag: true, msg: { yes: 'You  will need to register with the front desk to book a slot', no: 'There is no registration required' } },
        price: { price: 800, msg: 'There is a charge of 1000 rupees per session for the massage' }
    });
    g.setParent('Massage_room', 'Massage');

    g.setNode('Car cleaning', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have car cleaning service at our hotel. Contact reception to book a for a slot', no: 'We do not have vehicle cleaning service at the hotel' },
        location: { msg: 'For cleaning leave the keys of your vehicle at the reception' },
        timings: { msg: 'The Car cleaning is done from morning 05:00 AM to 10:00 AM in the morning', time: { 'from': '0700', 'to': '1900' } },
        reserve: { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } },
        price: { price: 100, msg: 'There is a charge of 100 rupees for cleaning the car' }
    });
    g.setParent('car wash', 'Car cleaning');

    g.setNode('Bicycle', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have bicycle rental service. Contact the reception for booking a bicycle', no: 'We do not have bicycle rental service at the hotel' },
        location: { msg: 'Bicycles are located at the bicycle parking space in front of the hotel' },
        timings: { msg: 'Bicycles can be rented from morning 07:00 A.M to evening 05:00 P.M', time: { 'from': '0500', 'to': '2400' } },
        reserve: { flag: true, msg: { yes: 'You will need to register at the front desk for renting the bicycle', no: 'There is no bicycle rental service available in the hotel' } },
        price: { price: 100, msg: 'There is a charge of 200 rupees for renting the bicycle for 24 hours' }
    });
    g.setParent('Bicycle rental', 'Bicycle');

    g.setNode('Bike', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have motor bike rental service at our hotel. Contact the reception for booking a motor bike', no: 'We do not have motorbike rental service at the hotel' },
        location: { msg: 'The rental bikes are located at the bike rental space near the entrance of the hotel' },
        timings: { msg: 'Motor bikes can be rented from morning 08:00 A.M to 10:00 P.M ', time: { 'from': '0500', 'to': '2400' } },
        reserve: { flag: true, msg: { yes: 'You will need to register at the front desk for renting the bike', no: 'There is no bike rental service available in the hotel' } },
        price: { price: 300, msg: 'There is a charge of 5000 rupees for renting the bike for 24 hours with a security deposit of 10000 rupees' }
    });
    g.setParent('bike rental', 'Bike');
    g.setParent('bike for rent', 'Bike');

    g.setNode('Bar', {
        f: true, iType: 'f', a: true, o: true,
        msg: { yes: 'We have a bar on the terrace of the hotel.', no: 'We do not have a bar at the hotel' },
        location: { msg: 'The bar is located on the terrace of the hotel. You can reach using the lift' },
        timings: { msg: 'The Bar is open from 11:00 A.M to 11:30 P.M', time: { from: '1030', to: '1500' } },
        reserve: { flag: true, msg: { yes: 'You can call the bar extension code to reserve a table', no: 'There is no bar available in the hotel premises' } },
        price: { price: 300, msg: 'You will have to pay the price as per the consumption directly to the bar' }
    });
    g.setParent('pub', 'Bar');
    g.setParent('night club', 'Bar');
    g.setParent('tavern', 'Bar');

    g.setNode('Reception', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'The hotel reception is located near the entrance', no: 'I am your receptionist. Please let me know what you want' },
        timings: { time: { from: '0000', to: '0000' }, msg: { yes: 'The reception is open round the clock', no: 'I am your reception. Please let me know how I can help' } },
        location: { time: { from: '0000', to: '0000' }, msg: 'The reception is located near the entrance' },
        languages: { msg: 'The reception speaks english, hindi, telugu, tamil, malayalam, kannada' },
        price: { msg: 'The reception is available at your service', price: 0 }
    });
    g.setParent('front desk', 'Reception');

    g.setNode('Spa', {
        f: true, iType: 'f', iType: 'f', a: true, o: true,
        msg: { yes: 'We have Spa facility at our hotel. Contact reception for booking a slot', no: 'We do not have Spa facility at this hotel' },
        location: { msg: 'The spa facility is located on the outer corridor' },
        timings: { msg: 'Spa is available from 06:00 A.M to 12:00 P.M and again in the evening from 04:00 P.M to 10:00 P.M', time: { 'from': '0500', 'to': '1200' } },
        reserve: { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } },
        price: { price: 200, msg: 'The price of the spa varies per treatment. Please contact the reception for the details' },
        billing: { msg: 'You will have to pay separately at the spa. The charges will not be made part of bill' }
    });
    g.setParent('body treatment', 'Spa');
    g.setParent('facials', 'Spa');

    g.setNode('Room Service', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have room Room service at the hotel', no: 'We do not have Room service available at the hotel' },
        price: { price: 50, msg: 'The room service is free of charge for our guests' },
        location: { msg: 'We have room service at the hotel and we can get your food order to your room' },
        timings: { time: { from: '05:00', to: '23:00' }, msg: 'Room service is available from morning 06:00 A.M to night 10:30 P.M' },
        billing: { msg: 'The charges would be added to your room bill, that you can pay at checkout time' }
    });
    g.setParent('room delivery', 'Room Service');

    g.setNode('Cooking', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have cooking facilities at the hotel. Ask reception for any cutlery items you might need.', no: 'We do not have cooking facility at the hotel ' },
        price: { price: 0, msg: 'The cooking facility is free of cost for our guests' },
        location: { msg: 'You can cook in your room ' },
        timings: { time: { from: '05:00', to: '23:00' }, msg: 'You can cook any time of the day, but ensure you do not cause any untoward incidents' },
        billing: { msg: 'The charges would be added to your room bill, that you can pay at checkout time' }
    });
    g.setParent('Cooking facilities', 'Cooking');
    g.setParent('Cooking utilities', 'Cooking');

    g.setNode('Storage', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We help you store you luggage in a safe place in our hotel. carry your baggage to the reception for storage', no: 'we do not have storage space at the hotel' },
        price: { price: 50, msg: 'We charge 100 rupees per piece of luggage for 1 day of storage' },
        size: { msg: 'We can store a maximum of 2 bags. But please visit the reception for clarification' },
        location: { msg: 'The storage location is near the reception' },
        timings: { msg: 'We can help with the storage from morning 06:00 A.M to 11:00 P.M at the reception ', time: { from: '04:00', to: '11:00' } }
    });
    g.setParent('Luggage', 'Storage');
    g.setParent('Cloak room', 'Storage');
    g.setParent('Storage space', 'Storage');

    g.setNode('Restaurant', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have a restaurant on the ground floor', no: 'We do not have a  restaurant in the hotel' },
        timings: { time: { from: '0600', to: '2300' }, msg: 'the restaurant is open from morning 06:00 A.M to night 11:00 P.M ' },
        location: { msg: 'the restaurant located on the ground floor' },
        price: { price: 50, msg: 'You can pay as per your consumption at the restaurant' },
        reserve: { flag: true, msg: { yes: 'You will need to book a table for the restaurant', no: 'You can walk-in. There is no registration required' } },
        take_away: { flag: true, msg: { yes: 'Takeway of food is possible. Ask at the reservation', no: 'Takeway of food is not possible. Ask for options at restaurant' } }
    });
    g.setParent('eat out', 'Restaurant');
    g.setParent('hotel food', 'Restaurant');
    g.setParent('dining area', 'Restaurant');

    g.setNode('Breakfast', {
        f: true, iType: 'f', a: true, o: true,
        msg: { yes: 'We have breakfast facility at the hotel. It might be included in your package as per your booking', no: 'We do not have breakfast facility at the hotel' },
        timings: { time: { from: '0700', to: '1000' }, msg: 'Breakfast is served from morning 07:00 A.M to 10:00 A.M during weekdays and from 07:00 A.M to 11:00 P.M on weekends' },
        location: { msg: 'Breakfast is served in the restaurant on the ground floor' },
        room_service: { msg: 'Breakfast can be served in the room. Would you like me to order?' },
        price: { price: 200, msg: 'If breakfast is not included in your package, there is a charge of 400 rupees per person per day' },
        content: { msg: 'We serve South Indian, continental buffet breakfast' },
        takeaway: { flag: true, msg: { yes: 'Ask the staff to pack a quantity of food for You', no: 'There is no takeaway facility' } },
        billing: { msg: 'Breakfast price is added to your room bill' }
    });
    g.setParent('tiffin', 'Breakfast');
    g.setParent('morning food', 'Breakfast');

    // Kitchen items
    g.setNode('Bottle Steralizer', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We can help you with Bottle sterilization. Please visit the kitchen with the bottle', no: 'We do not have Bottle sterilization facility at the hotel' },
        timings: { time: { from: '0700', to: '1000' }, msg: 'We can help with bottle steralization from morning 07:00 A.M to 12:00 P.M and from evening 05:00 P.M to night 09:00 P.M' },
        location: { msg: 'Bottle steralization will be done in the kitchen on the ground floor' },
        price: { price: 0, msg: 'Its free of cost' },
    });

    g.setNode('Microwave', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have a common microwave facility at the hotel near the kitchen on the ground floor', no: 'We do not have microwave facility at the hotel' },
        timings: { time: { from: '0700', to: '1000' }, msg: 'The microwave facility is available 24 by 7 round the clock' },
        location: { msg: 'The microwave is near the kitchen on the ground floor' },
        price: { price: 0, msg: 'The microwave is free to use for our guests ' },
    });
    g.setNode('Oven', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have a common oven facility at the hotel near the kitchen on the ground floor', no: 'We do not have oven facility at the hotel' },
        timings: { time: { from: '0700', to: '1000' }, msg: 'The oven facility is available 24 by 7 round the clock' },
        location: { msg: 'The oven is near the kitchen on the ground floor' },
        price: { price: 0, msg: 'The oven is free to use for our guests ' },
    });
    g.setNode('Cutlery', {
        f: true, iType: 'f', a: true, o: false,
        msg: { yes: 'We have some cutlery at the hotel that you can use for cooking. You are provided some in your room. Check with the reception if you need more ', no: 'We do not have cooking facility at the hotel' },
        timings: { time: { from: '0700', to: '1000' }, msg: 'We can provide extra cutlery between morning 07:00 A.M to night 07:00 P.M' },
        location: { msg: 'Cutlery is available in your room' },
        price: { price: 0, msg: 'The cutlery is free to use for our guests' },
    });

    // Room items
    g.setNode('Cleaning liquid', { price: 0, ri: true, o: true, iType: 'ri', a: false, c: false, limit: { count: 2, for: 'day' }, msg: { yes: 'We have provided cleaning liquid in your room', no: 'We do not have cleaning liquid in our rooms' } });
    g.setNode('TV', { o: false, price: 0, ri: true, iType: 'ri', a: true, c: false, limit: { count: 1, for: 'stay' }, msg: { yes: 'We have a TV in your room and it plays all Indian channels', no: 'We do not have TV facility in our hotel' } });
    g.setParent('television', 'TV');
    g.setNode('Tissues', { o: true, price: 0, ri: true, iType: 'ri', a: true, c: true, limit: { count: 2, for: 'day' }, msg: { yes: 'We have tissues at our hotel and can get you some', no: 'We do not have tissues to order at our hotel' } });
    g.setParent('Paper napkins', 'Tissues');
    g.setParent('Paper napkin', 'Tissues');
    g.setParent('Wipes', 'Tissues');
    g.setNode('Dustbin', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: false, limit: { count: 2, for: 'stay' }, msg: { yes: 'A dustbin is provided in your room', no: 'We do not have dustbins in the room. You can drop your garbage in the common area on each floor' } });
    g.setParent('dust basket', 'Dustbin');
    g.setParent('garbage can', 'Dustbin');
    g.setParent('waste basket', 'Dustbin');
    g.setNode('Hanger', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: true, limit: { count: 10, for: 'stay' }, msg: { yes: 'Hangers are provided in the closet in your room', no: 'We do not provide extra hangers apart from the ones in your room ' } });
    g.setParent('Clothe hangers', 'Hanger');
    g.setNode('Clock', { a: false, o: true, price: 0, ri: true, c: false, limit: { count: 1, for: 'stay' }, msg: { yes: 'There is a table clock provided in your room', no: 'We do not have a clock. You can ask Alexa for the time instead' } });
    g.setParent('Watch', 'Clock');
    g.setNode('Pullover', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: false, limit: { count: 2, for: 'stay' }, msg: { yes: 'There are pull overs provided in the room', no: 'We do not provide more than 2 pull overs for your stay at the hotel' } });
    g.setParent('Rug', 'Pullover');
    g.setNode('Pillow', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: false, limit: { count: -1, for: 'stay' }, msg: { yes: 'There are pillows provided in the room', no: 'We do not provide extra pillows other than the ones provided in your room' } });
    g.setNode('Towel', { iType: 'ri', a: true, o: false, price: 0, ri: true, c: true, limit: { count: 5, for: 'day' }, msg: { yes: 'There are towels provided in your bathroom', no: 'We do not provide towels. You need to get your own' } });
    g.setParent('Bath towel', 'Towel');
    g.setNode('Napkin', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: true, limit: { count: 2, for: 'day' }, msg: { yes: 'There are napkins provided in your room', no: 'We do not provide napkins' } });
    g.setParent('Hand napkin', 'Napkin');
    g.setNode('Soap', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: true, limit: { count: 2, for: 'day' }, msg: { yes: 'There is a soap in your bathroom', no: 'We do not provide a soap. You will need to get your own' } });
    g.setParent('Bath soap', 'Soap');
    g.setParent('Bath cream', 'Soap');
    g.setParent('Shower cream', 'Soap');
    g.setNode('Shampoo', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: true, limit: { count: -1, for: 'stay' }, msg: { yes: 'There is liquid shampoo in you bathroom', no: 'We do not provide any shampoo' } });
    g.setParent('Hair liquid', 'Shampoo');
    g.setNode('Comb', { a: false, o: true, price: 0, ri: true, c: true, limit: { count: 2, for: 'stay' }, msg: { yes: 'There is a comb provided in your bathroom', no: 'We do not provide a comb' } });
    g.setParent('Hair comb', 'Comb');
    g.setNode('Fridge', { a: false, o: false, price: 0, ri: true, c: false, limit: { count: 0, for: 'day' }, msg: { yes: 'There is a fridge in your room', no: 'We do not provide a fridge' } });
    g.setParent('Refrigerator', 'Fridge');
    g.setNode('AC', { iType: 'ri', a: true, o: false, price: 0, ri: true, c: false, limit: { count: 2, for: 'day' }, msg: { yes: 'There is an AC in your room', no: 'We do not provide an AC' } }); // FIXME: AC is per room and not across the hotel. This needs to be linked to a room number
    g.setParent('Air Conditioner', 'AC');
    g.setParent('Air cooler', 'AC');
    g.setNode('Iron box', { a: false, o: true, price: 0, ri: true, c: false, limit: { count: 2, for: 'day' }, msg: { yes: 'There is an iron box in your room', no: 'We do not provide an iron box' } });
    g.setParent('Iron machine', 'Iron box');
    // g.setNode('Coffee machine', { a: false, o: true, price: 0, ri: true, c: false, msg: { yes: 'There is a coffee machine in your room ', no: 'We do not have a coffee machine' } });
    // g.setParent('Coffee brew', 'Coffee machine');
    // g.setParent('Expresso machine', 'Coffee machine');
    g.setNode('Tea machine', { a: false, o: false, price: 0, ri: true, c: false, limit: { count: 2, for: 'day' }, msg: { yes: 'There is a tea machine in your room ', no: 'We do not have a tea machine' } });
    g.setNode('Dish washer', { a: false, o: false, price: 0, ri: true, c: false, limit: { count: 2, for: 'day' }, msg: { yes: 'There is a dish washer in your room ', no: 'We do not have a dish washer' } });
    g.setNode('Fan', { iType: 'ri', a: true, o: false, price: 0, ri: true, c: false, limit: { count: 2, for: 'day' }, msg: { yes: 'There is a fan in your room ', no: 'We do not have a fan in the room' } });
    g.setNode('Water', { iType: 'ri', a: true, o: true, ri: true, c: true, price: 0, limit: { count: 2, for: 'day' }, msg: { yes: 'We provide two water bottles daily', no: 'We do not have water at our hotel' } });
    g.setParent('Water bottle', 'Water');
    g.setParent('Bottle of water', 'Water');
    g.setNode('Extra bed', { iType: 'ri', a: true, o: true, price: 0, ri: true, c: true, limit: { count: 1, for: 'stay' }, msg: { yes: 'We can provide an extra bed on request', no: 'We do not have provison for extra bed at our hotel' } });
    g.setNode('Menu', { iType: 'ri', a: true, o: false, price: 0, ri: true, c: false, limit: { count: 2, for: 'day' }, msg: { yes: 'There is a menu in the room', no: 'We do not have a menu in the room. Please let me know what you would like to order' } });
    g.setNode('lock', { iType: 'ri', a: true, o: false, price: 0, ri: true, c: false, limit: { count: 1, for: 'stay' }, msg: { yes: 'Its an automatic lock', no: 'You do not need a separate lock' } });
    g.setParent('door lock', 'lock');

    // Menu items
    // g.setParent('menu options', 'cuisines');
    // g.setParent('menu types', 'cuisines');
    // g.setParent('food types', 'cuisines');
    // g.setEdge('restaurant', 'cuisines', { label: 'restaurant' });
    /*
    g.setNode('South Indian', { a: true, m: true, msg: 'We serve south Indian food' });
    g.setNode('North Indian', { a: true, m: true, msg: 'We serve North Indian food' });
    g.setNode('Thai', { a: true, m: true, msg: 'We serve Thai food' });
    g.setNode('Kerala', { a: true, m: true, msg: 'We serve Kerala food' });
    g.setNode('Andhra', { a: true, m: true, msg: 'We serve Andhra food' });
    g.setNode('Karnataka', { a: true, m: true, msg: 'We serve Karnataka food' });
    g.setNode('Chinese', { a: true, m: true, msg: 'We serve Chinese food' });
    g.setNode('Odiya', { a: true, m: true, msg: 'We serve Odiyafood' });
    g.setNode('Jain', { a: true, m: true, msg: 'We serve Jainfood' });
    g.setNode('Marathi', { a: true, m: true, msg: 'We serve Marathi food' });
    g.setNode('Gujarathi', { a: true, m: true, msg: 'We serve Gujarathi food' });
    g.setNode('Tamil', { a: true, m: true, msg: 'We serve Tamilian food' });
    g.setNode('Continental', { a: true, m: true, msg: 'We serve Continental food' });
    */
    createEdges('Cuisines', ['South Indian', 'North Indian', 'Thai', 'Kerala', 'Andhra', 'Krnataka', 'Chinese', 'Odiya', 'Jain', 'Marathi', 'Gujarathi', 'Tamil', 'Continental'], { label: 'cuisines' });

    g.setNode('Salt', { o: true, iType: 'm', a: true, m: true, mtype: 'e', c: false, qty: 1, price: 0 });
    g.setNode('Sugar', { o: true, iType: 'm', a: true, m: true, mtype: 'e', c: false, qty: 1, price: 0 });

    g.setNode('Beverages', { submenu: true });
    g.setNode('Coffee', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 30 });
    g.setNode('Tea', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 30 });
    g.setNode('Hot Badam Milk', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Plain Milk', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 30 });

    g.setNode('Breakfast', { submenu: true });
    g.setNode('Idly', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 2, price: 40 });
    g.setNode('Vada', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Idly Vada', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Poori', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 3, price: 75 });
    g.setNode('Rice bath', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 60 });
    g.setNode('Curd Vada', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Bonda Soup', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Rava Idly', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });

    g.setNode('Dosas', { submenu: true });
    g.setNode('Plain Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 60 });
    g.setNode('Masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Butter Masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 85 });
    g.setNode('Butter Plain Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 75 });
    g.setNode('Special Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Paper plain Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Paper masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Onion Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setParent('Uttappam', 'Onion Dosa');
    g.setNode('Rava Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Open Butter masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Set Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Rava onion Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Rava masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Cheese masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 100 });
    g.setNode('Cheese plain Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Ragi Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Ragi masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Veg Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Bread onion Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Spring Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Rava onion masala Dosa', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 100 });

    g.setNode('Meals', { submenu: true });
    g.setNode('South Indian meals', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 125 });
    g.setNode('North Indian meals', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });

    g.setNode('Papad', { submenu: true });
    g.setNode('Masala papad', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Roasted Masala papad', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Roasted papad', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 25 });
    g.setNode('Fry papad', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 25 });

    g.setNode('Guru Prasad Special Kulfi Falooda', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    g.setNode('Fruit Salad Ice cream', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 130 });
    g.setNode('Chocolate Cup', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 75 });
    g.setNode('Kesar Pista Cup', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Butterscotch Cup', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Mango Cup', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Vanilla Cup', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Strawberry Cup', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Guru Prasad Udupi Spl. Ice Cream', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 200 });
    g.setNode('Garber Ice Cream', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    g.setNode('Banana Spl. Ice Cream', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    g.setNode('Hot Chocolate Fudge', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    g.setNode('Orange Stunt', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 170 });
    g.setNode('Mix Furit punch', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    g.setNode('Icecream Falooda', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    g.setNode('Gulab Jamun & Vanilla Ice-cream', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    createEdges('Desserts', ['Guru Prasad Special Kulfi Falooda', 'Fruit Salad Ice cream', 'Chocolate Cup', 'Kesar Pista Cup', 'Butterscotch Cup', 'Mango Cup', 'Vanilla Cup', 'Strawberry Cup', 'Guru Prasad Udupi Spl. Ice Cream', 'Garber Ice Cream', 'Banana Spl. Ice Cream', 'Hot Chocolate Fudge', 'Orange Stunt', 'Mix Furit punch', 'Icecream Falooda', 'Gulab Jamun & Vanilla Ice-cream',], { label: 'Desserts' });

    g.setNode('Soft Drinks', { submenu: true });
    g.setNode('Ice Tea', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Virgin Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Badam Milk', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Milk Shake', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    g.setNode('Milk Shake with Strawberry', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Milk Shake Butter Scotch', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Milk Shake with Chocolate', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Milk Shake with Mango', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Cold Coffee', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 140 });
    g.setNode('Cold Coffee with Ice Cream', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Sweet Lassi', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 60 });
    g.setNode('Salt Lassi', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Soft Drink', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Butter Milk', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Lemon Water', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 30 });
    g.setNode('Mineral Water', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    createEdges('Soft Drinks', ['Ice Tea', 'Virgin Mojito', 'Badam Milk', 'Milk Shake', 'Milk Shake with Strawberry', 'Milk Shake Butter Scotch', 'Milk Shake with Chocolate', 'Milk Shake with Mango', 'Cold Coffee', 'Cold Coffee with Ice Cream', 'Sweet Lassi', 'Salt Lassi', 'Soft Drink', 'Butter Milk', 'Lemon Water', 'Mineral Water',], { label: 'Soft Drinks' });

    g.setNode('Special Rice Items', { submenu: true });
    g.setNode('Pulao North Indian', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    g.setNode('Pongal (Sunday)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 125 });
    g.setNode('Bisi Bele Bath (Anna) (Monday)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 125 });
    g.setNode('Tomato Rice (Tuesday, Thursday)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 125 });
    g.setNode('Veg Pulao South Indian (Wednesday, Saturday)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 125 });
    g.setNode('Lemon Rice (Friday)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 125 });
    g.setNode('Curd Rice (All 7 days)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 125 });
    g.setNode('Plain Rice', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 60 });
    g.setNode('Sambar Rice', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    g.setNode('Rasam Rice', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    createEdges('Special Rice Items', ['Pulao North Indian', 'Pongal (Sunday)', 'Bisi Bele Bath (Anna) (Monday)', 'Tomato Rice (Tuesday, Thursday)', 'Veg Pulao South Indian (Wednesday, Saturday)', 'Lemon Rice (Friday)', 'Curd Rice (All 7 days)', 'Plain Rice', 'Sambar Rice', 'Rasam Rice',], { label: 'Special Rice Items' });

    g.setNode('Sweets Items', { submenu: true });
    g.setNode('Special Kheer', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 120 });
    g.setNode('Rava Kesari', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Gulab Jamun', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 60 });
    g.setNode('Mysore Pak (1 Piece)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Jhangiri (2 Pieces)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Mysore Pak (1 Kg)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 500 });
    g.setNode('Jhangiri (1 Kg)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 500 });
    g.setNode('Gajar Ka Halwa (Seasonal)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 120 });
    g.setNode('Gajar Ka Halwa (Per Kg)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 500 });
    createEdges('Sweets Items', ['Special Kheer', 'Rava Kesari', 'Gulab Jamun', 'Mysore Pak (1 Piece)', 'Jhangiri (2 Pieces)', 'Mysore Pak (1 Kg)', 'Jhangiri (1 Kg)', 'Gajar Ka Halwa (Seasonal)', 'Gajar Ka Halwa (Per Kg)',], { label: 'Sweets Items' });

    g.setNode('Chinese Items');
    g.setNode('Veg Chopsuey', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 165 });
    g.setNode('Veg Manchurian Dry', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 195 });
    g.setNode('Veg Sweet & Sour', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 175 });
    g.setNode('Chili Paneer Dry', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 195 });
    g.setNode('Chili Paneer Gravy', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 195 });
    g.setNode('Chili Mushroom Dry', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 195 });
    g.setNode('Chili Mushroom Gravy', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 195 });
    g.setNode('Crispy Potato', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Chili Potato', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Potato Pepper', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Veg Spring Roll', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    g.setNode('Half Veg. Chowmien', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 95 });
    g.setNode('Manchurian (Half)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 130 });
    createEdges('Chinese Items', ['Veg Chopsuey', 'Veg Manchurian Dry', 'Veg Sweet & Sour', 'Chili Paneer Dry', 'Chili Paneer Gravy', 'Chili Mushroom Dry', 'Chili Mushroom Gravy', 'Crispy Potato', 'Chili Potato', 'Potato Pepper', 'Veg Spring Roll', 'Half Veg. Chowmien', 'Manchurian (Half)'], { label: 'Chinese Items' });

    g.setNode('Chinese Soups');
    g.setNode('Cream of Tomato Soup', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 120 });
    g.setNode('Mixed Veg Soup', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 120 });
    g.setNode('Veg Talumein Soup', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 120 });
    g.setNode('Veg Hot & Sour Soup', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 120 });
    g.setNode('Sweet Corn Soup', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 135 });
    createEdges('Chinese Soups', ['Cream of Tomato Soup', 'Mixed Veg Soup', 'Veg Talumein Soup', 'Veg Hot & Sour Soup', 'Sweet Corn Soup',], { label: 'Chinese Soups' });

    g.setNode('Roti and Naan');
    g.setNode('Butter Roti', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 25 });
    g.setNode('Paratha', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Naan (Plain)', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 40 });
    g.setNode('Butter Naan', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Roti', { o: true, mtype: 'e', iType: 'm', a: true, c: true, m: true, qty: 1, price: 20 });
    createEdges('Roti and Naan', ['Butter Roti', 'Paratha', 'Naan (Plain)', 'Butter Naan', 'Roti',], { label: 'Roti and Naan' });

    g.setNode('Beverages');
    g.setNode('Horlicks', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Bournvita', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Nescafe', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Tea', { o: true, mtype: 'd', iType: 'm', a: true, c: false, m: true, qty: 1, price: 30 });
    g.setNode('Filter Coffee', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 50 });
    g.setNode('Mango Panna', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 70 });
    g.setNode('Ginger Lemon Soda', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Masala Soda', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Lemon Soda', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Kokam Soda', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 100 });
    g.setNode('Banana Lassi', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 100 });
    g.setNode('Mango Lassi', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 100 });
    g.setNode('Banana Shake', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Kiwi Shake', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Saffron Shake', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Mix Fruit Shake', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    g.setNode('Dry Fruit Shake', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 180 });
    g.setNode('Mango Shake (only Season)', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    createEdges('Beverages', ['Horlicks', 'Bournvita', 'Nescafe', 'Tea', 'Filter Coffee', 'Mango Panna', 'Ginger Lemon Soda', 'Masala Soda', 'Lemon Soda', 'Kokam Soda', 'Banana Lassi', 'Mango Lassi', 'Banana Shake', 'Kiwi Shake', 'Saffron Shake', 'Mix Fruit Shake', 'Dry Fruit Shake', 'Mango Shake (only Season)',], { label: 'Beverages' });

    g.setNode('Full Meals (South Indian)');

    g.setNode('North Indian Eco Thali');

    g.setNode('Juice Items');
    g.setNode('Anar Juice', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Pineapple Juice', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 130 });
    g.setNode('Watermelon Juice', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 110 });
    g.setNode('Mix Fruit Juice', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 160 });
    g.setNode('Mosambi Juice', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 110 });
    g.setNode('Orange Juice (Only Season)', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 110 });
    g.setNode('Mango Juice (Only Season)', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 110 });
    g.setNode('Grape Juice (Only Season)', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    g.setNode('Strawberry Juice (Only Season)', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 130 });
    g.setNode('Kiwi Juice', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 150 });
    g.setNode('Kokum Juice', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 100 });
    createEdges('Juice Items', ['Anar Juice', 'Pineapple Juice', 'Watermelon Juice', 'Mix Fruit Juice', 'Mosambi Juice', 'Orange Juice (Only Season)', 'Mango Juice (Only Season)', 'Grape Juice (Only Season)', 'Strawberry Juice (Only Season)', 'Kiwi Juice', 'Kokum Juice',], { label: 'Juice Items' });

    g.setNode('Mojito Items');
    g.setNode('Mint Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Pineapple Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Litchi Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Kiwi Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Mongo Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Orange Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    g.setNode('Strawberry Mojito', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 90 });
    createEdges('Mojito Items', ['Mint Mojito', 'Pineapple Mojito', 'Litchi Mojito', 'Kiwi Mojito', 'Mongo Mojito', 'Orange Mojito', 'Strawberry Mojito',], { label: 'Mojito Items' });

    g.setNode('SummerCool Sharbat');
    g.setNode('Kiwi Sharbat', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Strawberry Sharbat', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Litchi Sharbat', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Pineapple Sharbat', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Mango Sharbat', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    g.setNode('Orange Sharbat', { o: true, mtype: 'd', iType: 'm', a: true, c: true, m: true, qty: 1, price: 80 });
    createEdges('SummerCool Sharbat', ['Kiwi Sharbat', 'Strawberry Sharbat', 'Litchi Sharbat', 'Pineapple Sharbat', 'Mango Sharbat', 'Orange Sharbat',], { label: 'SummerCool Sharbat' });

    // Link policies
    linkPolicies(hotel.hotel_id);

    // Create edges from facilities to all the individual facilities
    // Scan thru all the facilities and link only those for which facility is mark as 'yes'
    linkFacilities(hotel.hotel_id);

    // Link the room items
    // FIXME: Each room might have different amenities. Need to have a mapping of rooms to their amenities
    linkRoomItems(hotel.hotel_id);

    // Link menu items
    linkMenuItems(hotel.hotel_id);

    // Create all_items node that has all the items (including facilities, roomitem, menu)
    // This could be a big node
    createAllItemsNode(hotel.hotel_id);
}

function linkPolicies(hotel_id) {
    const nodes = g.nodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = g.node(nodes[i]);
        if (!_.isUndefined(node)) {
            if (!_.isUndefined(node['p']) && _.isEqual(node['p'], true)) {
                // console.log(policies + '->' + name);
                g.setEdge(policies, nodes[i], { label: 'policy' });
            }
        }
    }
}

function linkFacilities(hotel_id) {
    const nodes = g.nodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = g.node(nodes[i]);
        if (!_.isUndefined(node)) {
            if (!_.isUndefined(node['f']) && _.isEqual(node['f'], true)) {
                // console.log(facilities + '->' + name);
                g.setEdge(facilities, nodes[i], { label: 'facility' });
            }
        }
    }
    // nodes.forEach((name) => {
    //     var node = g.node(name);
    //     if (!_.isUndefined(node)) {
    //         if (!_.isUndefined(node['f']) && _.isEqual(node['f'], true)) {
    //             // console.log(facilities + '->' + name);
    //             g.setEdge(facilities, name, { label: 'facility' });
    //         }
    //     }
    // })
}

function linkRoomItems(hotel_id) {
    const nodes = g.nodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = g.node(nodes[i]);
        if (!_.isUndefined(node)) {
            if (!_.isUndefined(node['ri']) && _.isEqual(node['ri'], true)) {
                // console.log(roomitem + '->' + name);
                g.setEdge(roomitem, nodes[i], { label: 'roomitem' });
            }
        }
    }
}

function linkMenuItems(hotel_id) {
    const nodes = g.nodes();
    for (var i = 0; i < nodes.length; i++) {
        var node = g.node(nodes[i]);
        if (!_.isUndefined(node)) {
            if (!_.isUndefined(node['m']) && _.isEqual(node['m'], true)) {
                // console.log('menu' + '->' + name);
                g.setEdge(menuitem, nodes[i], { label: 'menuitem' });
            }
        }
    }
}

/**
 * This is a meta node of all the facilities that enables a quick lookup
 */
function createAllItemsNode(hotel_id) {
    const nodes = g.nodes();
    let allItems = [];
    let node, name, children;
    for (var i = 0; i < nodes.length; i++) {
        name = nodes[i];
        node = g.node(name);

        // If the node is not a parent, then check the attributes of the node, like 'facility', 'menu', 'roomitem' and add it
        // Do not add a node without attribute. It could be a parent node
        if (!_.isUndefined(node)) {
            if (
                (!_.isUndefined(node['f']) && _.isEqual(node['f'], true)) ||
                (!_.isUndefined(node['m']) && _.isEqual(node['m'], true)) ||
                (!_.isUndefined(node['ri']) && _.isEqual(node['ri'], true))
            ) {
                // Add to the list
                allItems.push(name);

                // Add the children of this node, if any
                children = g.children(name);
                //console.log('children=', children);
                allItems = _.concat(allItems, children);
            }
        }
    }
    g.setNode('all_items', allItems);

    //console.dir(g.node('all_items'), { 'maxArrayLength': null });
}

function createEdges(source, targets, label) {
    targets.forEach(t => {
        g.setEdge(source, t, label);
    });
}

/*******************************************************************************************************************************/
/*
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
        //group = await HotelGroupModel.findOneAndUpdate({ name: hotelData.group.name }, hotelData.group, { new: true, upsert: true });
    } catch (error) {
        console.log('error in storing hotel group:', error);
        throw error;
    }
    return group;
}

async function createHotelData(group, hotel_id) {
    let hotel;
    if (!_.isUndefined(hotel_id)) {
        hotelData.hotel.hotel_id = hotel_id;
    }
    hotelData.hotel.group_id = group.group_id;
    const h = new HotelModel(hotelData.hotel);
    console.log('hotel data to save=', hotelData.hotel);

    try {
        hotel = await h.save();
        // hotel = await HotelModel.findOneAndUpdate({ name: hotelData.hotel.name, group_id: group.group_id }, hotelData.hotel, { new: true, upsert: true });
    } catch (error) {
        console.log('error in storing hotel:', error);
        throw error;
    }
    return hotel;
}

async function createRoomsData(hotel) {
    let room = [], r;
    try {
        for (let i = 0; i < hotelData.rooms.length; i++) {
            hotelData.rooms[i].hotel_id = hotel.hotel_id;
            r = new RoomModel(hotelData.rooms[i]);
            room[i] = await r.save();
            // room = await RoomModel.findOneAndUpdate({ hotel_id: hotel.hotel_id, room_no: hotelData.rooms[i].room_no }, hotelData.rooms[i], { new: true, upsert: true });
        }
    } catch (error) {
        console.log('error in storing hotel:', error);
        throw error;
    }
    return room;
}

async function createData(hotel_id) {
    let hotel;
    try {
        let group = await createHotelGroup();
        console.log('created group=', group);
        hotel = await createHotelData(group, hotel_id);
        console.log('created hotel=', hotel);
        let rooms = await createRoomsData(hotel);
        console.log('created rooms=', rooms);
    } catch (error) {
        throw error;
    }
    return hotel;
}

*/

module.exports.addOrUpdate = async (hotel_id, genFile = true) => {
    createGraph(hotel_id);
    // console.log('nodes=', g.nodeCount());

    const json = graphlib.json.write(g);
    let data;
    try {
        // Save the graph to the database
        data = await GraphModel.findOneAndUpdate({ value: hotel_id }, json, { new: true, upsert: true });
    } catch (error) {
        console.log('error in storing graph:', error);
        throw error;
    }

    // console.log(JSON.stringify(json));
    return json;
}

// Store this JSON to Graph collection
module.exports.create = function (hotel, hotel_name, genFile = false) {
    createGraph(hotel);
    // Create the json representation of the graph
    const json = graphlib.json.write(g);
    return json;
}

// require('./graph').create();
//require('./graph').addOrUpdate("1");
