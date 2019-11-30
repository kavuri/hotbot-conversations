#!/bin/bash

# Create the data directories
mkdir -p ./data/rs01 ./data/rs02

# Start the mongodb instances
mongod --replSet rs0 --port 27017 --bind_ip localhost --dbpath ./rs01 --oplogSize 128 &
mongod --replSet rs0 --port 27018 --bind_ip localhost --dbpath ./rs02 --oplogSize 128 &

mongo test --eval 'rsconf = {
	"_id" : "rs0",
	"members" : [
		{
			"_id" : 0,
			"host" : "localhost:27017"
		},
		{
			"_id" : 1,
			"host" : "localhost:27018"
		}
	]
};
rs.initiate(rsconf);'
