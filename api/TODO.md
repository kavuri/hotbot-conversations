# All TODOs
  - Write unit test cases
  - Enable authentication for all the APIs
  - Ensure each API has the right kind of role based access permissions
  - Add undefined validation checks for all APIs using custom validator, like .custom(value => { return !_.isEqual(value, 'undefined'); })
  - Test listener to support different kinds of hotel log'ins
  - Introduce https://github.com/animir/node-rate-limiter-flexible/wiki/Mongo for handling DDoS and rate limiting

# Features
  - Implement calendaring for reservations. Like for a table in a restaurant, swimming pool, taxi etc.

# FIXME
  - Remove hardcoded user_id in order::patch(:/order_id) once auth user is in place