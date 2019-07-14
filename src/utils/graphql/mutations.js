// eslint-disable
// this is an auto generated file. This will be overwritten

module.exports.createGuestOrder = `mutation CreateGuestOrder($input: CreateGuestOrderInput!) {
  createGuestOrder(input: $input) {
    hotel_id
    order_id
    room_no
    items {
      item_name
      category
      req_count
      res_count
    }
    order_time
    status
    priority
    completion_time
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
module.exports.changeOrderStatus = `mutation ChangeOrderStatus($input: ChangeOrderStatusInput!) {
  changeOrderStatus(input: $input) {
    order_id
    status_id
    status
    created_at
    changed_by
  }
}
`;
module.exports.changeOrderPriority = `mutation ChangeOrderPriority($input: ChangeOrderPriorityInput) {
  changeOrderPriority(input: $input) {
    order_id
    priority_id
    priority
    created_at
  }
}
`;
module.exports.addCommentToOrder = `mutation AddCommentToOrder($input: CommentInput) {
  addCommentToOrder(input: $input) {
    order_id
    comment_id
    content
    created_at
    commented_by
  }
}
`;
