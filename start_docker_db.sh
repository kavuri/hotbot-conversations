docker run -v "$PWD":/Users/skavuri/work/hotbot/ -p 8000:8000 --network sam-demo --name dynamodb amazon/dynamodb-local 
#docker run -v "$PWD":/Users/skavuri/work/hotbot/ -p 8000:8000 --network sam-demo --name dynamodb amazon/dynamodb-local -dbPath /Users/skavuri/work/hotbot/
