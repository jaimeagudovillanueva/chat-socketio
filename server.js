var socketio = require('socket.io');
var io = socketio.listen(3000);

io.sockets.on('connection', function (socket) {

	socket.on('enviar', function (data) {
        io.sockets.emit('mensaje', data);
    }).on('entrar', function (data) {
      // TODO:Comprobar si ya existe usuario o no y mandar un evento en cada caso
	    socket.join(data.usuario);
	}).on('cambio', function (data) {
    // TODO:Comprobar si ya existe usuario o no y mandar un evento en cada caso
    socket.leave(data.anterior);
    socket.join(data.nuevo);
  }).on('enviarSeguro', function (data) {
	// Seguramente se pueda enviar como un 'mensaje' normal siempre que se
	// incluyan los mismos atributos en el json que con el mensaje privado
    	io.to(data.a).emit('mensajeSeguro', data)
    });
});
