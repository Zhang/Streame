#! /bin/sh

(npm install)
(cd public && bower cache clean && bower install) &
(cd server && npm install)
wait
