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
const engine = new Engine()

/**
 * Rule for identifying people who may like screwdrivers
 */
const drinkRule = {
  conditions: {
    all: [{
      fact: 'drinksOrangeJuice',
      operator: 'equal',
      value: true
    }, {
      fact: 'enjoysVodka',
      operator: 'equal',
      value: true
    }]
  },
  event: { type: 'drinks-screwdrivers' },
  priority: 10, // IMPORTANT!  Set a higher priority for the drinkRule, so it runs first
  onSuccess: function (event, almanac) {
    almanac.addRuntimeFact('screwdriverAficionado', true)
  },
  onFailure: function (event, almanac) {
    almanac.addRuntimeFact('screwdriverAficionado', false)
  }
}
engine.addRule(drinkRule)

/**
 * Rule for identifying people who should be invited to a screwdriver social
 * - Only invite people who enjoy screw drivers
 * - Only invite people who are sociable
 */
const inviteRule = {
  conditions: {
    all: [{
      fact: 'screwdriverAficionado', // this fact value is set when the drinkRule is evaluated
      operator: 'equal',
      value: true
    }, {
      fact: 'isSociable',
      operator: 'equal',
      value: true
    }]
  },
  event: { type: 'invite-to-screwdriver-social' },
  priority: 5 // Set a lower priority for the drinkRule, so it runs later (default: 1)
}
engine.addRule(inviteRule)

/**
 * Register listeners with the engine for rule success and failure
 */
let facts
engine
  .on('success', (event, almanac) => {
    console.log('@@sate' + facts.accountId + ' DID '.green + 'meet conditions for the ' + event.type.underline + ' rule.')
  })
  .on('failure', event => {
    console.log(facts.accountId + ' did ' + 'NOT'.red + ' meet conditions for the ' + event.type.underline + ' rule.')
  })

// define fact(s) known at runtime
facts = { accountId: 'washington', drinksOrangeJuice: true, enjoysVodka: true, isSociable: true }
engine
  .run(facts) // first run, using washington's facts
  .then((results) => {
    // access whether washington is a screwdriverAficionado,
    // which was determined at runtime via the rules `drinkRules`
    return results.almanac.factValue('screwdriverAficionado')
  })
  .then(isScrewdriverAficionado => {
    console.log(`${facts.accountId} ${isScrewdriverAficionado ? 'IS'.green : 'IS NOT'.red} a screwdriver aficionado`)
  })
  .then(() => {
    facts = { accountId: 'jefferson', drinksOrangeJuice: true, enjoysVodka: false, isSociable: true }
    return engine.run(facts) // second run, using jefferson's facts; facts & evaluation are independent of the first run
  })
  .then((results) => {
    // access whether jefferson is a screwdriverAficionado,
    // which was determined at runtime via the rules `drinkRules`
    return results.almanac.factValue('screwdriverAficionado')
  })
  .then(isScrewdriverAficionado => {
    console.log(`${facts.accountId} ${isScrewdriverAficionado ? 'IS'.green : 'IS NOT'.red} a screwdriver aficionado`)
  })
  .catch(console.log)

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
