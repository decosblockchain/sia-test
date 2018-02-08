# sia-test
I wrote this small project while doing research into Sia.

## Getting started
To run this prototype you need to have Docker installed.

Next, you need to build the SIA docker image. To do that, issue the following command

```
docker build . -f Dockerfile.sia -t sia
```

Then, you can play with the source code of index.js and when you're ready to run it, do:

```
./rebuildandrestart.sh
```

It will build the code into a docker container and run it together with the sia container. Data is stored in the subpath `data`