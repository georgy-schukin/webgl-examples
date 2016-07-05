"use strict";

var WGL = WGL || {};

(function (wgl) {

function getGLContext(canvasId) {
	var gl = null;
	try {
		var canvas = document.getElementById(canvasId);	
		gl = canvas.getContext("experimental-webgl");		
	}
	catch (e) {
		alert("Error creating WebGL context: " + e.toString());
	}	
	return gl;
}

function compileShader(gl, shaderSource, shaderType) {  
	var shader = gl.createShader(shaderType);  

	gl.shaderSource(shader, shaderSource);  

	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!success) {    
		throw "Could not compile shader:" + gl.getShaderInfoLog(shader);
	}
	return shader;
}	

function createProgram(gl, vertexShader, fragmentShader) {	
	var program = gl.createProgram();
	
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);	
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!success) {	  
	  	throw ("Program filed to link:" + gl.getProgramInfoLog(program));
	}
	return program;
}

wgl.getGLContext = getGLContext;
wgl.compileShader = compileShader;
wgl.createProgram = createProgram;
	
})(WGL);