// eslint-disable
// this is an auto generated file. This will be overwritten

module.exports.createOrder = `mutation CreateOrder(
  $hotel_id: ID!
  $user_id: ID!
  $o_id: ID!
  $room_no: String!
  $o_items: [OrderItemInput!]!
  $o_time: AWSDateTime!
  $o_status: StatusInput!
  $o_priority: PriorityInput!
) {
  createOrder(
    hotel_id: $hotel_id
    user_id: $user_id
    o_id: $o_id
    room_no: $room_no
    o_items: $o_items
    o_time: $o_time
    o_status: $o_status
    o_priority: $o_priority
  ) {
    hotel_id
    user_id
    o_id
    room_no
    o_items {
      name
      category
      req_count
      res_count
    }
    o_time
    o_status {
      _id
      status
      created_at
      updated_by
    }
    o_priority {
      _id
      priority
      created_at
      updated_by
    }
  }
}
`;
