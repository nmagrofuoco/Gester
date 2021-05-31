/**
 * The $1 Unistroke Recognizer
 *
 *  This version was slightly modified for evaluation purposes:
 *    1. All example gestures have been removed;
 *    2. The Unistroke constructor has been extended with resamplingPoints;
 *    3. All functions and global variables have been pre-fixed with '$1_'.
 *
 *  Author of the modifications:
 *    Nathan Magrofuoco
 *    Université catholique de Louvain
 *    Louvain Research Institute in Management and Organizations
 *    Louvain-la-Neuve, Belgium
 *    nathan.magrofuoco@uclouvain.be
 *
 *  Original Javascript version:
 *
 *  Jacob O. Wobbrock, Ph.D.
 *  The Information School
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  wobbrock@uw.edu
 *
 *  Andrew D. Wilson, Ph.D.
 *  Microsoft Research
 *  One Microsoft Way
 *  Redmond, WA 98052
 *  awilson@microsoft.com
 *
 *  Yang Li, Ph.D.
 *  Department of Computer Science and Engineering
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  yangli@cs.washington.edu
 *
 * The academic publication for the $1 recognizer, and what should be
 * used to cite it, is:
 *
 *     Wobbrock, J.O., Wilson, A.D. and Li, Y. (2007). Gestures without
 *     libraries, toolkits or training: A $1 recognizer for user interface
 *     prototypes. Proceedings of the ACM Symposium on User Interface
 *     Software and Technology (UIST '07). Newport, Rhode Island (October
 *     7-10, 2007). New York: ACM Press, pp. 159-168.
 *     https://dl.acm.org/citation.cfm?id=1294238
 *
 * The Protractor enhancement was separately published by Yang Li and programmed
 * here by Jacob O. Wobbrock:
 *
 *     Li, Y. (2010). Protractor: A fast and accurate gesture
 *     recognizer. Proceedings of the ACM Conference on Human
 *     Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *     (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *     https://dl.acm.org/citation.cfm?id=1753654
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved. Last updated July 14, 2018.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
 * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
//
// Point class
//
function $1_Point(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function $1_Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Unistroke class: a unistroke template
//
function $1_Unistroke(name, points, resamplingPoints, useProtractor) // constructor
{
	this.Name = name;
	this.Points = $1_Resample(points.slice(0, points.length), resamplingPoints);
	var radians = $1_IndicativeAngle(this.Points);
	this.Points = $1_RotateBy(this.Points, -radians);
	this.Points = $1_ScaleTo(this.Points, $1_SquareSize);
	this.Points = $1_TranslateTo(this.Points, $1_Origin);
	if (useProtractor) this.Vector = $1_Vectorize(this.Points); // for Protractor
}
//
// DollarRecognizer constants
//
const $1_SquareSize = 250.0;
const $1_Origin = new $1_Point(0,0);
const $1_Diagonal = Math.sqrt($1_SquareSize * $1_SquareSize + $1_SquareSize * $1_SquareSize);
const $1_Half$1_Diagonal = 0.5 * $1_Diagonal;
const $1_AngleRange = $1_Deg2Rad(45.0);
const $1_AnglePrecision = $1_Deg2Rad(2.0);
const $1_Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
//
// DollarRecognizer class
//
function DollarRecognizer(resamplingPoints, useProtractor) // constructor
{
	this.ResamplingPoints = resamplingPoints;
  this.UseProtractor = useProtractor;
	this.Unistrokes = new Array();
	//
	// The $1 Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
	//
	this.Recognize = function(points)
	{
		const t0 = performance.now(); // start timer
		var candidate = new $1_Unistroke("", points, this.ResamplingPoints, this.UseProtractor);
    const t1 = performance.now(); // intermediate timer
		var u = -1;
		var b = +Infinity;
		for (var i = 0; i < this.Unistrokes.length; i++) // for each unistroke template
		{
			var d;
			if (this.UseProtractor)
				d = $1_OptimalCosineDistance(this.Unistrokes[i].Vector, candidate.Vector); // Protractor
			else
				d = $1_DistanceAtBestAngle(candidate.Points, this.Unistrokes[i], -$1_AngleRange, +$1_AngleRange, $1_AnglePrecision); // Golden Section Search (original $1)
			if (d < b) {
				b = d; // best (least) distance
				u = i; // unistroke index
			}
		}
		const t2 = performance.now(); // stop timer
		return (u == -1) ? ['No match', t1 - t0, t2 - t1, t2 - t0] : [this.Unistrokes[u].Name, t1 - t0, t2 - t1, t2 - t0];
	}
	this.AddGesture = function(name, points)
	{
    const t0 = performance.now(); // start timer
		this.Unistrokes[this.Unistrokes.length] = new $1_Unistroke(name, points, this.ResamplingPoints, this.UseProtractor); // append new unistroke
		var num = 0;
		for (var i = 0; i < this.Unistrokes.length; i++) {
			if (this.Unistrokes[i].Name == name)
				num++;
		}
    const t1 = performance.now(); // stop timer
		return [num, t1 - t0];
	}
	this.DeleteUserGestures = function()
	{
		this.Unistrokes.length = 0; // clear any beyond the original set
		return 0;
	}
}
//
// Private helper functions from here on down
//
function $1_Resample(points, n)
{
	var I = $1_PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = $1_Distance(points[i-1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i-1].X + ((I - D) / d) * (points[i].X - points[i-1].X);
			var qy = points[i-1].Y + ((I - D) / d) * (points[i].Y - points[i-1].Y);
			var q = new $1_Point(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	if (newpoints.length == n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new $1_Point(points[points.length - 1].X, points[points.length - 1].Y);
	return newpoints;
}
function $1_IndicativeAngle(points)
{
	var c = $1_Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function $1_RotateBy(points, radians) // rotates points around centroid
{
	var c = $1_Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new $1_Point(qx, qy);
	}
	return newpoints;
}
function $1_ScaleTo(points, size) // non-uniform scale; assumes 2D gestures (i.e., no lines)
{
	var B = $1_BoundingBox(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X * (size / B.Width);
		var qy = points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new $1_Point(qx, qy);
	}
	return newpoints;
}
function $1_TranslateTo(points, pt) // translates points' centroid
{
	var c = $1_Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new $1_Point(qx, qy);
	}
	return newpoints;
}
function $1_Vectorize(points) // for Protractor
{
	var sum = 0.0;
	var vector = new Array();
	for (var i = 0; i < points.length; i++) {
		vector[vector.length] = points[i].X;
		vector[vector.length] = points[i].Y;
		sum += points[i].X * points[i].X + points[i].Y * points[i].Y;
	}
	var magnitude = Math.sqrt(sum);
	for (var i = 0; i < vector.length; i++)
		vector[i] /= magnitude;
	return vector;
}
function $1_OptimalCosineDistance(v1, v2) // for Protractor
{
	var a = 0.0;
	var b = 0.0;
	for (var i = 0; i < v1.length; i += 2) {
		a += v1[i] * v2[i] + v1[i+1] * v2[i+1];
		b += v1[i] * v2[i+1] - v1[i+1] * v2[i];
	}
	var angle = Math.atan(b / a);
	return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
}
function $1_DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = $1_Phi * a + (1.0 - $1_Phi) * b;
	var f1 = $1_DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - $1_Phi) * a + $1_Phi * b;
	var f2 = $1_DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2) {
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = $1_Phi * a + (1.0 - $1_Phi) * b;
			f1 = $1_DistanceAtAngle(points, T, x1);
		} else {
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - $1_Phi) * a + $1_Phi * b;
			f2 = $1_DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}
function $1_DistanceAtAngle(points, T, radians)
{
	var newpoints = $1_RotateBy(points, radians);
	return $1_PathDistance(newpoints, T.Points);
}
function $1_Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new $1_Point(x, y);
}
function $1_BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	return new $1_Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function $1_PathDistance(pts1, pts2)
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += $1_Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function $1_PathLength(points)
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += $1_Distance(points[i - 1], points[i]);
	return d;
}
function $1_Distance(p1, p2)
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function $1_Deg2Rad(d) { return (d * Math.PI / 180.0); }
