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
const menu = 'menu';

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
 * eatable(e): true/false = its an eatable
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
 *          
 * Meta Nodes
 * 'all_items': Holds all the items that can be searched
 * 'facilities': all facilities
 * 'menu': all menu items
 * 'roomitem': all room items (like AC, TV, fridge, napkins)
 */
function createGraph(hotel_id, hotel_name) {
    if (_.isUndefined(hotel_id) || _.isUndefined(hotel_name)) {
        throw new Error('invalid hotel_id or hotel_name:', hotel_id, hotel_name);
    }

    // Create hotel & its nodes
    g.setNode(hotel_id, hotel_name);
    g.setNode('main_facilities', ['restaurant', 'gym', 'swimming pool', 'breakfast', 'laundry']);

    // Hotel points to the following nodes
    // hotel_id->main_facilities, hotel_id->facilities, hotel_id->policies
    g.setEdge(hotel_id, 'main_facilities', { label: 'main_facilities' });
    g.setEdge(hotel_id, facilities, { label: 'facilities' });
    g.setEdge(hotel_id, policies, { label: 'policies' });
    g.setEdge(hotel_id, menu, { label: 'menu' });

    // Create policies nodes
    g.setNode('smoking', { p: true, msg: 'smoking is allowed in <%= areas %>', areas: ['lobby', 'smoking room'] });
    g.setParent('smoke', 'smoking');
    g.setParent('cigar', 'smoking');
    g.setParent('cigerette', 'smoking');
    g.setParent('beedi', 'smoking');
    g.setParent('vape', 'smoking');
    g.setParent('vaping', 'smoking');
    g.setParent('electronic', 'smoking');
    g.setParent('cigar', 'smoking');
    g.setParent('hookah', 'smoking');

    g.setNode('alcohol', { p: true, msg: 'alcohol consumption is allowed in <%= areas %>', areas: ['bar', 'room'] });
    g.setParent('rum', 'alcohol');
    g.setParent('gin', 'alcohol');
    g.setParent('whiskey', 'alcohol');
    g.setParent('brandy', 'alcohol');
    g.setParent('vodka', 'alcohol');
    g.setParent('beer', 'alcohol');
    g.setParent('draft beer', 'alcohol');
    g.setParent('cognac', 'alcohol');

    g.setNode('cancellation', { p: true, synonyms: ['room cancellation'], msg: 'The room cancellation policy is mentioned in your booking details. Please contact hotel reception for any information about this' });
    g.setNode('infants', { p: true, synonyms: ['children policy', 'infants stay'], age: 5, msg: 'There are no charges for infants below the age of <%= age %> years and are welcome to stay. ' });
    g.setNode('checkout time', { p: true, synonyms: ['vacate time', 'vacating'], time: '1200', msg: 'The checkout time for the room is <%= time %>. Please contact reception at <%= reception_no %> if you want to extend your stay beyond checkout time.' });
    g.setNode('no show', { p: true, synonyms: [], msg: 'In case of no show the first nights room rent would be charged. The rest of the booking amount would be refunded to your account.' });
    g.setNode('outside food', { p: true, synonyms: ['food from outside'], msg: 'We do not allow outside food to be brought into the hotel' });
    g.setNode('checkin time', { p: true, synonyms: [], time: '1200', msg: 'The check in time for this hotel is <%= checkin_time %>' });
    g.setNode('pets', { p: true, synonyms: ['dog', 'cat', 'my pet'], msg: 'Usually pets are not allowed in this hotel. Please check with the front desk on the kind of pets you can bring to this hotel' });
    g.setNode('payment methods', { p: true, 'synonyms': ['credit card', 'debit card', 'cash', 'bank transfer', 'wire transfer'], msg: 'We accept payment by PayTM, Credit card, debit card, cash' });

    // Set the edges
    createEdges(policies, ['smoking', 'alcohol', 'cancellation', 'infants', 'checkout time', 'no show', 'outside food', 'checkin time', 'pets', 'payment methods'], { label: 'policy' });

    // Create facilities
    g.setNode('gym', { f: true, a: true, o: true, msg: { yes: 'There is one fitness center available on the 4th floor next to the cafe', no: 'There is no gym in this hotel' } });
    g.setParent('fitness center', 'gym');   // synonyms of the facility are set as children
    g.setParent('workout place', 'gym');
    g.setNode('gym_location', { msg: 'Next to cafe on the 4th floor' });
    g.setNode('gym_timings', { msg: 'The gym is open from <%=from> to <%=to>', time: { from: '0500', to: '1200' } });
    g.setNode('gym_price', { msg: 'The gym is free of price to use for our guests', price: '200' });
    g.setNode('gym_reserve', { flag: true, msg: { yes: 'Call up the frontdesk to make a reservation', no: 'No reservation is required. You can walk-in to the gym' } });
    createEdges('gym', ['gym_location', 'gym_timings', 'gym_price', 'gym_reserve', { label: 'gym' }]);

    g.setNode('kids_pool', { f: true, a: true, o: true, msg: { yes: 'There is a childrens pool available', no: 'There is no childrens pool in this hotel' } });
    g.setParent('children pool', 'kids_pool');
    g.setParent('kids pool', 'kids_pool');
    g.setParent('children swimming pool', 'kids_pool');
    g.setParent('kids swimming pool', 'kids_pool');
    g.setNode('kids_pool_location', { msg: 'Sky pool on the top floor. You can take the lift to reach the floor' });
    g.setNode('kids_pool_timings', { msg: 'The childrens pool is open from morning <%= from %> to <%= to %> and again in the evening 0600 to 2200', 'time': { 'from': '0500', 'to': '1200' } });
    g.setNode('kids_pool_reserve', { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } });
    g.setNode('kids_pool_price', { 'price': '200', flag: true, msg: { yes: 'There is a charge of <%= price %> for using the childrens pool', no: 'The childrens pool is free to use for all the guests' } });
    createEdges('kids_pool', ['kids_pool_location', 'kids_pool_timings', 'kids_pool_reserve', 'kids_pool_price'], { label: 'kids_pool' });

    g.setNode('adults_pool', { f: true, a: true, o: true, msg: { yes: 'There is an adults pool available', no: 'There is no swimming pool in this hotel' } });
    g.setParent('adults pool', 'adults_pool');
    g.setParent('big swimming pool', 'adults_pool');
    g.setNode('adults_pool_location', { msg: 'Sky pool on the top floor. You can take the lift to reach the floor' });
    g.setNode('adults_pool_timings', { msg: 'The adults pool is open from morning <%= from %> to <%= to %> and again in the evening 0600 to 2200', 'time': { 'from': '0500', 'to': '1200' } });
    g.setNode('adults_pool_reserve', { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } });
    g.setNode('adults_pool_price', { 'price': '200', flag: true, msg: { yes: 'There is a charge of <%= price %> for using the pool', no: 'The pool is free to use for all the guests' } });
    createEdges('adults_pool', ['adults_pool_location', 'adults_pool_timings', 'adults_pool_reserve', 'adults_pool_price'], { label: 'adults_pool' });

    g.setNode('sauna', { f: true, a: true, o: true, msg: { yes: 'There is a sauna available', no: 'There is no sauna in this hotel' } });
    g.setParent('steam room', 'sauna');
    g.setParent('steam bath', 'sauna');
    g.setNode('sauna_location', { msg: 'Sauna is located on the ground floor' });
    g.setNode('sauna_timings', { msg: 'The sauna is open from morning <%= from %> to <%= to %> and again in the evening 0600 to 2200', 'time': { 'from': '0500', 'to': '1200' } });
    g.setNode('sauna_reserve', { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } });
    g.setNode('sauna_price', { 'price': '200', flag: true, msg: { yes: 'There is a charge of <%= price %> for using the sauna', no: 'The sauna is free to use for all the guests' } });
    createEdges('sauna', ['sauna_location', 'sauna_timings', 'sauna_reserve', 'sauna_price'], { label: 'sauna' });

    g.setNode('laundry', { f: true, a: true, o: true, msg: { yes: 'We offer laundry service', no: 'We do not have laundry service' } });
    g.setParent('clothes wash', 'laundry');
    g.setParent('washing', 'laundry');
    g.setNode('laundry_location', { msg: 'Please leave the clothes to be washed in the bag in the closet. We will pick them up for washing' });
    g.setNode('laundry_timings', { msg: 'We will deliver the washed and ironed clothes in ', 'time': { 'from': '0500', 'to': '1200' } });
    g.setNode('laundry_reserve', { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } });
    g.setNode('laundry_price', { 'price': '200', flag: true, msg: { yes: 'There are separate charges for different clothes. You can check the charges in the closet', no: 'The sauna is free to use for all the guests' } });
    createEdges('laundry', ['laundry_location', 'laundry_timings', 'laundry_reserve', 'laundry_price'], { label: 'laundry' });

    g.setNode('ironing', { f: true, a: true, o: true, msg: { yes: 'We have an iron box in the room. You can find it in the closet', no: 'We do not have clothes ironing facility' } });
    g.setParent('clothes iron', 'ironing');
    g.setNode('ironing_location', { msg: 'Please leave the clothes to be washed in the bag in the closet. We will pick them up for washing' });
    g.setNode('ironing_timings', { msg: 'You can place an order to iron your clothes anytime ', 'time': { 'from': '0500', 'to': '1200' } });
    g.setNode('ironing_reserve', { flag: true, msg: { yes: 'You can place an order for ironing clothes', no: 'You can do the ironing yourself' } });
    g.setNode('ironing_price', { 'price': '200', flag: true, msg: { yes: 'There is a charge of Rs.5 per piece', no: 'Ironing is free of price' } });
    createEdges('ironing', ['ironing_location', 'ironing_timings', 'ironing_reserve', 'ironing_price'], { label: 'ironing' });

    g.setNode('taxi', { f: true, a: true, o: true, msg: { yes: 'We have taxi service with the hotel', no: 'We do not provide taxi service. But Uber, Ola do reach our hotel' } });
    g.setParent('cab', 'taxi');
    g.setParent('car hire', 'taxi');    //FIXME: Complete the flow of taxi booking
    g.setNode('taxi_location', { msg: 'The taxi will be available right in front of the hotel' });
    g.setNode('taxi_timings', { msg: 'The taxi is avilable round the clock ', 'time': { 'from': '0500', 'to': '1200' } });
    g.setNode('taxi_reserve', { flag: true, msg: { yes: 'I can place an order to book a taxi', no: 'I cannot make a taxi booking. You will have to use the taxi apps like Ola or Uber to book one' } });
    g.setNode('taxi_price', { 'price': '200', flag: true, msg: { yes: 'You will be charged an amount of 5000 for a full day', no: 'The taxi charges are included in your bill' } });
    g.setNode('taxi_billing', { flag: true, msg: { yes: 'The taxi charges are included in your bill', no: 'You have to pay the driver yourself' } });
    createEdges('taxi', ['taxi_reserve', 'taxi_price', 'taxi_billing'], { label: 'taxi' });

    g.setNode('shuttle', { f: true, 'present': 'no', o: true, msg: { yes: 'We have a shuttle service', no: 'We do not provide a shuttle service' } });
    g.setNode('shuttle_reserve', { flag: true, msg: { yes: 'I can place an order to book a taxi', no: 'I cannot make a taxi booking. You will have to use the taxi apps like Ola or Uber to book one' } });
    g.setNode('shuttle_timings', { flag: true, msg: { yes: 'The shuttle service is available from morning 0800 to evening 1800hrs at a gap of 30 minutes. You will need to wait at the reception to board a shuttle ', no: 'There is no specific timing for the shuttle. Please check with the reception for the specific timing' } });
    g.setNode('shuttle_price', { 'price': '200', flag: true, msg: { yes: 'There is a charge of <%=price> for using the shuttle', no: 'The shuttle service is provided on a complementary basis by the hotel' } });
    g.setNode('shuttle_billing', { flag: true, msg: { yes: 'You do not have to pay for the shuttle', no: 'You will have to pay the driver diretly' } });
    createEdges('shuttle', ['shuttle_reserve', 'shuttle_timing', 'shuttle_price', 'shuttle_billing'], { label: 'shuttle' });

    g.setNode('wifi', { f: true, a: true, o: true, msg: { yes: 'We have wifi facility. Please contact frontdesk for the details', no: 'We do not have wifi facility' } });
    g.setParent('internet', 'wifi');
    g.setParent('data connection', 'wifi');
    g.setParent('wireless network', 'wifi');
    g.setParent('wireless', 'wifi');
    g.setNode('wifi_location', { msg: 'Wifi is available everywhere' });
    g.setNode('wifi_timings', { flag: true, msg: { yes: 'The wifi is available round the clock', no: 'The wifi is not available during nights from 2300hrs to 0500hrs' } });
    g.setNode('wifi_price', { 'price': '200', flag: true, msg: { yes: 'There is a charge of <%=price> for the wifi', no: 'Wifi is free of charge for our guests' } });
    g.setNode('wifi_billing', { flag: true, msg: { yes: 'Wifi charges will be added to your bill', no: 'You will have to pay for your wifi charges separately' } });
    g.setNode('wifi_password', { flag: true, msg: { yes: 'The frontdesk will provide the wifi password', no: 'There is no wifi password' } });
    createEdges('wifi', ['wifi_location', 'wifi_price', 'wifi_billing'], { label: 'wifi' });

    g.setNode('parking', { f: true, a: true, o: true, msg: { yes: 'We have a parking facility for cars or two-wheelers at the basement', no: 'There is parking facility available' } });
    //TODO: Create parking nodes

    g.setNode('massage', { f: true, a: true, o: true, msg: { yes: 'We have a masseur in the hotel', no: 'We do not have massage facility in the hotel' } });
    //TODO: Set the rest of the nodes for 'massage'

    g.setNode('car cleaning', { f: true, a: true, o: true, msg: { yes: 'We can help you get your vehicle cleaned', no: 'We do not have vehicle cleaning service' } });
    //TODO: Complete rest of the nodes

    g.setNode('car rent', { f: true, a: true, o: true, msg: { yes: 'We offer car rental service. Please check the front desk for more details', no: 'We do not have car rental service. But please check with front desk and we will help you out' } });
    //TODO: Complete rest of the nodes

    g.setNode('bicycle', { f: true, a: true, o: true, c: true, msg: { yes: 'We have bicycle rental service.', no: 'We do not have bicycle rental service' } });
    //TODO: Complete rest of the nodes

    g.setNode('bike', { f: true, a: true, o: true, c: true, msg: { yes: 'We have motor bike rental service.', no: 'We do not have motor bbike rental service' } });
    //TODO: Complete rest of the nodes

    g.setNode('bar', { f: true, a: true, o: true, msg: { yes: 'We have a bar near the restaurant.', no: 'We do not have a bar' } });
    //TODO: Complete rest of the nodes

    g.setNode('sight seeing', { f: true, a: true, o: true, msg: { yes: 'We provide sight seeing facilities with our customized packages.', no: 'We do not have tourist package facilities' } });
    //TODO: Complete rest of the nodes

    g.setNode('pub', { f: true, a: true, o: true, msg: { yes: 'We have a pub  near the restaurant.', no: 'We do not have a pub at our restaurant' } });
    //TODO: Complete rest of the nodes

    g.setNode('conference rooms', { f: true, a: true, o: true, msg: { yes: 'We have 2 conference rooms in our hotel', no: 'We do not have conference rooms' } });
    //TODO: Complete rest of the nodes

    g.setNode('business lounge', { f: true, a: true, o: true, msg: { yes: 'We have 2 business lounges in our hotel', no: 'We do not have business lounges' } });
    //TODO: Complete rest of the nodes

    g.setNode('reception', { f: true, a: true, o: false, msg: { yes: 'The hotel reception is located near the entrance', no: 'I am your receptionist. Please let me know what you want' } });
    g.setParent('front desk', 'reception');
    g.setNode('reception_timings', { time: { from: '0000', to: '0000' }, msg: 'The reception is open 27 by 7' });
    g.setNode('reception_languages', { msg: 'The reception speaks english, hindi, telugu, tamil, malayalam, kannada' });
    createEdges('reception', ['reception_timings', 'reception_languages', { label: 'reception' }]);

    g.setNode('spa', { f: true, a: true, o: true, msg: { yes: 'There is a sauna available', no: 'There is no sauna in this hotel' } });
    g.setParent('spa', 'body treatment');
    g.setParent('spa', 'facials');
    g.setNode('spa_location', { msg: 'The spa is located on the outer corridor' });
    g.setNode('spa_timings', { msg: 'Spa is available from <%= from %> to <%= to %> and again in the evening 0600 to 2200', 'time': { 'from': '0500', 'to': '1200' } });
    g.setNode('spa_reserve', { flag: true, msg: { yes: 'You will need to register with the front desk to book a slot', no: 'There is no registration required' } });   //FIXME: Enable booking of facility
    g.setNode('spa_price', { 'price': '200', flag: true, msg: { yes: 'The price of the spa varies. Please contact the spa for the details', no: 'The spa is free to use for all the guests' } });
    g.setNode('spa_billing', { msg: 'You will have to pay separately at the spa. The charges will not be made part of bill' });
    createEdges('spa', ['spa_location', 'spa_timings', 'spa_reserve', 'spa_price', 'spa_billing'], { label: 'spa' });  //FIXME: Spa needs more work

    g.setNode('room_service', { f: true, a: true, o: true, msg: { yes: 'Room service is available', no: 'There is no room service' } });
    g.setParent('room delivery', 'room_service');
    g.setNode('room_service_price', { price: 50, msg: 'You are charged an amount of <%= price %> for room service' });
    g.setNode('room_service_time', { time: '30 minutes', msg: 'It takes approximately <%=time %> for ordering food to room service' });
    g.setNode('room_service_process', { msg: 'You can tell me what to order' });
    g.setNode('room_service_billing', { msg: 'The charges would be added to your room bill, that you can pay at checkout time' });
    createEdges('room_service', ['room_service_price', 'room_service_time', 'room_service_process', 'room_service_billing'], { label: 'room_service' });

    g.setNode('cooking', { f: true, p: false, o: true, msg: { yes: 'This hotel can provide cooking facilities. Let me know what you want', no: 'This hotel does not have cooking facilities' } }); // FIXME: Complete the flow of the user asking for the facilities
    g.setParent('cooking facilities', 'cooking');
    g.setParent('cooking utilities', 'cooking');

    g.setNode('storage', { f: true, a: true, o: true, msg: { yes: 'We do have a storage space near the reception. Please carry your baggage to the reception for storage', no: 'we do not have storage space' } });
    g.setParent('luggage', 'storage');
    g.setParent('cloak room', 'storage');
    g.setParent('storage space', 'storage');
    g.setNode('storage_price', { price: 50, flag: true, msg: { yes: 'We charge a price of <%=price> for 1 day of storage', no: 'You can store your luggage free of charge' } });
    g.setNode('storage_size', { msg: 'We can store a maximum of 2 bags. But please visit the reception for clarification' });

    g.setNode('restaurant', { f: true, a: true, o: true, msg: { yes: 'There is an inhouse restaurant in this hotel', no: 'There is no reservation in this hotel' } });
    g.setParent('eat out', 'restaurant');
    g.setParent('hotel food', 'restaurant');
    g.setParent('dining area', 'restaurant');
    g.setNode('restaurant_timings', { 'time': { 'from': '0600', 'to': '2300' }, msg: 'the restaurant is open from morning 0600 to 1100 and again in the evening 0600 to 2200' }); //FIXME: How to represent fifferent time slots
    g.setNode('restaurant_location', { msg: 'the restaurant located on the groud floor' });
    g.setNode('restaurant_reserve', { flag: true, msg: { yes: 'You will need to book a table for the restaurant', no: 'You can walk-in. There is no registration required' } }); // FIXME: Flow for a user to book a table
    g.setNode('restaurant_take_away', { flag: true, msg: { yes: 'Takeway of food is possible. Ask at the reservation', no: 'Takeway of food is not possible. Ask for options at restaurant' } });
    g.setNode('restaurant_count', { msg: 'We have a total of 2 restaurants' });
    createEdges('restaurant', ['restaurant_timings', 'restaurant_location', 'restaurant_reserve', 'restaurant_take_away'], { label: 'restaurant' });

    g.setNode('breakfast', { f: true, a: true, o: true, msg: { yes: 'This restaurant serves breakfast', no: 'There is no breakfast facility in this hotel' } });
    g.setParent('tiffin', 'breakfast');
    g.setParent('morning food', 'breakfast');
    g.setNode('breakfast_timing', { time: { from: '0700', to: '1000' }, msg: 'Breakfast is served from 0700 to 0900 during weekdays and from 0700 to 1000 on saturdays and sundays' });
    g.setNode('breakfast_location', { msg: 'Breakfast is served in the restaurant on the groud floor' });
    g.setNode('breakfast_room_service', { msg: 'Breakfast can be served in the room. Would you like me to order?' });
    g.setNode('breakfast_price', { price: 200, flag: true, msg: { yes: 'There is a charge of <%=price> for the breakfast', no: 'Breakfast is free of charge if its part of your booking' } });
    g.setNode('breakfast_content', { msg: 'We serve South Indian, continental buffet breakfast' });
    g.setNode('breakfast_takeaway', { flag: true, msg: { yes: 'Ask the staff to pack a quantity of food for You', no: 'There is no takeaway facility' } });
    g.setNode('breakfast_billing', { msg: 'Breakfast price is added to your room bill' });
    createEdges('breakfast', ['breakfast_timing', 'breakfast_location', 'breakfast_room_service', 'breakfast_price', 'breakfast_content', 'breakfast_takeaway', 'breakfast_billing'], { label: 'breakfast' });

    // Kitchen items
    g.setNode('bottle_steralizer', { f: true, a: true, o: true, msg: { yes: 'Bottle sterilization possible. Please visit the kitchen to get it done', no: 'Bottle sterilization not possilbe' } });
    g.setNode('microwave', { f: true, a: true, msg: { yes: 'We have a microwave in the common floor downstairs', no: 'We do not have a microwave' } });
    g.setNode('oven', { f: true, a: true, msg: { yes: 'We have a oven in this hotel. You can use it downstairs', no: 'We do not have an oven' } });
    g.setNode('cutlery', { f: true, o: true, a: true, msg: { yes: 'We have some cutlery with the hotel. Check with the kitchen for the same', no: 'We do not supply cutlery' } }); //FIXME: Complete the flow of ordering cutlery
    g.setNode('salt', { o: true, a: true, m: true, msg: { yes: 'We can provide you salt. Do you want some?', no: 'We do not provide salt' } });
    g.setNode('sugar', { o: true, a: true, m: true, msg: { yes: 'We do have sugar at our hotel', no: 'We do not provide sugar' } });
    g.setNode('oil', { o: true, p: false, m: true, msg: { yes: 'We can provide you oil. Do you want some?', no: 'We do not provide oil' } });   //FIXME: Complete the order cycle
    g.setNode('tissues', { o: true, a: true, price: '0', msg: { yes: 'We have tissues at our hotel', no: 'We do not have tissues to order' } });
    g.setParent('paper napkins', 'tissues');
    g.setParent('paper napkin', 'tissues');
    g.setParent('wipes', 'tissues');

    // Room items
    g.setNode('dustbin', { a: true, o: true, ri: true, msg: { yes: 'A dustbin is provided in your room', no: 'We do not have dustbins in  the room' } });
    g.setParent('dust basket', 'dustbin');
    g.setParent('garbage can', 'dustbin');
    g.setParent('waste basket', 'dustbin');
    g.setNode('hanger', { a: true, o: true, ri: true, c: true, msg: { yes: 'Hangers are provided in the closet in your room', no: 'We do not provide hangers' } });
    g.setParent('clothe hangers', 'hanger');
    g.setNode('clock', { p: false, o: true, ri: true, msg: { yes: 'There is a table clock in your room', no: 'We do not have a clock. You can ask Alexa for the time instead' } });
    g.setParent('watch', 'clock');
    g.setNode('towel', { p: false, o: true, ri: true, c: true, msg: { yes: 'There are towels provided in the room', no: 'We do not provide towels. You need to get your own' } });
    g.setParent('bath towel', 'towel');
    g.setNode('napkin', { p: false, o: true, ri: true, c: true, msg: { yes: 'There are napkins provided in your room', no: 'We do not provide napkins' } });
    g.setParent('hand napkin', 'napkin');
    g.setNode('soap', { p: false, o: true, ri: true, c: true, msg: { yes: 'There is a soap in your bathroom', no: 'We do not provide a soap. You will need to get your own' } });
    g.setParent('bath soap', 'soap');
    g.setParent('bath cream', 'soap');
    g.setParent('shower cream', 'soap');
    g.setNode('shampoo', { p: false, o: true, ri: true, msg: { yes: 'There is liquid shampoo in you bathroom', no: 'We do not provide any shampoo' } });
    g.setParent('hair liquid', 'shampoo');
    g.setNode('comb', { p: false, o: true, ri: true, c: true, msg: { yes: 'There is a comb provided in your bathroom', no: 'We do not provide a comb' } });
    g.setParent('hair comb', 'comb');
    g.setNode('fridge', { p: false, o: true, ri: true, msg: { yes: 'There is a fridge in your room', no: 'We do not provide a fridge' } });
    g.setParent('refrigerator', 'fridge');
    g.setNode('ac', { p: false, o: true, ri: true, msg: { yes: 'There is an AC in your room', no: 'We do not provide an AC' } }); // FIXME: AC is per room and not across the hotel. This needs to be linked to a room number
    g.setParent('air conditioner', 'ac');
    g.setParent('air cooler', 'ac');
    g.setNode('iron box', { p: false, o: true, ri: true, msg: { yes: 'There is an iron box in your room', no: 'We do not provide an iron box' } });
    g.setParent('iron machine', 'iron box');
    g.setNode('bar', { p: false, o: true, ri: true, msg: { yes: 'There is a mini bar in your fridge. The items are chargeable', no: 'We do not have a mini bar' } });
    g.setParent('mini bar', 'bar');
    g.setNode('coffee machine', { p: false, o: true, ri: true, msg: { yes: 'There is a coffee machine in your room ', no: 'We do not have a coffee machine' } });
    g.setParent('coffee brew', 'coffee machine');
    g.setParent('expresso machine', 'coffee machine');
    g.setNode('tea machine', { p: false, o: true, ri: true, msg: { yes: 'There is a tea machine in your room ', no: 'We do not have a tea machine' } });
    g.setNode('dish washer', { p: false, o: true, ri: true, msg: { yes: 'There is a dish washer in your room ', no: 'We do not have a dish washer' } });
    g.setNode('fan', { p: false, o: true, ri: true, msg: { yes: 'There is a fan in your room ', no: 'We do not have a fan in the room' } });
    g.setNode('water', { p: false, o: true, ri: true, c: true, price: 20, msg: { yes: 'We provide two water bottles daily', no: 'We do not have water' } });
    g.setParent('water bottle', 'water');
    g.setParent('bottle of water', 'water');

    // Menu items
    g.setNode('menu', { f: true, a: true, msg: {yes: 'There is a menu in the room', no: 'We do not have a menu in the room. Call the front desk' }});
    g.setNode('cuisines', { f: true, a: true, o: true, msg: { yes: 'We serve <%=cuisines %> ' } });
    g.setParent('menu options', 'cuisines');
    g.setParent('menu types', 'cuisines');
    g.setParent('food types', 'cuisines');
    g.setEdge('restaurant', 'cuisines', { label: 'restaurant' });
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
    createEdges('cuisines', ['South Indian', 'North Indian', 'Thai', 'Kerala', 'Andhra', 'Krnataka', 'Chinese', 'Odiya', 'Jain', 'Marathi', 'Gujarathi', 'Tamil', 'Continental'], { label: 'cuisines' });

    g.setNode('Desserts', { submenu: true });
    g.setNode('Guru Prasad Special Kulfi Falooda', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: 'With badam, pista kesar', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Fruit Salad Ice cream', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Chocolate Cup', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹75' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Kesar Pista Cup', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Butterscotch Cup', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mango Cup', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Vanilla Cup', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹40' }], contents: 'Ice cream served in our cup', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Strawberry Cup', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹50' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Guru Prasad Udupi Spl. Ice Cream', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹200' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Garber Ice Cream', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Banana Spl. Ice Cream', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Hot Chocolate Fudge', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Orange Stunt', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹170' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mix Furit punch', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Icecream Falooda', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Gulab Jamun & Vanilla Ice-cream', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: 'With chocolate sauce', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Desserts', ['Guru Prasad Special Kulfi Falooda', 'Fruit Salad Ice cream', 'Chocolate Cup', 'Kesar Pista Cup', 'Butterscotch Cup', 'Mango Cup', 'Vanilla Cup', 'Strawberry Cup', 'Guru Prasad Udupi Spl. Ice Cream', 'Garber Ice Cream', 'Banana Spl. Ice Cream', 'Hot Chocolate Fudge', 'Orange Stunt', 'Mix Furit punch', 'Icecream Falooda', 'Gulab Jamun & Vanilla Ice-cream',], { label: 'Desserts' });

    g.setNode('Light Eats', { submenu: true });
    g.setNode('Rice Idli Sambar & Chutney', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹105' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Vada with Sambar Chutney', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹115' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Idli (1 Piece) + Vada (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rava Idli with Korma', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '11.00 am to 10.30 pm', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Dahi Vada', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹140' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Upma', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Idli (2 Pieces) + Vada (1 Pieces)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹155' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Upma & Rava Kesari', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹200' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rasam Vada with Papad', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹140' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rasam Idli with Papad', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹135' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rasam with Papad', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹105' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Poori with 2 Veg/Raita', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹143' }], contents: '12.00 pm to 3.30 pm - 7.00 pm to 11.00 pm', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Sambar', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹60' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Dahi Idli', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹143' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('undefined', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '0' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Upma & Vada (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹172' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rasam Idli (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹85' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rasam Vada (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹95' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rava Idli (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹75' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Dahi Vada (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹75' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Idli (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹60' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Vada (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Papad (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹20' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Poori (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹10' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Light Eats', ['Rice Idli Sambar & Chutney', 'Vada with Sambar Chutney', 'Idli (1 Piece) + Vada (1 Piece)', 'Rava Idli with Korma', 'Dahi Vada', 'Upma', 'Idli (2 Pieces) + Vada (1 Pieces)', 'Upma & Rava Kesari', 'Rasam Vada with Papad', 'Rasam Idli with Papad', 'Rasam with Papad', 'Poori with 2 Veg/Raita', 'Sambar', 'Dahi Idli', 'undefined', 'Upma & Vada (1 Piece)', 'Rasam Idli (1 Piece)', 'Rasam Vada (1 Piece)', 'Rava Idli (1 Piece)', 'Dahi Vada (1 Piece)', 'Idli (1 Piece)', 'Vada (1 Piece)', 'Papad (1 Piece)', 'Poori (1 Piece)',], { label: 'Light Eats' });

    g.setNode('Soft Drinks', { submenu: true });
    g.setNode('Ice Tea', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹50' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Virgin Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Badam Milk', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Milk Shake', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Milk Shake with Strawberry', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Milk Shake Butter Scotch', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Milk Shake with Chocolate', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Milk Shake with Mango', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: 'Only seasonal', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Cold Coffee', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹140' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Cold Coffee with Ice Cream', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Sweet Lassi', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹60' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Salt Lassi', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹50' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Soft Drink', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹40' }], contents: '300 ml', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Butter Milk', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹40' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Lemon Water', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹30' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mineral Water', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹40' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Soft Drinks', ['Ice Tea', 'Virgin Mojito', 'Badam Milk', 'Milk Shake', 'Milk Shake with Strawberry', 'Milk Shake Butter Scotch', 'Milk Shake with Chocolate', 'Milk Shake with Mango', 'Cold Coffee', 'Cold Coffee with Ice Cream', 'Sweet Lassi', 'Salt Lassi', 'Soft Drink', 'Butter Milk', 'Lemon Water', 'Mineral Water',], { label: 'Soft Drinks' });

    g.setNode('Special Rice Items', { submenu: true });
    g.setNode('Pulao North Indian', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '(12.00 pm to 3.30 pm - 7.00 pm to 11 pm) With 1 cup raita & dal makhani', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Pongal (Sunday)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹125' }], contents: '(Sunday)', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Bisi Bele Bath (Anna) (Monday)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹125' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Tomato Rice (Tuesday, Thursday)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹125' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Veg Pulao South Indian (Wednesday, Saturday)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹125' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Lemon Rice (Friday)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹125' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Curd Rice (All 7 days)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹125' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Plain Rice', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹60' }], contents: '(1 Bowl)', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Sambar Rice', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '(12.00 pm to 3.30 pm - 7.00 pm to 11.00 pm) With 1 Piece Papad & Pickle', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rasam Rice', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '(12 Pm to 3:30 pm & 7 pm to 11 pm)', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Special Rice Items', ['Pulao North Indian', 'Pongal (Sunday)', 'Bisi Bele Bath (Anna) (Monday)', 'Tomato Rice (Tuesday, Thursday)', 'Veg Pulao South Indian (Wednesday, Saturday)', 'Lemon Rice (Friday)', 'Curd Rice (All 7 days)', 'Plain Rice', 'Sambar Rice', 'Rasam Rice',], { label: 'Special Rice Items' });

    g.setNode('Sweets Items', { submenu: true });
    g.setNode('Special Kheer', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '(7 pm to 10.30 pm)', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rava Kesari', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Gulab Jamun', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹60' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mysore Pak (1 Piece)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹40' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Jhangiri (2 Pieces)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹40' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mysore Pak (1 Kg)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹500' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Jhangiri (1 Kg)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹500' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Gajar Ka Halwa (Seasonal)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Gajar Ka Halwa (Per Kg)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹500' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Sweets Items', ['Special Kheer', 'Rava Kesari', 'Gulab Jamun', 'Mysore Pak (1 Piece)', 'Jhangiri (2 Pieces)', 'Mysore Pak (1 Kg)', 'Jhangiri (1 Kg)', 'Gajar Ka Halwa (Seasonal)', 'Gajar Ka Halwa (Per Kg)',], { label: 'Sweets Items' });

    g.setNode('Chinese Items');
    g.setNode('Veg Chopsuey', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹165' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Veg Manchurian Dry', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹195' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Veg Sweet & Sour', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹175' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Chili Paneer Dry', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹195' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Chili Paneer Gravy', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹195' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Chili Mushroom Dry', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹195' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Chili Mushroom Gravy', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹195' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Crispy Potato', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Chili Potato', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Potato Pepper', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Veg Spring Roll', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Half Veg. Chowmien', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹95' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Manchurian (Half)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Chinese Items', ['undefined', 'undefined', 'undefined', 'undefined', 'Veg Chopsuey', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'Veg Manchurian Dry', 'Veg Sweet & Sour', 'Chili Paneer Dry', 'Chili Paneer Gravy', 'Chili Mushroom Dry', 'Chili Mushroom Gravy', 'Crispy Potato', 'Chili Potato', 'Potato Pepper', 'Veg Spring Roll', 'Half Veg. Chowmien', 'Manchurian (Half)',], { label: 'Chinese Items' });

    g.setNode('Dosas');
    g.setNode('Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Sada Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹100' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Butter Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹140' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Butter Sada Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Paneer Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹165' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mysore Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mysore Paneer Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mysore Sada Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹135' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹145' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Sada Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Butter Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹165' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Paper Plain Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Paper Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹210' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Special Paper Paneer Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹290' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Special Family Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹980' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Family Paneer Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹1150' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Vada (1 Piece) with Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹55' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Dosas', ['Masala Dosa', 'Sada Dosa', 'Butter Masala Dosa', 'Butter Sada Dosa', 'Paneer Masala Dosa', 'Mysore Masala Dosa', 'Mysore Paneer Dosa', 'Mysore Sada Dosa', 'Onion Masala Dosa', 'Onion Sada Dosa', 'Onion Butter Masala Dosa', 'Paper Plain Dosa', 'Paper Masala Dosa', 'Special Paper Paneer Dosa', 'Special Family Masala Dosa', 'Family Paneer Masala Dosa', 'Vada (1 Piece) with Dosa',], { label: 'Dosas' });

    g.setNode('Rava Dosas');
    g.setNode('Rava Paneer Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹165' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rava Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹135' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Rava Sada Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Coconut Rava Paneer Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹200' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Coconut Rava Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Coconut Rava Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Rava Paneer Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹190' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Rava Masala Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Rava Dosa', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Rava Dosas', ['Rava Paneer Dosa', 'Rava Masala Dosa', 'Rava Sada Dosa', 'Coconut Rava Paneer Dosa', 'Coconut Rava Masala Dosa', 'Coconut Rava Dosa', 'Onion Rava Paneer Dosa', 'Onion Rava Masala Dosa', 'Onion Rava Dosa',], { label: 'Rava Dosas' });

    g.setNode('Uttapam Items');
    g.setNode('Mixed Veg Uttapam', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹140' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Coconut Uttapam', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹140' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Tomato Uttapam', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹140' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Tomato Uttapam', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Onion Uttapam', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Sada Uttapam', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Paneer Uttapam', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹200' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Uttapam Items', ['Mixed Veg Uttapam', 'Coconut Uttapam', 'Onion Tomato Uttapam', 'Tomato Uttapam', 'Onion Uttapam', 'Sada Uttapam', 'Paneer Uttapam',], { label: 'Uttapam Items' });

    g.setNode('North Indian Thali');

    g.setNode('North Indian Mini Thali');

    g.setNode('Fixed Meals (South Indian)');

    g.setNode('Mini Snacks');

    g.setNode('South Indian Thali');

    g.setNode('North Indian Menu (Veg Alacarta)');

    g.setNode('Chinese Soups');
    g.setNode('Cream of Tomato Soup', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mixed Veg Soup', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Veg Talumein Soup', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Veg Hot & Sour Soup', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹120' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Sweet Corn Soup', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹135' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Chinese Soups', ['Cream of Tomato Soup', 'Mixed Veg Soup', 'Veg Talumein Soup', 'Veg Hot & Sour Soup', 'Sweet Corn Soup',], { label: 'Chinese Soups' });

    g.setNode('Roti and Naan');
    g.setNode('Butter Roti', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹25' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Paratha', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹50' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Naan (Plain)', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹40' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Butter Naan', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹50' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Roti', { o: true, e: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹20' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Roti and Naan', ['Butter Roti', 'Paratha', 'Naan (Plain)', 'Butter Naan', 'Roti',], { label: 'Roti and Naan' });

    g.setNode('Beverages');
    g.setNode('Horlicks', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Bournvita', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Nescafe', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Tea', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹30' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Filter Coffee', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹50' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mango Panna', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹70' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Ginger Lemon Soda', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Masala Soda', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Lemon Soda', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Kokam Soda', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹100' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Banana Lassi', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹100' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mango Lassi', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹100' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Banana Shake', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Kiwi Shake', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Saffron Shake', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mix Fruit Shake', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Dry Fruit Shake', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹180' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mango Shake (only Season)', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Beverages', ['Horlicks', 'Bournvita', 'Nescafe', 'Tea', 'Filter Coffee', 'Mango Panna', 'Ginger Lemon Soda', 'Masala Soda', 'Lemon Soda', 'Kokam Soda', 'Banana Lassi', 'Mango Lassi', 'Banana Shake', 'Kiwi Shake', 'Saffron Shake', 'Mix Fruit Shake', 'Dry Fruit Shake', 'Mango Shake (only Season)',], { label: 'Beverages' });

    g.setNode('Full Meals (South Indian)');

    g.setNode('North Indian Eco Thali');

    g.setNode('Juice Items');
    g.setNode('Anar Juice', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Pineapple Juice', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Watermelon Juice', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mix Fruit Juice', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹160' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mosambi Juice', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Orange Juice (Only Season)', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mango Juice (Only Season)', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹110' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Grape Juice (Only Season)', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Strawberry Juice (Only Season)', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹130' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Kiwi Juice', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹150' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Kokum Juice', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹100' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Juice Items', ['Anar Juice', 'Pineapple Juice', 'Watermelon Juice', 'Mix Fruit Juice', 'Mosambi Juice', 'Orange Juice (Only Season)', 'Mango Juice (Only Season)', 'Grape Juice (Only Season)', 'Strawberry Juice (Only Season)', 'Kiwi Juice', 'Kokum Juice',], { label: 'Juice Items' });

    g.setNode('Mojito Items');
    g.setNode('Mint Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Pineapple Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Litchi Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Kiwi Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mongo Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Orange Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Strawberry Mojito', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹90' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('Mojito Items', ['Mint Mojito', 'Pineapple Mojito', 'Litchi Mojito', 'Kiwi Mojito', 'Mongo Mojito', 'Orange Mojito', 'Strawberry Mojito',], { label: 'Mojito Items' });

    g.setNode('SummerCool Sharbat');
    g.setNode('Kiwi Sharbat', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Strawberry Sharbat', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Litchi Sharbat', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Pineapple Sharbat', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Mango Sharbat', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    g.setNode('Orange Sharbat', { o: true, d: true, a: true, c: true, m: true, amount: [{ quantity: 1, price: '₹80' }], contents: '', description: '', time: { from: '0900', to: '2300' } });
    createEdges('SummerCool Sharbat', ['Kiwi Sharbat', 'Strawberry Sharbat', 'Litchi Sharbat', 'Pineapple Sharbat', 'Mango Sharbat', 'Orange Sharbat',], { label: 'SummerCool Sharbat' });

    // Link policies
    linkPolicies(hotel_id);

    // Create edges from facilities to all the individual facilities
    // Scan thru all the facilities and link only those for which facility is mark as 'yes'
    linkFacilities(hotel_id);

    // Link the room items
    // FIXME: Each room might have different amenities. Need to have a mapping of rooms to their amenities
    linkRoomItems(hotel_id);

    // Link menu items
    linkMenuItems(hotel_id);

    // Create all_items node that has all the items (including facilities, roomitem, menu)
    // This could be a big node
    createAllItemsNode(hotel_id);
}

function linkPolicies(hotel_id) {
    const nodes = g.nodes();
    for (var i=0; i<nodes.length; i++) {
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
    for (var i=0; i<nodes.length; i++) {
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
    for (var i=0; i<nodes.length; i++) {
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
    for (var i=0; i<nodes.length; i++) {
        var node = g.node(nodes[i]);
         if (!_.isUndefined(node)) {
            if (!_.isUndefined(node['m']) && _.isEqual(node['m'], 'yes')) {
                // console.log('menu' + '->' + name);
                g.setEdge('m', nodes[i], { label: 'menu' });
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
        // Add the children of this node, if any
        children = g.children(name);
        for (var j = 0; j < children.length; j++) {
            allItems.push(children[j]);
        }

        // If the node is not a parent, then check the attributes of the node, like 'facility', 'menu', 'roomitem' and add it
        // Do not add a node without attribute. It could be a parent node
        if (!_.isUndefined(node)) {
            if (
                (!_.isUndefined(node['p']) && _.isEqual(node['p'], true)) ||
                (!_.isUndefined(node['f']) && _.isEqual(node['f'], true)) ||
                (!_.isUndefined(node['m']) && _.isEqual(node['m'], true)) ||
                (!_.isUndefined(node['ri']) && _.isEqual(node['ri'], true))
            ) {
                // Add to the list
                allItems.push(name);
            }
        }
    }
    g.setNode('all_items', allItems);

    // console.log('all items=',g.node('all_items'), ',count=', g.node('all_items').length);
}

function createEdges(source, targets, label) {
    targets.forEach(t => {
        g.setEdge(source, t, label);
    });
}

// Store this JSON to Graph collection
module.exports.create = async function (hotel_id = '000', hotel_name = 'Dummy hotel') {
    const GraphModel = require('../src/db/Graph');

    createGraph(hotel_id, hotel_name);
    const json = graphlib.json.write(g);
    // console.log(JSON.stringify(json));
    console.log('nodes=', g.nodeCount());

    let data;
    try {
        data = await GraphModel.findOneAndUpdate({ value: hotel_id }, json, { new: true, upsert: true });
    } catch (error) {
        console.log('error in storing graph:', error);
    }
}

// require('./graph').create();
