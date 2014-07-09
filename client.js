// TODO: Añadir comprobación de nombre de usuario repetido

var readline = require('readline'),
socketio = require('socket.io-client'),
util = require('util'),
color = require("ansi-color").set;

var usuario;
var socket = socketio.connect('http://localhost:3000');
var rl = readline.createInterface(process.stdin, process.stdout);

rl.question("Introduzca un nombre de usuario: ", function(nombre) {
	usuario = nombre;
	var mensaje = usuario + " ha entrado al chat";
	socket.emit('enviar', {
		tipo : 'info',
		contenido : mensaje
	});

	// Al introducir el nombre de usuario se crea una sala con dicho nombre,
	// para posteriormente poder enviar mensajes privados sin filtrar en el
	// cliente
	socket.emit('entrar', {
		usuario : usuario
	});

	rl.prompt(true);
});

rl.on('line', function(linea) {
	if (linea[0] == "/" && linea.length > 1) {
		var cmd = linea.match(/[a-z]+\b/)[0];
		var arg = linea.substr(cmd.length + 2, linea.length);
		comando(cmd, arg);
	} else {
		socket.emit('enviar', {
			tipo : 'chat',
			contenido : linea,
			usuario : usuario
		});
		rl.prompt(true);
	}
}).on('close', function() {
	socket.emit('enviar', {
		tipo : 'info',
		contenido : usuario + " ha salido del chat"
	});
	process.exit(0);
});

function consola(msg) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	console.log(msg);
	rl.prompt(true);
}

function comando(cmd, arg) {
	switch (cmd) {
	case 'nombre':
		var informacion = usuario + " ha cambiado su nombre a " + arg;
		// Cuando un usuario cambia de nombre mandamos un evento al servidor
		// para que cambie la sala privada registrada
		socket.emit('cambio', {
			anterior : usuario,
			nuevo : arg
		});
		// TODO:Esto se movería a un socket.on dependiendo del evento que mande el
		// server si existe el usuario o no
		usuario = arg;
		socket.emit('enviar', {
			tipo : 'info',
			contenido : informacion
		});
		break;
	case 'mensaje':
		var destino = arg.match(/[a-z]+\b/)[0];
		var mensaje = arg.substr(destino.length, arg.length);
		socket.emit('enviar', {
			tipo : 'privado',
			contenido : mensaje,
			a : destino,
			de : usuario
		});
		break;
	case 'yo':
		var emote = usuario + " " + arg;
		socket.emit('enviar', {
			tipo : 'emote',
			contenido : emote
		});
		break;
	case 'seguro':
		var destino = arg.match(/[a-z]+\b/)[0];
		var mensaje = arg.substr(destino.length, arg.length);
		socket.emit('enviarSeguro', {
			contenido : mensaje,
			a : destino,
			de : usuario
		});
		break;
	default:
		consola("Comando inválido.");
	}
	rl.prompt(true);
}

//Probar el anidado de .on
socket.on('mensaje', function(data) {
	var encabezado;
	if (data.tipo == 'chat' && data.usuario != usuario) {
		encabezado = color("<" + data.usuario + "> ", "green");
		consola(encabezado + data.contenido);
	} else if (data.tipo == "info") {
		consola(color(data.contenido, 'cyan'));
	} else if (data.tipo == "privado" && data.a == usuario) {
		encabezado = color("[" + data.de + "->" + data.a + "] ", "red");
		consola(encabezado + data.contenido);
	} else if (data.tipo == "emote") {
		consola(color(data.contenido, "cyan"));
	}
}).on('mensajeSeguro', function(data) {
	var encabezado = color("[" + data.de + "->" + data.a + "] ", "blue");
	consola(encabezado + data.contenido);
});
