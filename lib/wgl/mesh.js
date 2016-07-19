"use strict";

var WGL = WGL || {};

(function (wgl) {

/**
 * Generate smooth normals for a given mesh.
 * @param vertices - flat array of vertex coordinates x, y, z.
 * @param indices - flat array of vertex indices, 3 indices per triangle.
 */
function generateSmoothNormals(vertices, indices) {	
	// Find which triangles belong to which vertices.
	var trianglesPerVertex = [];	
	for (var i = 0; i < indices.length; i++) {
		var triangleIndex = Math.floor(i/3);
		var index = indices[i];	
		if (!(index in trianglesPerVertex)) {
			trianglesPerVertex[index] = [];
		}
		trianglesPerVertex[index].push(triangleIndex);
	}
	// Compute one face normal for each triangle.
	var faceNormals = [];	
	for (var i = 0; i < indices.length; i += 3) {	
		var normal = computeFaceNormal(vertices, indices[i], indices[i + 1], indices[i + 2]);
		var triangleIndex = Math.floor(i/3);
		faceNormals[triangleIndex] = normal;
	}
	// Compute one smooth normal for each vertex.
	var normals = [];
	var numOfVertices = Math.floor(vertices.length / 3);
	for (var vIndex = 0; vIndex < numOfVertices; vIndex++) {
		var triangles = trianglesPerVertex[vIndex];
		var normal = vec3.fromValues(0.0, 0.0, 0.0);
		if (triangles !== null && triangles !== undefined)	{
			triangles.forEach( function (tIndex) {
				vec3.add(normal, normal, faceNormals[tIndex]);
			});
		}
		normals.push(normal[0]);
		normals.push(normal[1]);
		normals.push(normal[2]);
	}	
	return normals;
}

/**
 * Compute face normal for a given triangle.
 * @param vertices - flat array of vertex coordinates x, y, z.
 * @param i1, i2, i3 - indices of the triangle's vertices in the vertices array.
 */
function computeFaceNormal(vertices, i1, i2, i3) {	
	var x1 = vertices[3*i1];
	var y1 = vertices[3*i1 + 1];
	var z1 = vertices[3*i1 + 2];
	var x2 = vertices[3*i2];
	var y2 = vertices[3*i2 + 1];
	var z2 = vertices[3*i2 + 2];
	var x3 = vertices[3*i3];
	var y3 = vertices[3*i3 + 1];
	var z3 = vertices[3*i3 + 2];
	var v1 = vec3.fromValues(x2 - x1, y2 - y1, z2 - z1);
	var v2 = vec3.fromValues(x3 - x1, y3 - y1, z3 - z1);	
	var cross = vec3.create();
	vec3.cross(cross, v1, v2);
	return cross;
}

wgl.generateSmoothNormals = generateSmoothNormals;	

})(WGL);