// eslint-disable
// this is an auto generated file. This will be overwritten

module.exports.createGuestOrder = `mutation CreateGuestOrder($input: CreateGuestOrderInput!) {
  createGuestOrder(input: $input) {
    hotel_id
    o_id
    room_no
    o_items {
      item_name
      category
      req_count
      res_count
    }
    o_time
    o_status
    o_priority
    o_completion_time
    o_cancelled_by
    o_last_update_at
    o_comments {
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
module.exports.changeOrderStatus = `mutation ChangeOrderStatus($input: ChangeOrderStatusInput!) {
  changeOrderStatus(input: $input) {
    o_id
    status_id
    status
    created_at
    changed_by
  }
}
`;
module.exports.changeOrderPriority = `mutation ChangeOrderPriority($input: ChangeOrderPriorityInput) {
  changeOrderPriority(input: $input) {
    o_id
    priority_id
    priority
    created_at
  }
}
`;
module.exports.addCommentToOrder = `mutation AddCommentToOrder($input: CommentInput) {
  addCommentToOrder(input: $input) {
    o_id
    comment_id
    content
    created_at
    commented_by
  }
}
`;
