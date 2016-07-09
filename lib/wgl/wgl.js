"use strict";

var WGL = WGL || {};

(function (wgl) {

function getGLContextFromCanvas(canvasId) {
	var gl = null;
	try {
		canvasId = canvasId || "canvas"; // set default canvas id if necessary
		var canvas = document.getElementById(canvasId);	
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	catch (e) {
		throw "Error creating WebGL context: " + e.toString();
	}	
	return gl;
}

function compileShader(gl, shaderSource, shaderType) {  
	var shader = gl.createShader(shaderType);  

	gl.shaderSource(shader, shaderSource);  

	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!success) {    
		throw "Could not compile shader: " + gl.getShaderInfoLog(shader);
	}
	return shader;
}	

function createProgram(gl, shaders) {	
	var program = gl.createProgram();
	
	shaders.forEach( function (shader) {
		gl.attachShader(program, shader);	
	});	

	gl.linkProgram(program);	
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!success) {	  
	  	throw "Program filed to link: " + gl.getProgramInfoLog(program);
	}
	return program;
}

function createProgramFromScripts(gl, vertexShaderId, fragmentShaderId) {
	var vertexShaderSource = document.getElementById(vertexShaderId).text;
	var fragmentShaderSource = document.getElementById(fragmentShaderId).text;
	var vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
	var fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
	return createProgram(gl, [vertexShader, fragmentShader]);
}

function fitViewportToCanvas(gl) {
	var displayWidth = gl.canvas.clientWidth;
	var displayHeight = gl.canvas.clientHeight;

	if (gl.canvas.width != displayWidth || gl.canvas.height != displayHeight) {
		gl.canvas.width = displayWidth;
		gl.canvas.height = displayHeight;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
}

wgl.getGLContextFromCanvas = getGLContextFromCanvas;
wgl.compileShader = compileShader;
wgl.createProgram = createProgram;
wgl.createProgramFromScripts = createProgramFromScripts;
wgl.fitViewportToCanvas = fitViewportToCanvas;
	
})(WGL);