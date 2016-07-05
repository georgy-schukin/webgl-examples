"use strict";

var gl = null;

function makeCube() {
	var points = new Float32Array([
        	-1.0, -1.0,
         	1.0, -1.0,
        	-1.0,  1.0,
        	-1.0,  1.0,
         	1.0, -1.0,
         	1.0,  1.0]);
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
}

function initGL() {
	gl.clearColor(0.0, 0.0, 0.2, 1.0);	
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

function drawGL() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function init() {
	gl = WGL.getGLContext("canvas");
	initGL();
}

function render() {
	requestAnimationFrame(render);
	drawGL();
}