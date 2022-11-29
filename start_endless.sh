#!/bin/bash

for((;;)); do
	rm -rf lib/renders/*
	rm -rf lib/movies/*
	node main_server.js
	echo RESTARTING
done
