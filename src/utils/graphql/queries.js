// eslint-disable
// this is an auto generated file. This will be overwritten

export const getComments = `query GetComments($hotel_id: ID!, $o_id: ID!) {
  getComments(hotel_id: $hotel_id, o_id: $o_id) {
    items {
      o_id
      comment_id
      content
      created_at
      commented_by
    }
    nextToken
  }
}
`;
export const getGuestOrder = `query GetGuestOrder($hotel_id: ID!, $room_no: String!) {
  getGuestOrder(hotel_id: $hotel_id, room_no: $room_no) {
    hotel_id
    o_id
    room_no
    category
    items {
      type
      count
      req_count
      res_count
    }
    o_time
    o_status
    o_priority
    o_service_time
    o_cancelled_by
    last_update_at
    comments {
      items {
        o_id
        comment_id
        content
        created_at
        commented_by
      }
      nextToken
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
    items {
      hotel_id
      o_id
      room_no
      category
      items {
        type
        count
        req_count
        res_count
      }
      o_time
      o_status
      o_priority
      o_service_time
      o_cancelled_by
      last_update_at
      comments {
        nextToken
      }
    }
    nextToken
  }
}
`;
