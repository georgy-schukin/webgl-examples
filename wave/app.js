"use strict";

var gl;
var buffers = {};
var program;
var modelviewMatrix, projectionMatrix;
var shift = 0.0;

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

function makeSurface(surfaceFunc, originByX, originByY, numOfPointsByX, numOfPointsByY, stepByX, stepByY) {
	var vertices = [];
	var normals = [];
	var h = 1e-5;

	for (var i = 0; i < numOfPointsByY; i++) {
		for (var j = 0; j < numOfPointsByX; j++) {
			var x = originByX + j*stepByX;
			var y = originByY + i*stepByY;			
			var z = surfaceFunc(x + shift, y + shift);
			vertices.push(x); 
			vertices.push(z); 
			vertices.push(y); 
			var dfdx = (surfaceFunc(x + h, y) - z)/h; // df/dx approximation
			var dfdy = (surfaceFunc(x, y + h) - z)/h; // df/dy approximation
			normals.push(dfdx);
			normals.push(-1);
			normals.push(dfdy);
		}
	}		

	var indices = [];

	for (var i = 0; i < numOfPointsByY - 1; i++) {
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
		normals: normals,
		indices: indices
	}	
}

function initWave(shift) {
	var surfaceFunc = function (x, y) {
		return Math.sin(x + shift)*Math.cos(y + shift);
	}

	var pointsByX = 101;
	var pointsByZ = 101;
	var wave = makeSurface(surfaceFunc, -50, -50, pointsByX, pointsByZ, 100/(pointsByX - 1), 100/(pointsByZ - 1));
	
	buffers = {}

	buffers.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wave.vertices), gl.STATIC_DRAW);	

	buffers.normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wave.normals), gl.STATIC_DRAW);	

	buffers.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wave.indices), gl.STATIC_DRAW);

	buffers.numOfIndices = wave.indices.length;	
}

function getNormalMatrix(modelviewMatrix) {
	var normalMatrix = mat3.create();
	mat3.fromMat4(normalMatrix, modelviewMatrix);
	mat3.invert(normalMatrix, normalMatrix);
	mat3.transpose(normalMatrix, normalMatrix);
	return normalMatrix;
}

function drawGL() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	

	gl.useProgram(program);

	var modelviewMatrixLocation = gl.getUniformLocation(program, "u_modelviewMatrix");
	var projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix");	
	var normalMatrixLocation = gl.getUniformLocation(program, "u_normalMatrix");		

	gl.uniformMatrix4fv(modelviewMatrixLocation, false, modelviewMatrix);	
	gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);		
	gl.uniformMatrix3fv(normalMatrixLocation, false, getNormalMatrix(modelviewMatrix));		

	var positionLocation = gl.getAttribLocation(program, "a_position");
	var normalLocation = gl.getAttribLocation(program, "a_normal");

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);	

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
	gl.enableVertexAttribArray(normalLocation);
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);	

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);	

	gl.drawElements(gl.TRIANGLES, buffers.numOfIndices, gl.UNSIGNED_SHORT, 0);			
}

function updateView() {
	mat4.rotate(modelviewMatrix, modelviewMatrix, -Math.PI/(4*180.0), [0, 1, 0]);
}

function updateWave() {	
	initWave(shift);	
	shift += 0.1;
	setTimeout(updateWave, 100);
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
	updateWave();
}

function render() {	
	WGL.fitViewportToCanvas(gl);
	drawGL();	
	updateView();
	requestAnimationFrame(render);		
}
