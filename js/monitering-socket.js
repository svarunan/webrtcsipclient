var monitering_socket = io(CONF.sockerServer,{transports:['websocket']});
monitering_socket.on('connect', function(){
  console.info(monitering_socket.id + ': Accept-->');
  monitering_socket.emit('server', "Hello server!");
});
monitering_socket.on('disconnect', function(){
	console.warn('socket disconnected....');
});
monitering_socket.on('client', function(data){
	console.info(data);
});