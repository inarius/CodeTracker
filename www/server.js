var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(8081, "0.0.0.0");