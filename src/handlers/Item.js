/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'using strict';

const _ = require('lodash');

class Item {
    constructor(item) {
        this.name = item.name;
        this.a = item.a;
        this.type = item.iType;
    }

    available() {
        return this.a;
    }

    type() {
        return this.type;
    }

    name() {
        return this.name;
    }

    static load(item) {
        if (_.has(item, 'p') && item.p) { item.iType = 'p'; return new Policy(item); }
        if (_.has(item, 'f') && item.f) { item.iType = 'f'; return new Facility(item); }
        if (_.has(item, 'ri') && item.ri) { item.iType = 'ri'; return new RoomItem(item); }
        if (_.has(item, 'm') && item.m) { item.iType = 'm'; return new MenuItem(item); }
    }
}
module.exports.Item = Item;

class Policy extends Item {
    constructor(policy) {
        super(policy);
        this.p = policy.p;
        this.msg = policy.msg;
    }

    msg() {
        return this.msg;
    }
}
module.exports.Policy = Policy;

class Facility extends Item {
    constructor(facility) {
        super(facility);
        this.f = facility.f;
        this.o = facility.o;
        this.msg = facility.msg;
        this.timings = facility.timings;
        this.location = facility.location;
        this.price = facility.price;
        this.reserve = facility.reserve;
    }

    orderable() {
        return this.o;
    }

    hasCount() {
        return false;   // A Facility cannot be ordered, so by default, it will not have count
    }

    msgYes() {
        return this.msg.yes;
    }

    msgNo() {
        return this.msg.no;
    }

    timingsMsg() {
        //TODO: Use the 'from', 'to' objects to determine the exact message. For now, just the raw message is fine
        return this.timings.msg;
    }

    locationMsg() {
        return this.location.msg;
    }

    priceMsg() {
        //TODO: Use the 'price' objects to determine the exact message. For now, just the raw message is fine
        return this.price.msg;
    }

    reserveMsg() {
        //TODO: Implement reservation of a facility feature
        return this.reserve.msg;
    }
}
module.exports.Facility = Facility;

class RoomItem extends Item {
    constructor(roomitem) {
        super(roomitem);
        this.ri = roomitem.ri;
        this.o = roomitem.o;
        this.c = roomitem.c;
        this.price = parseInt(roomitem.price);
        this.limit = roomitem.limit;
        this.msg = roomitem.msg;
    }

    orderable() {
        return this.o;
    }

    hasCount() {
        return this.c;
    }

    price() {
        return this.price;
    }

    limitCount() {
        return this.limit.count;
    }

    limitFor() {
        return this.limit.for;
    }

    msgYes() {
        return this.msg.yes;
    }

    msgNo() {
        return this.msg.no;
    }
}
module.exports.RoomItem = RoomItem;

class MenuItem extends Item {
    constructor(menuitem) {
        super(menuitem);
        this.m = menuitem.m;
        this.o = menuitem.o;
        this.mtype = menuitem.mtype;
        this.c = menuitem.c;
        this.qty = parseInt(menuitem.qty);
        this.price = parseInt(menuitem.price);
    }

    orderable() {
        return this.o;
    }

    menuItemType() {
        return this.mtype;
    }

    hasCount() {
        return this.c;
    }

    quantity() {
        return this.qty;
    }

    price() {
        return this.price;
    }
}
module.exports.MenuItem = MenuItem;