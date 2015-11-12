#! /bin/sh

(cd public && bower install) &
(cd server && npm install)
wait
