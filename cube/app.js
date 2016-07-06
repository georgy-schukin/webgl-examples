"use strict";

var gl;
var vertexBuffer, indexBuffer, colorBuffer;
var numOfIndices;
var program;
var modelviewMatrix, projectionMatrix;
var frameCounter = 0;

function initGL() {
	gl.clearColor(0.0, 0.0, 0.2, 1.0);	
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
}

function resizeCanvas() {
	var displayWidth = gl.canvas.clientWidth;
	var displayHeight = gl.canvas.clientHeight;

	gl.canvas.width = displayWidth;
	gl.canvas.height = displayHeight;

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function initMVP() {
	modelviewMatrix = mat4.create();
	mat4.lookAt(modelviewMatrix, [10.0, 10.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

	projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix, Math.PI/5, gl.canvas.clientWidth/gl.canvas.clientHeight, 0.01, 1000.0);	
}

function initProgram() {
	try {
		program = WGL.createProgramFromScripts(gl, "vert-shader", "frag-shader");
	} 
	catch (err) {		
		alert(err.toString());
	}
}

function initCube() {
	var vertices = new Float32Array([
    	-1.0, -1.0, -1.0,
     	 1.0, -1.0, -1.0,
    	 1.0, -1.0,  1.0,
    	-1.0, -1.0,  1.0,
     	-1.0,  1.0, -1.0,
     	 1.0,  1.0, -1.0,
    	 1.0,  1.0,  1.0,
    	-1.0,  1.0,  1.0]);

	var colors = new Float32Array([
		1.0, 0.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 0.0, 1.0,
		1.0, 1.0, 0.0,
		1.0, 0.0, 1.0,
		0.0, 1.0, 1.0, 
		0.5, 0.0, 0.5,
		0.0, 0.5, 0.5]);

	var indices = new Uint16Array([
		0, 1, 2, // bottom
		0, 2, 3,
		0, 1, 5, // side 1
		0, 5, 4,
		1 ,2, 6, // side 2
		1, 6, 5,
		2, 3, 7, // side 3
		2, 7, 6,
		3, 0, 4, // side 4
		3, 4, 7,
		4, 5, 6, // top
		4, 6, 7]);

	numOfIndices = indices.length;

	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function drawGL() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	

	gl.useProgram(program);

	var modelviewLocation = gl.getUniformLocation(program, "u_modelview");
	var projectionLocation = gl.getUniformLocation(program, "u_projection");
	var transparencyLocation = gl.getUniformLocation(program, "u_transparency");

	gl.uniformMatrix4fv(modelviewLocation, false, modelviewMatrix);	
	gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);	
	
	var currTransparency = 0.5*Math.cos(Math.PI*(frameCounter++)/360.0) + 0.5;
	gl.uniform1f(transparencyLocation, currTransparency);

	var positionLocation = gl.getAttribLocation(program, "a_position");
	var colorLocation = gl.getAttribLocation(program, "a_color");

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.enableVertexAttribArray(colorLocation);
	gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);	

	gl.drawElements(gl.TRIANGLES, numOfIndices, gl.UNSIGNED_SHORT, 0);			
}

function update() {
	mat4.rotate(modelviewMatrix, modelviewMatrix, -Math.PI/180.0, [0, 1, 0]);
}

function init() {
	try {
		gl = WGL.getGLContextFromCanvas("canvas");
		if (!gl) {
			alert("No WebGL!");
		}
	} 
	catch (err) {
		alert(err.toString());
	}	
	initGL();
	initMVP();
	initProgram();
	initCube();
	resizeCanvas();
}

function render() {
	requestAnimationFrame(render);		
	drawGL();	
	update();
}
