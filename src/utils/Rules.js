/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { Engine } = require('json-rules-engine');

/**
 * Setup a new engine
 */
const engine = new Engine([], { allowUndefinedFacts: true }); // allowUndefinedFacts will allow flags that are not set, like m: true

/**
 * Rule for checking if item is available
 */
const isItemAvailableRule = {
    conditions: {
        all: [{
            fact: 'a',
            operator: 'equal',
            value: true
        }]
    },
    event: 'is-item-available',
    priority: 10,
    onSuccess: (event, almanac) => {
        almanac.addRuntimeFact('available', true);
    },
    onFailure: (event, almanac) => {
        almanac.addRuntimeFact('available', false);
        // Other rules do not have to run. Stop the engine
        engine.stop();
    }
}

const isFacilityRule = {
    conditions: {
        all: [
            {
                fact: 'available',
                operator: 'equal',
                value: true
            },
            {
                fact: 'f',
                operator: 'equal',
                value: true
            }
        ]
    },
    event: 'is-a-facility',
    priority: 9,
    onSuccess: (event, almanac) => {
        almanac.addRuntimeFact('facility', true);
    },
    onFailure: (event, almanac) => {
        almanac.addRuntimeFact('facility', false);
    }
}

const isRoomItemRule = {
    conditions: {
        all: [
            {
                fact: 'available',
                operator: 'equal',
                value: true
            },
            {
                fact: 'ri',
                operator: 'equal',
                value: true
            }
        ]
    },
    event: 'is-a-roomitem',
    priority: 9,
    onSuccess: (event, almanac) => {
        almanac.addRuntimeFact('roomitem', true);
    },
    onFailure: (event, almanac) => {
        almanac.addRuntimeFact('roomitem', false);
    }
}

const isMenuItemRule = {
    conditions: {
        all: [
            {
                fact: 'available',
                operator: 'equal',
                value: true
            },
            {
                fact: 'm',
                operator: 'equal',
                value: true
            }
        ]
    },
    event: 'is-a-menuitem',
    priority: 9,
    onSuccess: (event, almanac) => {
        almanac.addRuntimeFact('menu', true);
    },
    onFailure: (event, almanac) => {
        almanac.addRuntimeFact('menu', false);
    }
}

const isOrderableRule = {
    conditions: {
        all: [
            {
                any: [
                    {
                        fact: 'facility',
                        operator: 'equal',
                        value: true
                    },
                    {
                        fact: 'roomitem',
                        operator: 'equal',
                        value: true
                    },
                    {
                        fact: 'menu',
                        operator: 'equal',
                        value: true
                    }
                ],
                any: [
                    {
                        fact: 'o',
                        operator: 'equal',
                        value: true
                    }
                ]
            }
        ]
    },
    event: 'is-orderable',
    priority: 8,
    onSuccess: (event, almanac) => {
        almanac.addRuntimeFact('order', true);
    },
    onFailure: (event, almanac) => {
        almanac.addRuntimeFact('order', false);
    }
}

const itemSearchRules = [isItemAvailableRule, isFacilityRule, isRoomItemRule, isMenuItemRule, isOrderableRule];
itemSearchRules.forEach(rule => engine.addRule(rule));

engine
    .on('success', (event, almanac) => {

    })
    .on('failure', (event, almanac) => {

    });

module.exports.run = async (facts) => {
    return await engine.run(facts);
}
