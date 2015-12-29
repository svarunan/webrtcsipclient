var socket = io(CONF.sockerServer,{transports:['websocket']},{secure: true});
var socketDisconnect = 0;
socket.on('connect', function(){
  console.info(socket.id + ': Accept-->');
  socket.emit('server', "Hello server!");
});
socket.on('disconnect', function(){
	console.warn('socket disconnected....');
	socketDisconnect = socketDisconnect + 1;
});
socket.on('client', function(data){
		if(socketDisconnect != 0 && phoneInstances.length != 0){
			if(phoneInstances[0].isRegistered() != true){
				engine.network_disconnect();
				console.log(' network_disconnect, So reinitializing sipengine....');
			}
		}else{
			console.info(data);
		}
});
socket.on('sms', function(data){
	document.getElementById('sms_status').innerHTML = data;
});
socket.on('fax', function(data){
	document.getElementById('fax_status').innerHTML = data;
});