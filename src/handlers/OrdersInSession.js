/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const _ = require('lodash');

const { Facility, MenuItem, RoomItem } = require('./Item');

class OrdersInSession {
    constructor(orders = []) {
        this.orders = orders;
    }

    add(itemObj, reqCount, notWorking = false) {
        // Update the item if it has already been ordered
        console.log('++--itemObj=', itemObj, '++-', itemObj instanceof MenuItem);
        let item_idx = _.indexOf(this.orders, itemObj.name);
        if (!_.isEqual(item_idx, -1)) { // Item has not been ordered already, update the count
            this.orders[item_idx].req_count += reqCount;
        } else {    // This item has not been already ordered
            let type;
            if (itemObj instanceof MenuItem) {   // menu item
                type = 'menu';
            } else if (itemObj instanceof Facility) {    // facility. This is for reserving a facility
                //TODO: Add facility reservation
                type = 'facility';
            } else if (itemObj instanceof RoomItem) {   // room item
                type = 'roomitem';
            } else if (notWorking) {
                type = 'problem';
            }
            this.orders.push({ type: type, name: itemObj.name, req_count: reqCount });
        }

    }

    // Reset the orders in the session
    reset() {
        this.orders = [];
    }

    remove(itemObj) {
        _.remove(this.orders, {
            name: itemObj.name
        });
    }

    currOrders() {
        return this.orders;
    }

    toString() {
        let str = '';
        for (var i = 0; i < this.orders.length; i++) {
            str += this.orders[i].req_count + ' ' + this.orders[i].name + ', '
        }
        return str;
    }

    static stringifyOrdersAtFrontDesk(frontdeskOrders) {
        let str = '';
        for (var i = 0; i < frontdeskOrders.length; i++) {
            str += frontdeskOrders[i].item.req_count + ' ' + frontdeskOrders[i].item.name + ', ';
        }

        return str;
    }
}

module.exports.OrdersInSession = OrdersInSession;