/**
 * The $P Point-Cloud Recognizer
 *
 *  This version was slightly modified for evaluation purposes:
 *    1. All example gestures have been removed;
 *    2. The PointCloud constructor has been extended with resamplingPoints;
 *    3. The PDollarRecognizer constructor has been extended with resamplingPoints;
 *    4. All functions and global variables have been pre-fixed with '$P_'.
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
 *  Radu-Daniel Vatavu, Ph.D.
 *  University Stefan cel Mare of Suceava
 *  Suceava 720229, Romania
 *  vatavu@eed.usv.ro
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
 * The academic publication for the $P recognizer, and what should be
 * used to cite it, is:
 *
 *     Vatavu, R.-D., Anthony, L. and Wobbrock, J.O. (2012).
 *     Gestures as point clouds: A $P recognizer for user interface
 *     prototypes. Proceedings of the ACM Int'l Conference on
 *     Multimodal Interfaces (ICMI '12). Santa Monica, California
 *     (October 22-26, 2012). New York: ACM Press, pp. 273-280.
 *     https://dl.acm.org/citation.cfm?id=2388732
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2012, Radu-Daniel Vatavu, Lisa Anthony, and
 * Jacob O. Wobbrock. All rights reserved. Last updated July 14, 2018.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University Stefan cel Mare of Suceava,
 *	University of Washington, nor UMBC, nor the names of its contributors
 *	may be used to endorse or promote products derived from this software
 *	without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Radu-Daniel Vatavu OR Lisa Anthony
 * OR Jacob O. Wobbrock BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
 * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
**/
//
// Point class
//
function $P_Point(x, y, id) // constructor
{
	this.X = x;
	this.Y = y;
	this.ID = id; // stroke ID to which this point belongs (1,2,3,etc.)
}
//
// PointCloud class: a point-cloud template
//
function $P_PointCloud(name, points, resamplingPoints) // constructor
{
	this.Name = name;
	this.Points = $P_Resample(points.slice(0, points.length), resamplingPoints);
	this.Points = $P_Scale(this.Points);
	this.Points = $P_TranslateTo(this.Points, $P_Origin);
}
//
// PDollarRecognizer constants
//
const $P_Origin = new $P_Point(0,0,0);
//
// PDollarRecognizer class
//
function PDollarRecognizer(resamplingPoints) // constructor
{
	this.ResamplingPoints = resamplingPoints;
	this.PointClouds = new Array();
	//
	// The $P Point-Cloud Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), DeleteUserGestures()
	//
	this.Recognize = function(points)
	{
		const t0 = performance.now(); // start timer
		var candidate = new $P_PointCloud("", points, this.ResamplingPoints);
    const t1 = performance.now(); // intermediate timer
		var u = -1;
		var b = +Infinity;
		for (var i = 0; i < this.PointClouds.length; i++) // for each point-cloud template
		{
			var d = $P_GreedyCloudMatch(candidate.Points, this.PointClouds[i]);
			if (d < b) {
				b = d; // best (least) distance
				u = i; // point-cloud index
			}
		}
  	const t2 = performance.now(); // stop timer
		return (u == -1) ? ['No match', t1 - t0, t2 - t1, t2 - t0] : [this.PointClouds[u].Name, t1 - t0, t2 - t1, t2 - t0];
	}
	this.AddGesture = function(name, points)
	{
    const t0 = performance.now(); // start timer
		this.PointClouds[this.PointClouds.length] = new $P_PointCloud(name, points, this.ResamplingPoints);
		var num = 0;
		for (var i = 0; i < this.PointClouds.length; i++) {
			if (this.PointClouds[i].Name == name)
				num++;
		}
    const t1 = performance.now(); // stop timer
		return [num, t1- t0];
	}
	this.DeleteUserGestures = function()
	{
		this.PointClouds.length = 0; // clears any beyond the original set
		return 0;
	}
}
//
// Private helper functions from here on down
//
function $P_GreedyCloudMatch(points, P)
{
	var e = 0.50;
	var step = Math.floor(Math.pow(points.length, 1.0 - e));
	var min = +Infinity;
	for (var i = 0; i < points.length; i += step) {
		var d1 = $P_CloudDistance(points, P.Points, i);
		var d2 = $P_CloudDistance(P.Points, points, i);
		min = Math.min(min, Math.min(d1, d2)); // min3
	}
	return min;
}
function $P_CloudDistance(pts1, pts2, start)
{
	var matched = new Array(pts1.length); // pts1.length == pts2.length
	for (var k = 0; k < pts1.length; k++)
		matched[k] = false;
	var sum = 0;
	var i = start;
	do
	{
		var index = -1;
		var min = +Infinity;
		for (var j = 0; j < matched.length; j++)
		{
			if (!matched[j]) {
				var d = $P_Distance(pts1[i], pts2[j]);
				if (d < min) {
					min = d;
					index = j;
				}
			}
		}
		matched[index] = true;
		var weight = 1 - ((i - start + pts1.length) % pts1.length) / pts1.length;
		sum += weight * min;
		i = (i + 1) % pts1.length;
	} while (i != start);
	return sum;
}
function $P_Resample(points, n)
{
	var I = $P_PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		if (points[i].ID == points[i-1].ID)
		{
			var d = $P_Distance(points[i-1], points[i]);
			if ((D + d) >= I)
			{
				var qx = points[i-1].X + ((I - D) / d) * (points[i].X - points[i-1].X);
				var qy = points[i-1].Y + ((I - D) / d) * (points[i].Y - points[i-1].Y);
				var q = new $P_Point(qx, qy, points[i].ID);
				newpoints[newpoints.length] = q; // append new point 'q'
				points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
				D = 0.0;
			}
			else D += d;
		}
	}
	if (newpoints.length == n - 1) // sometimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new $P_Point(points[points.length - 1].X, points[points.length - 1].Y, points[points.length - 1].ID);
	return newpoints;
}
function $P_Scale(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	var size = Math.max(maxX - minX, maxY - minY);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - minX) / size;
		var qy = (points[i].Y - minY) / size;
		newpoints[newpoints.length] = new $P_Point(qx, qy, points[i].ID);
	}
	return newpoints;
}
function $P_TranslateTo(points, pt) // translates points' centroid to pt
{
	var c = $P_Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new $P_Point(qx, qy, points[i].ID);
	}
	return newpoints;
}
function $P_Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new $P_Point(x, y, 0);
}
function $P_PathLength(points) // length traversed by a point path
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++) {
		if (points[i].ID == points[i-1].ID)
			d += $P_Distance(points[i-1], points[i]);
	}
	return d;
}
function $P_Distance(p1, p2) // Euclidean distance between two points
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
