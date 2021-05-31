/**
 *  The $N Multistroke Recognizer
 *
 *  This version was slightly modified for evaluation purposes:
 *    1. All example gestures have been removed;
 *    2. The Unistroke constructor has been extended with resamplingPoints;
 *    3. The Multistroke constructor has been extended with resamplingPoints;
 *    4. All functions and global variables have been pre-fixed with '$N_'.
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
 *  Lisa Anthony, Ph.D.
 *  UMBC
 *  Information Systems Department
 *  1000 Hilltop Circle
 *  Baltimore, MD 21250
 *  lanthony@umbc.edu
 *
 *  Jacob O. Wobbrock, Ph.D.
 *  The Information School
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  wobbrock@uw.edu
 *
 * The academic publications for the $N recognizer, and what should be
 * used to cite it, are:
 *
 *     Anthony, L. and Wobbrock, J.O. (2010). A lightweight multistroke
 *     recognizer for user interface prototypes. Proceedings of Graphics
 *     Interface (GI '10). Ottawa, Ontario (May 31-June 2, 2010). Toronto,
 *     Ontario: Canadian Information Processing Society, pp. 245-252.
 *     https://dl.acm.org/citation.cfm?id=1839258
 *
 *     Anthony, L. and Wobbrock, J.O. (2012). $N-Protractor: A fast and
 *     accurate multistroke recognizer. Proceedings of Graphics Interface
 *     (GI '12). Toronto, Ontario (May 28-30, 2012). Toronto, Ontario:
 *     Canadian Information Processing Society, pp. 117-120.
 *     https://dl.acm.org/citation.cfm?id=2305296
 *
 * The Protractor enhancement was separately published by Yang Li and programmed
 * here by Jacob O. Wobbrock and Lisa Anthony:
 *
 *     Li, Y. (2010). Protractor: A fast and accurate gesture
 *     recognizer. Proceedings of the ACM Conference on Human
 *     Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *     (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *     https://dl.acm.org/citation.cfm?id=1753654
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2011, Jacob O. Wobbrock and Lisa Anthony.
 * All rights reserved. Last updated July 14, 2018.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of UMBC nor the University of Washington,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Lisa Anthony OR Jacob O. Wobbrock
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
**/
//
// Point class
//
function $N_Point(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function $N_Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Unistroke class: a unistroke template
//
function $N_Unistroke(name, useBoundedRotationInvariance, points, resamplingPoints, useProtractor) // constructor
{
	this.Name = name;
	this.Points = $N_Resample(points.slice(0, points.length), resamplingPoints);
	var radians = $N_IndicativeAngle(this.Points);
	this.Points = $N_RotateBy(this.Points, -radians);
	this.Points = $N_ScaleDimTo(this.Points, $N_SquareSize, $N_OneDThreshold);
	if (useBoundedRotationInvariance)
		this.Points = $N_RotateBy(this.Points, +radians); // restore
	this.Points = $N_TranslateTo(this.Points, $N_Origin);
	this.StartUnitVector = $N_CalcStartUnitVector(this.Points, resamplingPoints / 8);
	if (useProtractor) this.Vector = $N_Vectorize(this.Points, useBoundedRotationInvariance); // for Protractor
}
//
// Multistroke class: a container for unistrokes
//
function $N_Multistroke(name, useBoundedRotationInvariance, strokes, resamplingPoints, useProtractor) // constructor
{
	this.Name = name;
	this.NumStrokes = strokes.length; // number of individual strokes

	var order = new Array(strokes.length); // array of integer indices
	for (var i = 0; i < strokes.length; i++)
		order[i] = i; // initialize
	var orders = new Array(); // array of integer arrays
	$N_HeapPermute(strokes.length, order, /*out*/ orders);

	var unistrokes = $N_MakeUnistrokes(strokes, orders); // returns array of point arrays
	this.Unistrokes = new Array(unistrokes.length); // unistrokes for this multistroke
	for (var j = 0; j < unistrokes.length; j++)
		this.Unistrokes[j] = new $N_Unistroke(name, useBoundedRotationInvariance, unistrokes[j], resamplingPoints, useProtractor);
}
//
// Result class
//
function $N_Result(name, score, ms) // constructor
{
	this.Name = name;
	this.Score = score;
	this.Time = ms;
}
//
// NDollarRecognizer constants
//
const $N_SquareSize = 250.0;
const $N_OneDThreshold = 0.25; // customize to desired gesture set (usually 0.20 - 0.35)
const $N_Origin = new $N_Point(0,0);
const $N_Diagonal = Math.sqrt($N_SquareSize * $N_SquareSize + $N_SquareSize * $N_SquareSize);
const $N_HalfDiagonal = 0.5 * $N_Diagonal;
const $N_AngleRange = Deg2Rad(45.0);
const $N_AnglePrecision = Deg2Rad(2.0);
const $N_Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
const $N_AngleSimilarityThreshold = Deg2Rad(30.0);
//
// NDollarRecognizer class
//
function NDollarRecognizer(resamplingPoints, useBoundedRotationInvariance, useProtractor) // constructor
{
  this.UseProtractor = useProtractor;
  this.useBoundedRotationInvariance = useBoundedRotationInvariance;
  this.ResamplingPoints = resamplingPoints;
	this.Multistrokes = new Array();
	//
	// The $N Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
	//
	this.Recognize = function(strokes, requireSameNoOfStrokes)
	{
		const t0 = performance.now(); // start timer
		var points = $N_CombineStrokes(strokes); // make one connected unistroke from the given strokes
		var candidate = new $N_Unistroke("", this.UseBoundedRotationInvariance, points, this.ResamplingPoints, this.UseProtractor);
    const t1 = performance.now(); // intermediate timer
		var u = -1;
		var b = +Infinity;
		for (var i = 0; i < this.Multistrokes.length; i++) // for each multistroke template
		{
			if (!requireSameNoOfStrokes || strokes.length == this.Multistrokes[i].NumStrokes) // optional -- only attempt match when same # of component strokes
			{
				for (var j = 0; j < this.Multistrokes[i].Unistrokes.length; j++) // for each unistroke within this multistroke
				{
					if ($N_AngleBetweenUnitVectors(candidate.StartUnitVector, this.Multistrokes[i].Unistrokes[j].StartUnitVector) <= $N_AngleSimilarityThreshold) // strokes start in the same direction
					{
						var d;
						if (this.UseProtractor)
							d = $N_OptimalCosineDistance(this.Multistrokes[i].Unistrokes[j].Vector, candidate.Vector); // Protractor
						else
							d = $N_DistanceAtBestAngle(candidate.Points, this.Multistrokes[i].Unistrokes[j], -$N_AngleRange, +$N_AngleRange, $N_AnglePrecision); // Golden Section Search (original $N)
						if (d < b) {
							b = d; // best (least) distance
							u = i; // multistroke owner of unistroke
						}
					}
				}
			}
		}
		const t2 = performance.now(); // stop timer
		return (u == -1) ? ['No match', t1 - t0, t2 - t1, t2 - t0] : [this.Multistrokes[u].Name, t1 - t0, t2 - t1, t2 - t0];
	}
	this.AddGesture = function(name, strokes)
	{
    const t0 = performance.now(); // start timer
		this.Multistrokes[this.Multistrokes.length] = new $N_Multistroke(name, this.UseBoundedRotationInvariance, strokes, this.ResamplingPoints, this.UseProtractor);
		var num = 0;
		for (var i = 0; i < this.Multistrokes.length; i++) {
			if (this.Multistrokes[i].Name == name)
				num++;
		}
    const t1 = performance.now(); // start timer
		return [num, t1 - t0];
	}
	this.DeleteUserGestures = function()
	{
		this.Multistrokes.length = 0; // clear any beyond the original set
		return 0;
	}
}
//
// Private helper functions from here on down
//
function $N_HeapPermute(n, order, /*out*/ orders)
{
	if (n == 1) {
		orders[orders.length] = order.slice(); // append copy
	} else {
		for (var i = 0; i < n; i++)
		{
			$N_HeapPermute(n - 1, order, orders);
			if (n % 2 == 1) { // swap 0, n-1
				var tmp = order[0];
				order[0] = order[n - 1];
				order[n - 1] = tmp;
			} else { // swap i, n-1
				var tmp = order[i];
				order[i] = order[n - 1];
				order[n - 1] = tmp;
			}
		}
	}
}
function $N_MakeUnistrokes(strokes, orders)
{
	var unistrokes = new Array(); // array of point arrays
	for (var r = 0; r < orders.length; r++)
	{
		for (var b = 0; b < Math.pow(2, orders[r].length); b++) // use b's bits for directions
		{
			var unistroke = new Array(); // array of points
			for (var i = 0; i < orders[r].length; i++)
			{
				var pts;
				if (((b >> i) & 1) == 1)  // is b's bit at index i on?
					pts = strokes[orders[r][i]].slice().reverse(); // copy and reverse
				else
					pts = strokes[orders[r][i]].slice(); // copy
				for (var p = 0; p < pts.length; p++)
					unistroke[unistroke.length] = pts[p]; // append points
			}
			unistrokes[unistrokes.length] = unistroke; // add one unistroke to set
		}
	}
	return unistrokes;
}
function $N_CombineStrokes(strokes)
{
	var points = new Array();
	for (var s = 0; s < strokes.length; s++) {
		for (var p = 0; p < strokes[s].length; p++)
			points[points.length] = new $N_Point(strokes[s][p].X, strokes[s][p].Y);
	}
	return points;
}
function $N_Resample(points, n)
{
	var I = $N_PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = $N_Distance(points[i-1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i-1].X + ((I - D) / d) * (points[i].X - points[i-1].X);
			var qy = points[i-1].Y + ((I - D) / d) * (points[i].Y - points[i-1].Y);
			var q = new $N_Point(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	if (newpoints.length == n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new $N_Point(points[points.length - 1].X, points[points.length - 1].Y);
	return newpoints;
}
function $N_IndicativeAngle(points)
{
	var c = $N_Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function $N_RotateBy(points, radians) // rotates points around centroid
{
	var c = $N_Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new $N_Point(qx, qy);
	}
	return newpoints;
}
function $N_ScaleDimTo(points, size, ratio1D) // scales bbox uniformly for 1D, non-uniformly for 2D
{
	var B = $N_BoundingBox(points);
	var uniformly = Math.min(B.Width / B.Height, B.Height / B.Width) <= ratio1D; // 1D or 2D gesture test
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = uniformly ? points[i].X * (size / Math.max(B.Width, B.Height)) : points[i].X * (size / B.Width);
		var qy = uniformly ? points[i].Y * (size / Math.max(B.Width, B.Height)) : points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new $N_Point(qx, qy);
	}
	return newpoints;
}
function $N_TranslateTo(points, pt) // translates points' centroid
{
	var c = $N_Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new $N_Point(qx, qy);
	}
	return newpoints;
}
function $N_Vectorize(points, useBoundedRotationInvariance) // for Protractor
{
	var cos = 1.0;
	var sin = 0.0;
	if (useBoundedRotationInvariance) {
		var iAngle = Math.atan2(points[0].Y, points[0].X);
		var baseOrientation = (Math.PI / 4.0) * Math.floor((iAngle + Math.PI / 8.0) / (Math.PI / 4.0));
		cos = Math.cos(baseOrientation - iAngle);
		sin = Math.sin(baseOrientation - iAngle);
	}
	var sum = 0.0;
	var vector = new Array();
	for (var i = 0; i < points.length; i++) {
		var newX = points[i].X * cos - points[i].Y * sin;
		var newY = points[i].Y * cos + points[i].X * sin;
		vector[vector.length] = newX;
		vector[vector.length] = newY;
		sum += newX * newX + newY * newY;
	}
	var magnitude = Math.sqrt(sum);
	for (var i = 0; i < vector.length; i++)
		vector[i] /= magnitude;
	return vector;
}
function $N_OptimalCosineDistance(v1, v2) // for Protractor
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
function $N_DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = $N_Phi * a + (1.0 - $N_Phi) * b;
	var f1 = $N_DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - $N_Phi) * a + $N_Phi * b;
	var f2 = $N_DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2) {
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = $N_Phi * a + (1.0 - $N_Phi) * b;
			f1 = $N_DistanceAtAngle(points, T, x1);
		} else {
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - $N_Phi) * a + $N_Phi * b;
			f2 = $N_DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}
