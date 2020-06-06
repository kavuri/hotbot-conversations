/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

const env = require('../../env');
const fetch = require('node-fetch');

module.exports = async (order) => {
    console.log('notifyOrder:', order);

    fetch(process.env.API_SERVER_URL + '/orderWatch', { method: 'POST', body: JSON.stringify(order), headers: { 'Content-Type': 'application/json' } })
        .then(res => res.json())
        .then(json => console.log('order ' + order._id + ' sent to ' + order.hotel_id));
}
