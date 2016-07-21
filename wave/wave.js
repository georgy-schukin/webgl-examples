"use strict";

var gl;
var buffers = {};
var matrices = {};
var program;
var shift = 0.0;
var waveMeshPointsNum = 101;
var waveMeshSize = 100.0;
var useAnalyticalNormals = true;

function initGL() {
	gl.clearColor(0.0, 0.0, 0.2, 1.0);	
	gl.enable(gl.DEPTH_TEST);
}

function initMatrices() {
	matrices.modelMatrix = mat4.create();	
	mat4.identity(matrices.modelMatrix);

	matrices.viewMatrix = mat4.create();
	mat4.lookAt(matrices.viewMatrix, [100.0, 100.0, 100.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);	

	matrices.projectionMatrix = mat4.create();
	mat4.perspective(matrices.projectionMatrix, Math.PI/5, gl.canvas.clientWidth/gl.canvas.clientHeight, 0.01, 1000.0);	
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
	for (var i = 0; i < numOfPointsByY; i++) {
		for (var j = 0; j < numOfPointsByX; j++) {
			var x = originByX + j*stepByX;
			var y = originByY + i*stepByY;			
			var z = surfaceFunc.f(x, y);
			vertices.push(x); 
			vertices.push(z); 
			vertices.push(y); 						
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
		indices: indices
	}	
}

function generateAnalyticalNormals(surfaceFunc, vertices) {
	var normals = [];
	for (var i = 0; i < vertices.length; i += 3) {
		var x = vertices[i];
		var y = vertices[i + 2];
		var dfdx = surfaceFunc.dfdx(x, y);
		var dfdy = surfaceFunc.dfdy(x, y);								
		normals.push(-dfdx);
		normals.push(1.0);
		normals.push(-dfdy);
	}
	return normals;
}

function makeWave(meshSize, numOfPoints, shift) {
	var surfaceFunc = {
		f: function (x, y) {			
			return 2.0*Math.sin((x*x + y*y)*0.01 - shift);				
		},
		dfdx: function (x, y) {			
			return 0.04*x*Math.cos((x*x + y*y)*0.01 - shift);
		},
		dfdy: function (x, y) {			
			return 0.04*y*Math.cos((x*x + y*y)*0.01 - shift);
		}
	}
	
	var wave = makeSurface(surfaceFunc, 
		-meshSize/2, -meshSize/2, 
		numOfPoints, numOfPoints, 
		meshSize/(numOfPoints - 1), meshSize/(numOfPoints - 1));		
	if (useAnalyticalNormals) {
		wave.normals = generateAnalyticalNormals(surfaceFunc, wave.vertices);
	} else {
		wave.normals = WGL.generateSmoothNormals(wave.vertices, wave.indices);
	}
	return wave;
}

function initBuffers() {
	if (buffers.vertexBuffer === undefined) {
		buffers.vertexBuffer = gl.createBuffer();
	}	
	if (buffers.normalBuffer === undefined) {
		buffers.normalBuffer = gl.createBuffer();
	}
	if (buffers.indexBuffer === undefined) {
		buffers.indexBuffer = gl.createBuffer();
	}
}

function initWave(shift) {
	var wave = makeWave(waveMeshSize, waveMeshPointsNum, shift);

	initBuffers();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wave.vertices), gl.STATIC_DRAW);	
	
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wave.normals), gl.STATIC_DRAW);	

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

	var modelMatrixLocation = gl.getUniformLocation(program, "u_modelMatrix");
	var viewMatrixLocation = gl.getUniformLocation(program, "u_viewMatrix");
	var modelviewMatrixLocation = gl.getUniformLocation(program, "u_modelviewMatrix");
	var mvpMatrixLocation = gl.getUniformLocation(program, "u_mvpMatrix");	
	var normalMatrixLocation = gl.getUniformLocation(program, "u_normalMatrix");		

	var modelviewMatrix = mat4.create();
	mat4.multiply(modelviewMatrix, matrices.viewMatrix, matrices.modelMatrix);	
	var mvpMatrix = mat4.create();
	mat4.multiply(mvpMatrix, matrices.projectionMatrix, modelviewMatrix);
	var normalMatrix = getNormalMatrix(modelviewMatrix);

	gl.uniformMatrix4fv(modelMatrixLocation, false, matrices.modelMatrix);	
	gl.uniformMatrix4fv(viewMatrixLocation, false, matrices.viewMatrix);	
	gl.uniformMatrix4fv(modelviewMatrixLocation, false, modelviewMatrix);	
	gl.uniformMatrix4fv(mvpMatrixLocation, false, mvpMatrix);		
	gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);		

	var lightPosLocation = gl.getUniformLocation(program, "u_light_pos");
	var light_pos = vec4.create();
	vec4.set(light_pos, 0.0, 100.0, 0.0, 1.0);
	vec4.transformMat4(light_pos, light_pos, matrices.viewMatrix);
	gl.uniform4fv(lightPosLocation, light_pos);

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

function rotateModel() {
	mat4.rotate(matrices.modelMatrix, matrices.modelMatrix, -Math.PI/(4*180.0), [0, 1, 0]);
}

function updateWave() {	
	initWave(shift);	
	shift += 0.2;
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
	initMatrices();
	initProgram();
	updateWave();
}

function render() {	
	WGL.fitViewportToCanvas(gl);	
	drawGL();	
	rotateModel();
	requestAnimationFrame(render);		
}

function setMeshSize(size) {
	waveMeshSize = size;
}

function setMeshPoints(num) {
	waveMeshPointsNum = num;
}

function toggleAnalyticalNormals(use) {
	useAnalyticalNormals = use;
}