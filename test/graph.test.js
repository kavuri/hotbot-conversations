/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

const env = require('../env');
const _ = require('lodash');
const GraphModel = require('../src/db/Graph');
const graphlib = require('graphlib');
let dbsetup = require('./dbsetup');

let g;
//jest.setTimeout(500);

/**
 * Initialize graph
 */
beforeAll(async () => {
    let graph = await GraphModel.findOne({ value: '1' }).lean().exec();
    g = graphlib.json.read(graph);
});

afterAll(async () => {
});

test('policy should have policy and available flag', () => {
    g.nodes().forEach((n) => {
        let node = g.node(n);
        if (_.has(node, 'p')) {
            try {
                expect(node.f).toBeUndefined();
                expect(node.a).toBeDefined();
                expect(node.o).toBeUndefined();
                expect(node.m).toBeUndefined();
                expect(node.e).toBeUndefined();
                expect(node.d).toBeUndefined();
                expect(node.ri).toBeUndefined();
                expect(node.c).toBeUndefined();
                expect(node.r).toBeUndefined();
            } catch (error) {
                console.error(JSON.stringify(node) + ' failed');
                throw error;
            }
        }
    })
});

test('all facility nodes should have msg flag in yes/no', () => {
    g.nodes().forEach((n) => {
        let node = g.node(n);
        if (_.has(node, 'f')) {
            try {
                expect(node.f).toBeTruthy();
                expect(node.a).toBeDefined();
                expect(node.o).toBeDefined();
                expect(node.m).toBeUndefined();
                expect(node.e).toBeUndefined();
                expect(node.d).toBeUndefined();
                expect(node.c).toBeUndefined();
                expect(node.ri).toBeUndefined();
                expect(node.msg).toBeDefined();
                expect(node.msg.yes).toBeDefined();
                expect(node.msg.no).toBeDefined();
            } catch (error) {
                console.error(n + '=' + JSON.stringify(node) + ' failed');
                throw error;
            }
        }
    })
});

test('all room items check', () => {
    g.nodes().forEach((n) => {
        let node = g.node(n);
        try {
            if (_.has(node, 'ri')) {
                expect(node.ri).toBeTruthy();
                expect(node.a).toBeDefined();
                expect(node.o).toBeDefined();
                expect(node.c).toBeDefined();
                expect(node.msg).toBeDefined();
                expect(node.msg.yes).toBeDefined();
                expect(node.msg.no).toBeDefined();
                if (_.isEqual(node.c, true)) {
                    expect(node.limit).toBeDefined();
                    expect(node.limit.count).toBeDefined();
                    expect(node.limit.for).toBeDefined();
                }
            }
        } catch (error) {
            console.error(n + '=' + JSON.stringify(node) + ' failed');
            throw error;
        }
    })
});

test('all menu items check', () => {
    g.nodes().forEach((n) => {
        let node = g.node(n);
        try {
            if (_.has(node, 'm')) {
                expect(node.a).toBeDefined();
                expect(node.o).toBeDefined();
                expect(node.mtype).toBeDefined();
                expect(node.msg).toBeUndefined();
                expect(node.c).toBeDefined();
                expect(node.qty).toBeDefined();
                expect(node.price).toBeDefined();
            }
        } catch (error) {
            console.error(n + '=' + JSON.stringify(node) + ' failed');
            throw error;
        }
    })
});

test('list all non-policy,facility,room item, menu items', () => {
    g.nodes().forEach((n) => {
        let node = g.node(n);
        if (!_.has(node, 'p') && !_.has(node, 'f') && !_.has(node, 'm') && !_.has(node, 'ri')) {
            if (_.isUndefined(g.parent(n))) {
                // console.log(JSON.stringify(n));
            }
        }
    });
});