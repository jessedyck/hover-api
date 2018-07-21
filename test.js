
var hoverApi = require('./index.js');

/*global process*/
var hover = new hoverApi(process.env.HOVERUSER, process.env.HOVERAPIKEY);

hover.getAllDns()
	.then( data => { console.log(data); } )
	.catch( err => { console.log(err); });