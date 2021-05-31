/**
 *  Penny Pincher
 *  A blazing fast, highly accurate $-family recognizer
 *
 *  This Javascript version was developed by:
 *    Nathan Magrofuoco
 *    Université catholique de Louvain
 *    Louvain Research Institute in Management and Organizations
 *    Louvain-la-Neuve, Belgium
 *    nathan.magrofuoco@uclouvain.be
 *
 *  Based on work by Felix on 28.07.15 originally implemented in Swift.
 *  Copyright © 2015 betriebsraum. All rights reserved.
 *
 *  The academic publication for the Penny Pincher recognizer, and what should be
 *  used to cite it, is:
 *
 *    Eugene M. Taranta and Joseph J. LaViola. 2015. Penny pincher: a blazing
 *    fast, highly accurate $-family recognizer. In Proceedings of the 41st
 *    Graphics Interface Conference (GI '15). Canadian Information Processing
 *    Society, CAN, 195–202.
 *
 **/

// Point class constructor
const Penny_Point = function (x, y) {
	this.x = x;
	this.y = y;
}

// Gesture class constructor
const Penny_Gesture = function (vectors, gestureName = '') {
  this.name = gestureName;
  this.vectors = vectors;
}

// PennyPincherRecognizer constructor
function PennyPincherRecognizer(resamplingPoints) {
  this.resamplingPoints = resamplingPoints;
  this.templates = [];
}

PennyPincherRecognizer.prototype.addTemplate = function (points, gestureName) {
	const t0 = performance.now(); // start timer
	this.templates.push(
		new Penny_Gesture(
      this.resampleBetweenPoints(points.slice(0, points.length)),
      gestureName
    )
	);
	const t1 = performance.now(); // stop timer
	return [this.templates.length, t1 - t0];
}

PennyPincherRecognizer.prototype.recognize = function (points) {
	let t0 = performance.now(); // start timer
	let maxDissimilarity = -Infinity;
	let bestTemplate = -1;
	const candidate = new Penny_Gesture(
    this.resampleBetweenPoints(points.slice(0, points.length))
  );
	const t1 = performance.now(); // intermediate timer
	// match the candidate with each stored template
	for (let t = 0; t < this.templates.length; t += 1) {
		const dissimilarity = this.matching(candidate.vectors, this.templates[t].vectors);
		if (dissimilarity > maxDissimilarity) {
			maxDissimilarity = dissimilarity;
			bestTemplate = t;
		}
	}
	const t2 = performance.now(); // stop timer
	return (bestTemplate == -1) ?
    ['No match', t1 - t0, t2 - t1, t2 - t0] :
    [this.templates[bestTemplate].name, t1 - t0, t2 - t1, t2 - t0];
}

PennyPincherRecognizer.prototype.resampleBetweenPoints = function (points, resamplingPoints) {
	let int = this.pathLength(points) / (this.resamplingPoints - 1);
	let vectors = [];
	let dist = 0.0;
	let prev = points[0];
	const origin = new Penny_Point(0, 0);
	for (let i = 1; i < points.length; i += 1) {
		const dist2 = this.euclideanDistance(points[i - 1], points[i]);
		if ((dist + dist2) >= int) {
			const qX = points[i - 1].x + ((int - dist) / dist2) * (points[i].x - points[i - 1].x);
			const qY = points[i - 1].y + ((int - dist) / dist2) * (points[i].y - points[i - 1].y);
			const q = new Penny_Point(qX, qY);
			let r = new Penny_Point(q.x - prev.x, q.y - prev.y);
			const dist3 = this.euclideanDistance(r, origin);
			r = new Penny_Point(r.x / dist3, r.y / dist3);
			vectors.push(r);
			points.splice(i, 0, q);
			dist = 0.0;
			prev = q;
	 }
	 else dist += dist2;
	}
	if (vectors.length == this.resamplingPoints - 2) // sometimes we fall a rounding-error short of adding the last point, so add it if so
		vectors.push(
			new Penny_Point(vectors[vectors.length - 1].x, vectors[vectors.length - 1].y)
		);
	return vectors;
}

PennyPincherRecognizer.prototype.pathLength = function (points) {
	let d = 0.0;
	for (let i = 1; i < points.length; i+=1)
 		d += this.euclideanDistance(points[i - 1], points[i]);
	return d;
}

PennyPincherRecognizer.prototype.euclideanDistance = function (p1, p2) {
	const dX = p2.x - p1.x;
	const dY = p2.y - p1.y;
	return Math.sqrt(dX * dX + dY * dY);
}

PennyPincherRecognizer.prototype.matching = function (vectors1, vectors2) {
	let dissimilarity = 0;
	for (let i = 0; i < vectors1.length - 1; i += 1)
		dissimilarity += vectors1[i].x * vectors2[i].x + vectors1[i].y * vectors2[i].y;
	return dissimilarity;
}