function $N_DistanceAtAngle(points, T, radians)
{
	var newpoints = $N_RotateBy(points, radians);
	return $N_PathDistance(newpoints, T.Points);
}
function $N_Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new $N_Point(x, y);
}
function $N_BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	return new $N_Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function $N_PathDistance(pts1, pts2) // average distance between corresponding points in two paths
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += $N_Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function $N_PathLength(points) // length traversed by a point path
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += $N_Distance(points[i-1], points[i]);
	return d;
}
function $N_Distance(p1, p2) // distance between two points
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function $N_CalcStartUnitVector(points, index) // start angle from points[0] to points[index] normalized as a unit vector
{
	var v = new $N_Point(points[index].X - points[0].X, points[index].Y - points[0].Y);
	var len = Math.sqrt(v.X * v.X + v.Y * v.Y);
	return new $N_Point(v.X / len, v.Y / len);
}
function $N_AngleBetweenUnitVectors(v1, v2) // gives acute angle between unit vectors from (0,0) to v1, and (0,0) to v2
{
	var n = (v1.X * v2.X + v1.Y * v2.Y);
	var c = Math.max(-1.0, Math.min(1.0, n)); // ensure [-1,+1]
	return Math.acos(c); // arc cosine of the vector dot product
}
function Deg2Rad(d) { return (d * Math.PI / 180.0); }
