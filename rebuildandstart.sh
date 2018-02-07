#!/bin/sh
docker build . -t sia-test
#export SIA_WALLET_PASSWORD=y2CG*rzcV2sk,L$h
docker-compose up -d 
docker logs siatest_siatest_1 -f