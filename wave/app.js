"use strict";

var gl;
var buffers = {};
var program;
var modelviewMatrix, projectionMatrix;
var frameCounter = 0;

function initGL() {
	gl.clearColor(0.0, 0.0, 0.2, 1.0);	
	gl.enable(gl.DEPTH_TEST);
}

function initMVP() {
	modelviewMatrix = mat4.create();
	mat4.lookAt(modelviewMatrix, [100.0, 100.0, 100.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);	

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

function makeWave(originByX, originByZ, numOfPointsByX, numOfPointsByZ, stepByX, stepByZ) {
	var vertices = [];

	for (var i = 0; i < numOfPointsByZ; i++) {
		for (var j = 0; j < numOfPointsByX; j++) {
			vertices.push(originByZ + i*stepByZ); // x
			vertices.push(0); // y - will be computed in shader
			vertices.push(originByX + j*stepByX); // z
		}
	}		

	var indices = [];

	for (var i = 0; i < numOfPointsByZ - 1; i++) {
		for (var j = 0; j < numOfPointsByX - 1; j++) {
			indices.push(i*numOfPointsByX + j); // first triangle
			indices.push((i + 1)*numOfPointsByX + j);
			indices.push((i + 1)*numOfPointsByX + j + 1);
			indices.push(i*numOfPointsByX + j); // second triangle
			indices.push((i + 1)*numOfPointsByX + j + 1);
			indices.push(i*numOfPointsByX + j + 1);
		}
	}		

	return {
		vertices: vertices,		
		indices: indices
	}	
}

function initWave() {
	var pointsByX = 101;
	var pointsByZ = 101;
	var wave = makeWave(-50, -50, pointsByX, pointsByZ, 100/(pointsByX - 1), 100/(pointsByZ - 1));
	
	buffers = {}

	buffers.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wave.vertices), gl.STATIC_DRAW);	

	buffers.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wave.indices), gl.STATIC_DRAW);

	buffers.numOfIndices = wave.indices.length;	
}

function drawGL() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	

	gl.useProgram(program);

	var modelviewLocation = gl.getUniformLocation(program, "u_modelview");
	var projectionLocation = gl.getUniformLocation(program, "u_projection");	
	var shiftLocation = gl.getUniformLocation(program, "u_shift");

	gl.uniformMatrix4fv(modelviewLocation, false, modelviewMatrix);	
	gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);	

	gl.uniform1f(shiftLocation, (frameCounter++)/10.0);

	var positionLocation = gl.getAttribLocation(program, "a_position");

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);	

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);	

	gl.drawElements(gl.TRIANGLES, buffers.numOfIndices, gl.UNSIGNED_SHORT, 0);			
}

function update() {
	mat4.rotate(modelviewMatrix, modelviewMatrix, -Math.PI/(4*180.0), [0, 1, 0]);
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
	initWave();	
}

function render() {	
	WGL.fitViewportToCanvas(gl);
	drawGL();	
	update();
	requestAnimationFrame(render);		
}
