'use strict';
const graphlib = require('graphlib');
const graph = require('../scripts/graph');
const _ = require('lodash');

let g;

jest.setTimeout(500);

/**
 * Initialize graph
 */
beforeAll(async () => {
    const json = await graph.addOrUpdate('1', true);
    g = graphlib.json.read(json);
    console.log('node count=', g.nodeCount());
});

afterAll(() => {
    // Do nothing
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
                expect(node.msg).toBeUndefined();
                expect(node.c).toBeDefined();
                expect(node.quantity).toBeDefined();
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