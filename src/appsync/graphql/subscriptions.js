// eslint-disable
// this is an auto generated file. This will be overwritten

export const onCreateGuestOrder = `subscription OnCreateGuestOrder($hotel_id: ID!) {
  onCreateGuestOrder(hotel_id: $hotel_id) {
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
