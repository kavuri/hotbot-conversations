'use strict'

/*
 * This is an advanced example demonstrating rules that passed based off the
 * results of other rules by adding runtime facts.  It also demonstrates
 * accessing the runtime facts after engine execution.
 *
 * Usage:
 *   node ./examples/07-rule-chaining.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/07-rule-chaining.js
 */

require('colors')
const { Engine } = require( 'json-rules-engine')

/**
 * Setup a new engine
 */
//const engine = new Engine();
const engine = new Engine([], {allowUndefinedFacts: true})

/**
 * Rule for identifying people who may like screwdrivers
 */
const itemPresentRule = {
  conditions: {
    all: [{
      fact: 'present',
      operator: 'equal',
      value: true
    }]
  },
  event: { type: 'item-present' },
  priority: 10, // IMPORTANT!  Set a higher priority for the drinkRule, so it runs first
  onSuccess: function (event, almanac) {
    almanac.factValue('msg').then(msg => {
      //console.log(msg['yes']);
    });
    //console.log(almanac.Almanac.factMap.Map['msg']);
    almanac.addRuntimeFact('itemPresent', true)
  },
  onFailure: function (event, almanac) {
    almanac.addRuntimeFact('itemPresent', false)
  }
}
engine.addRule(itemPresentRule)

/**
 * Rule for identifying people who should be invited to a screwdriver social
 * - Only invite people who enjoy screw drivers
 * - Only invite people who are sociable
 */
const isOrderRule = {
  conditions: {
    all: [{
      fact: 'itemPresent', // this fact value is set when the drinkRule is evaluated
      operator: 'equal',
      value: true
    }, {
      fact: 'order',
      operator: 'equal',
      value: true
    }]
  },
  event: { type: 'it-is-an-order' },
  priority: 9, // Set a lower priority for the drinkRule, so it runs later (default: 1)
  onSuccess: function(event, almanac) {
     almanac.addRuntimeFact('isOrder', true);
  },
  onFailure: function(event, almanac) {
     almanac.addRuntimeFact('isOrder', false);
  }
}
engine.addRule(isOrderRule)

/**
 * Register listeners with the engine for rule success and failure
 */
let facts
engine
  .on('success', (event, almanac) => {
    //console.log('@@sate' + facts.accountId + ' DID '.green + 'meet conditions for the ' + event.type.underline + ' rule.')
    //console.log('success:', event, almanac);
  })
  .on('failure', event => {
    //console.log('failure:', event);
    //console.log(facts.accountId + ' did ' + 'NOT'.red + ' meet conditions for the ' + event.type.underline + ' rule.')
  })

// define fact(s) known at runtime
//facts = { accountId: 'washington', drinksOrangeJuice: true, enjoysVodka: true, isSociable: true }
const run = async function(facts) {
  var res = await engine.run(facts);
  return res;
}

async function main() {
var facts = {
  facility: false,
  menu: true,
  present: true,
  order: true,
  msg: {
    yes: 'There is one fitness center available on the 4th floor next to the cafe',
    no: 'There is no gym in this hotel'
  }
};
 
  var res = await run(facts);

  console.log('res=', await res.almanac.factValue('isOrder'));
  
}

main()
/*
engine
  .run(facts) // first run, using washington's facts
  .then((results) => {
    // access whether washington is a screwdriverAficionado,
    // which was determined at runtime via the rules `drinkRules`
    return results.almanac.factValue('itemPresent')
  })
  .then(isScrewdriverAficionado => {
    //console.log(`${facts.accountId} ${isScrewdriverAficionado ? 'IS'.green : 'IS NOT'.red} a screwdriver aficionado`)
    console.log(isScrewdriverAficionado)
  })
  .catch(console.log);
*/
/*
  .then(() => {
    facts = { facility: true, present: true, order: false, msg:{yes: 'Can be ordered', no:'cannot be ordered'}}
    return engine.run(facts) // second run, using jefferson's facts; facts & evaluation are independent of the first run
  })
  .then((results) => {
    // access whether jefferson is a screwdriverAficionado,
    // which was determined at runtime via the rules `drinkRules`
    return results.almanac.factValue('isOrder')
  })
  .then(isScrewdriverAficionado => {
    //console.log(`${facts.accountId} ${isScrewdriverAficionado ? 'IS'.green : 'IS NOT'.red} a screwdriver aficionado`)
    console.log(isScrewdriverAficionado);
  })
  .catch(console.log)
*/

/*
 * OUTPUT:
 *
 * washington DID meet conditions for the drinks-screwdrivers rule.
 * washington DID meet conditions for the invite-to-screwdriver-social rule.
 * washington IS a screwdriver aficionado
 * jefferson did NOT meet conditions for the drinks-screwdrivers rule.
 * jefferson did NOT meet conditions for the invite-to-screwdriver-social rule.
 * jefferson IS NOT a screwdriver aficionado
 */
