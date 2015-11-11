#! /bin/sh

(npm install)
(cd public && bower install) &
(cd server && npm install)
wait
