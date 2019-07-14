// eslint-disable
// this is an auto generated file. This will be overwritten

export const onCreateGuestOrder = `subscription OnCreateGuestOrder(
  $hotel_id: ID
  $order_id: ID
  $room_no: String
) {
  onCreateGuestOrder(
    hotel_id: $hotel_id
    order_id: $order_id
    room_no: $room_no
  ) {
    hotel_id
    order_id
    room_no
    category
    items {
      type
      count
    }
    req_count
    res_count
    order_time
    status
    priority
    service_time
    cancelled_by
    last_update_at
    comments {
      items {
        order_id
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
export const onChangeOrderStatus = `subscription OnChangeOrderStatus(
  $hotel_id: ID
  $order_id: ID
  $room_no: String
) {
  onChangeOrderStatus(
    hotel_id: $hotel_id
    order_id: $order_id
    room_no: $room_no
  ) {
    order_id
    status_id
    status
    created_at
    changed_by
  }
}
`;
export const onChangeOrderPriority = `subscription OnChangeOrderPriority(
  $hotel_id: ID
  $order_id: ID
  $room_no: String
) {
  onChangeOrderPriority(
    hotel_id: $hotel_id
    order_id: $order_id
    room_no: $room_no
  ) {
    order_id
    priority_id
    priority
    created_at
  }
}
`;
export const onCommentAdded = `subscription OnCommentAdded($hotel_id: ID, $order_id: ID, $room_no: String) {
  onCommentAdded(hotel_id: $hotel_id, order_id: $order_id, room_no: $room_no) {
    order_id
    comment_id
    content
    created_at
    commented_by
  }
}
`;
