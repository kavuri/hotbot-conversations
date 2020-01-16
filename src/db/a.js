# Structure to change the priority of an order
input ChangeOrderPriorityInput {
	hotel_id: ID!
	o_id: ID!
	new_priority: Priority
}

# Structure to change the status of an order
input ChangeOrderStatusInput {
	hotel_id: ID!
	o_id: ID!
	new_status: Status
}

# Comment object type
type Comment {
	o_id: ID!
	comment_id: ID!
	content: String!
	created_at: AWSDateTime!
	commented_by: String!
}

# For list of comments
type CommentConnection {
	items: [Comment]
	nextToken: String
}

# Comment input
input CommentInput {
	o_id: ID!
	comment_id: ID!
	content: String!
	created_at: AWSDateTime!
	commented_by: String!
}

input CreateGuestOrderInput {
	hotel_id: ID!
	user_id: ID!
	o_id: ID!
	room_no: String!
	o_items: [OrderItemInput!]
	o_time: AWSDateTime!
	o_status: StatusObj!
	o_priority: PriorityObj!
}

type GuestOrder {
	hotel_id: ID!
	o_id: ID!
	room_no: String!
	o_items: [OrderItem!]
	o_time: AWSDateTime!
	o_status: StatusObjType!
	o_priority: PriorityObjType!
	o_completion_time: AWSDateTime
	o_cancelled_by: String
	o_last_update_at: AWSDateTime
	o_comments(limit: Int, nextToken: String): CommentConnection
}

type GuestOrderConnection {
	orders: [GuestOrder]
	nextToken: String
}

type Mutation {
	createGuestOrder(input: CreateGuestOrderInput!): GuestOrder
	changeOrderStatus(input: ChangeOrderStatusInput!): StatusObjType
	changeOrderPriority(input: ChangeOrderPriorityInput): PriorityObjType
	addCommentToOrder(input: CommentInput): Comment
}

type OrderItem {
	item_name: String!
	category: String!
	req_count: Int
	res_count: Int
}

input OrderItemInput {
	item_name: String!
	category: String!
	req_count: Int
	res_count: Int
}

enum Priority {
	urgent
	asap
	leisure
}

# Similar to comments, need to keep track of the various priority changes
input PriorityObj {
	o_id: ID!
	_id: ID!
	priority: Priority!
	created_at: AWSDateTime!
	changed_by: String!
}

type PriorityObjType {
  o_id: ID!
	_id: ID!
	priority: Priority!
	created_at: AWSDateTime!
	changed_by: String!
}

# Similar to comments, need to keep track of the various status changes
input StatusObj {
	o_id: ID!
	_id: ID!
	status: Status!
	created_at: AWSDateTime!
	changed_by: String!
}

type StatusObjType {
  o_id: ID!
	_id: ID!
	status: Status!
	created_at: AWSDateTime!
	changed_by: String!
}

type PriorityObjConnection {
	items: [PriorityObj]
	nextToken: String
}

type Query {
	getComments(hotel_id: ID!, o_id: ID!): CommentConnection
	getGuestOrder(hotel_id: ID!, room_no: String!): GuestOrder
	listGuestOrders(filter: TableGuestOrderFilterInput, limit: Int, nextToken: String): GuestOrderConnection
}

enum Status {
	new
	progress
	done
	cant_serve
	cancelled
}

type StatusObjConnection {
	items: [StatusObjType]
	nextToken: String
}

type Subscription {
	onCreateGuestOrder(hotel_id: ID!): GuestOrder
		@aws_subscribe(mutations: ["createGuestOrder"])
	onChangeOrderStatus(hotel_id: ID, o_id: ID, room_no: String): StatusObjType
		@aws_subscribe(mutations: ["changeOrderStatus"])
	onChangeOrderPriority(hotel_id: ID, o_id: ID, room_no: String): PriorityObjType
		@aws_subscribe(mutations: ["changeOrderPriority"])
	onCommentAdded(hotel_id: ID, o_id: ID, room_no: String): Comment
		@aws_subscribe(mutations: ["addCommentToOrder"])
}

input TableBooleanFilterInput {
	ne: Boolean
	eq: Boolean
}

input TableFloatFilterInput {
	ne: Float
	eq: Float
	le: Float
	lt: Float
	ge: Float
	gt: Float
	contains: Float
	notContains: Float
	between: [Float]
}

input TableGuestOrderFilterInput {
	hotel_id: TableIDFilterInput
	o_id: TableIDFilterInput
	room_no: TableStringFilterInput
	o_items: TableStringFilterInput
	o_time: TableStringFilterInput
	o_status: TableStringFilterInput
	o_priority: TableStringFilterInput
	o_completion_time: TableStringFilterInput
	o_cancelled_by: TableStringFilterInput
	o_last_update_at: TableStringFilterInput
	o_comments: TableStringFilterInput
}

input TableIDFilterInput {
	ne: ID
	eq: ID
	le: ID
	lt: ID
	ge: ID
	gt: ID
	contains: ID
	notContains: ID
	between: [ID]
	beginsWith: ID
}

input TableIntFilterInput {
	ne: Int
	eq: Int
	le: Int
	lt: Int
	ge: Int
	gt: Int
	contains: Int
	notContains: Int
	between: [Int]
}

input TableStringFilterInput {
	ne: String
	eq: String
	le: String
	lt: String
	ge: String
	gt: String
	contains: String
	notContains: String
	between: [String]
	beginsWith: String
}

schema {
	query: Query
	mutation: Mutation
	subscription: Subscription
}