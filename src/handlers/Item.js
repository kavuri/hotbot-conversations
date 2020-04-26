/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const _ = require('lodash');

class Item {
    constructor(item) {
        this._name = item.name;
        this._a = item.a;
        this._type = item.iType;
    }

    available() {
        return this._a;
    }

    type() {
        return this._type;
    }

    name() {
        return this._name;
    }

    static load(item) {
        if (_.has(item, 'p') && item.p) { item.iType = 'p'; return new Policy(item); }
        if (_.has(item, 'f') && item.f) { item.iType = 'f'; return new Facility(item); }
        if (_.has(item, 'ri') && item.ri) { item.iType = 'ri'; return new RoomItem(item); }
        if (_.has(item, 'm') && item.m) { item.iType = 'm'; return new MenuItem(item); }
    }

    static facilities() {

    }
}
module.exports.Item = Item;

class Policy extends Item {
    constructor(policy) {
        super(policy);
        this._msg = policy.msg;
    }

    msg() {
        return this._msg;
    }
}
module.exports.Policy = Policy;

class Facility extends Item {
    constructor(facility) {
        super(facility);
        this._o = facility.o;
        this._msg_yes = facility.msg.yes;
        this._msg_no = facility.msg.no;
        this._timings = facility.timings;
        this._location = facility.location;
        this._price = facility.price;
        this._reserve = facility.reserve;
    }

    orderable() {
        return this._o;
    }

    hasCount() {
        return false;   // A Facility cannot be ordered, so by default, it will not have count
    }

    msgYes() {
        return this._msg_yes;
    }

    msgNo() {
        return this._msg_no;
    }

    timingsMsg() {
        //TODO: Use the 'from', 'to' objects to determine the exact message. For now, just the raw message is fine
        return this._timings.msg;
    }

    locationMsg() {
        return this._location.msg;
    }

    priceMsg() {
        //TODO: Use the 'price' objects to determine the exact message. For now, just the raw message is fine
        return this._price.msg;
    }

    reserveMsg() {
        //TODO: Implement reservation of a facility feature
        return this._reserve.msg;
    }
}
module.exports.Facility = Facility;

class RoomItem extends Item {
    constructor(roomitem) {
        super(roomitem);
        this._o = roomitem.o;
        this._c = roomitem.c;
        this._price = roomitem.price;
        this._limit = roomitem.limit;
        this._msg_yes = roomitem.msg.yes;
        this._msg_no = roomitem.msg.no;
    }

    orderable() {
        return this._o;
    }

    hasCount() {
        return this._c;
    }

    price() {
        return this._price;
    }

    limit() {
        return this._limit.count;
    }

    limitFor() {
        return this._limit.for;
    }

    msgYes() {
        return this._msg_yes;
    }

    msgNo() {
        return this._msg_no;
    }
}
module.exports.RoomItem = RoomItem;

class MenuItem extends Item {
    constructor(menuitem) {
        super(menuitem);
        this._o = menuitem.o;
        this._mtype = menuitem.mtype;
        this._c = menuitem.c;
        this._qty = menuitem.qty;
        this._price = menuitem.price;
    }

    orderable() {
        return this._o;
    }

    menuItemType() {
        return this._mtype;
    }

    hasCount() {
        return this._c;
    }

    quantity() {
        return this._qty;
    }

    price() {
        return this._price;
    }
}
module.exports.MenuItem = MenuItem;