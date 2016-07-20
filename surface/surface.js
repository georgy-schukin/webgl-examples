"use strict";

var gl;
var buffers = {};
var matrices = {};
var program;
var shift = 0.0;
var surfaceMeshPointsNum = 101;
var surfaceMeshSize = 100.0;

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

function initSurface() {
	var surface = WGL.makePlane(surfaceMeshPointsNum, surfaceMeshPointsNum);

	mat4.identity(matrices.modelMatrix);
	mat4.scale(matrices.modelMatrix, matrices.modelMatrix, [surfaceMeshSize, 1, surfaceMeshSize]);

	initBuffers();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.vertices), gl.STATIC_DRAW);		

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surface.indices), gl.STATIC_DRAW);

	buffers.numOfIndices = surface.indices.length;	
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
	var projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix");			

	gl.uniformMatrix4fv(modelMatrixLocation, false, matrices.modelMatrix);	
	gl.uniformMatrix4fv(viewMatrixLocation, false, matrices.viewMatrix);		
	gl.uniformMatrix4fv(projectionMatrixLocation, false, matrices.projectionMatrix);			

	var lightPosLocation = gl.getUniformLocation(program, "u_light_pos");
	var light_pos = vec4.create();
	vec4.set(light_pos, 0.0, 100.0, 0.0, 1.0);
	vec4.transformMat4(light_pos, light_pos, matrices.viewMatrix);
	gl.uniform4fv(lightPosLocation, light_pos);

	var positionLocation = gl.getAttribLocation(program, "a_position");	

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);		

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);	

	gl.drawElements(gl.TRIANGLES, buffers.numOfIndices, gl.UNSIGNED_SHORT, 0);			
}

function rotateModel() {
	mat4.rotate(matrices.viewMatrix, matrices.viewMatrix, Math.PI/(4*180.0), [0, 1, 0]);
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
	initSurface();
}

function render() {	
	WGL.fitViewportToCanvas(gl);	
	drawGL();	
	rotateModel();
	requestAnimationFrame(render);		
}

function setMeshSize(size) {
	surfaceMeshSize = size;
	initSurface();
}

function setMeshPoints(num) {
	surfaceMeshPointsNum = num;
	initSurface();
}
