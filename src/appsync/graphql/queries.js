// eslint-disable
// this is an auto generated file. This will be overwritten

export const getGuestOrder = `query GetGuestOrder($hotel_id: ID!, $room_no: String!) {
  getGuestOrder(hotel_id: $hotel_id, room_no: $room_no) {
    hotel_id
    user_id
    o_id
    room_no
    o_items {
      item_name
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
export const listGuestOrders = `query ListGuestOrders(
  $filter: TableGuestOrderFilterInput
  $limit: Int
  $nextToken: String
) {
  listGuestOrders(filter: $filter, limit: $limit, nextToken: $nextToken) {
    orders {
      hotel_id
      user_id
      o_id
      room_no
      o_items {
        item_name
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
    nextToken
  }
}
`;
