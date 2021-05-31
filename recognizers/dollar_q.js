/**
 * The $Q Super-Quick Recognizer
 *
 *  This version was slightly modified for evaluation purposes:
 *    1. All example gestures have been removed;
 *    2. The PointCloud constructor has been extended with resamplingPoints;
 *    3. The QDollarRecognizer constructor has been extended with resamplingPoints;
 *    4. All functions and global variables have been pre-fixed with '$Q_'.
 *
 *  Author of the modifications:
 *    Nathan Magrofuoco
 *    Université catholique de Louvain
 *    Louvain Research Institute in Management and Organizations
 *    Louvain-la-Neuve, Belgium
 *    nathan.magrofuoco@uclouvain.be
 *
 *  Original $Q authors (C# version):
 *
 *  Radu-Daniel Vatavu, Ph.D.
 *  University Stefan cel Mare of Suceava
 *  Suceava 720229, Romania
 *  radu.vatavu@usm.ro
 *
 *  Lisa Anthony, Ph.D.
 *  Department of CISE
 *  University of Florida
 *  Gainesville, FL, USA 32611
 *  lanthony@cise.ufl.edu
 *
 *  Jacob O. Wobbrock, Ph.D.
 *  The Information School | DUB Group
 *  University of Washington
 *  Seattle, WA, USA 98195-2840
 *  wobbrock@uw.edu
 *
 * The academic publication for the $Q recognizer, and what should be
 * used to cite it, is:
 *
 *    Vatavu, R.-D., Anthony, L. and Wobbrock, J.O. (2018). $Q: A super-quick,
 *    articulation-invariant stroke-gesture recognizer for low-resource devices.
 *    Proceedings of the ACM Conference on Human-Computer Interaction with Mobile
 *    Devices and Services (MobileHCI '18). Barcelona, Spain (September 3-6, 2018).
 *    New York: ACM Press. Article No. 23.
 *    https://dl.acm.org/citation.cfm?id=3229434.3229465
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (c) 2018-2019, Nathan Magrofuoco, Jacob O. Wobbrock, Radu-Daniel Vatavu,
 * and Lisa Anthony. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University Stefan cel Mare of Suceava,
 *      University of Washington, nor University of Florida, nor the names of its
 *      contributors may be used to endorse or promote products derived from this
 *      software without specific prior written permission.
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
function $Q_Point(x, y, id) // constructor
{
	this.X = x;
	this.Y = y;
	this.ID = id;  // stroke ID to which this point belongs (1,2,3,etc.)
	this.IntX = 0; // for indexing into the LUT
	this.IntY = 0; // for indexing into the LUT
}
//
// PointCloud class
//
function $Q_PointCloud(name, points, resamplingPoints) // constructor
{
	this.Name = name;
	this.Points = $Q_Resample(points.slice(0, points.length), resamplingPoints);
	this.Points = $Q_Scale(this.Points);
	this.Points = $Q_TranslateTo(this.Points, $P_Origin);
	this.Points = $Q_MakeIntCoords(this.Points); // fills in (IntX, IntY) values
	this.LUT = $Q_ComputeLUT(this.Points);
}
//
// Result class
//
function $Q_Result(name, score, ms) // constructor
{
	this.Name = name;
	this.Score = score;
	this.Time = ms;
}
//
// QDollarRecognizer constants
//
const $Q_Origin = new $Q_Point(0,0,0);
const $Q_MaxIntCoord = 1024; // (IntX, IntY) range from [0, $Q_MaxIntCoord - 1]
const $Q_LUTSize = 64; // default size of the lookup table is 64 x 64
const $Q_LUTScaleFactor = $Q_MaxIntCoord / $Q_LUTSize; // used to scale from (IntX, IntY) to LUT
//
// QDollarRecognizer class
//
function QDollarRecognizer(resamplingPoints) // constructor
{
	this.ResamplingPoints = resamplingPoints;
	this.PointClouds = new Array();
	//
	// The $Q Point-Cloud Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), DeleteUserGestures()
	//
	this.Recognize = function(points)
	{
		const t0 = performance.now(); // start timer
		var candidate = new $Q_PointCloud("", points, this.ResamplingPoints);
    const t1 = performance.now(); // intermediate timer
		var u = -1;
		var b = +Infinity;
		for (var i = 0; i < this.PointClouds.length; i++) // for each point-cloud template
		{
			var d = $Q_CloudMatch(candidate, this.PointClouds[i], b);
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
		this.PointClouds[this.PointClouds.length] = new $Q_PointCloud(name, points, this.ResamplingPoints);
		var num = 0;
		for (var i = 0; i < this.PointClouds.length; i++) {
			if (this.PointClouds[i].Name == name)
				num++;
		}
    const t1 = performance.now(); // stop timer
		return [num, t1 - t0];
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
function $Q_CloudMatch(candidate, template, minSoFar)
{
	var n = candidate.Points.length;
	var step = Math.floor(Math.pow(n, 0.5));

	var LB1 = $Q_ComputeLowerBound(candidate.Points, template.Points, step, template.LUT);
	let LB2 = $Q_ComputeLowerBound(template.Points, candidate.Points, step, candidate.LUT);

	for (var i = 0, j = 0; i < n; i += step, j++) {
		if (LB1[j] < minSoFar)
			minSoFar = Math.min(minSoFar, $Q_CloudDistance(candidate.Points, template.Points, i, minSoFar));
		if (LB2[j] < minSoFar)
			minSoFar = Math.min(minSoFar, $Q_CloudDistance(template.Points, candidate.Points, i, minSoFar));
	}
	return minSoFar;
}
function $Q_CloudDistance(pts1, pts2, start, minSoFar)
{
	var n = pts1.length;
	var unmatched = new Array(); // indices for pts2 that are not matched
	for (var j = 0; j < n; j++)
		unmatched[j] = j;
	var i = start;  // start matching with point 'start' from pts1
	var weight = n; // weights decrease from n to 1
	var sum = 0.0;  // sum distance between the two clouds
	do
	{
		var u = -1;
		var b = +Infinity;
		for (var j = 0; j < unmatched.length; j++)
		{
			d = $Q_SqrEuclideanDistance(pts1[i], pts2[unmatched[j]]);
			if (d < b) {
				b = d;
				u = j;
			}
		}
		unmatched.splice(u, 1); // remove item at index 'u'
		sum += weight * b;
		if (sum >= minSoFar)
			return sum; // early abandoning
		weight--;
		i = (i + 1) % n;
	} while (i != start);
	return sum;
}
function $Q_ComputeLowerBound(pts1, pts2, step, LUT)
{
	var n = pts1.length;
	var LB = new Array(Math.floor(n / step) + 1);
	var SAT = new Array(n);
	LB[0] = 0.0;
	for (var i = 0; i < n; i++)
	{
		var x = Math.round(pts1[i].IntX / $Q_LUTScaleFactor);
		var y = Math.round(pts1[i].IntY / $Q_LUTScaleFactor);
		var index = LUT[x][y];
		var d = $Q_SqrEuclideanDistance(pts1[i], pts2[index]);
		SAT[i] = (i == 0) ? d : SAT[i - 1] + d;
		LB[0] += (n - i) * d;
	}
	for (var i = step, j = 1; i < n; i += step, j++)
		LB[j] = LB[0] + i * SAT[n-1] - n * SAT[i-1];
	return LB;
}
function $Q_Resample(points, n)
{
	var I = $Q_PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		if (points[i].ID == points[i-1].ID)
		{
			var d = $Q_EuclideanDistance(points[i-1], points[i]);
			if ((D + d) >= I)
			{
				var qx = points[i-1].X + ((I - D) / d) * (points[i].X - points[i-1].X);
				var qy = points[i-1].Y + ((I - D) / d) * (points[i].Y - points[i-1].Y);
				var q = new $Q_Point(qx, qy, points[i].ID);
				newpoints[newpoints.length] = q; // append new point 'q'
				points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
				D = 0.0;
			}
			else D += d;
		}
	}
	if (newpoints.length == n - 1) // sometimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new $Q_Point(points[points.length - 1].X, points[points.length - 1].Y, points[points.length - 1].ID);
	return newpoints;
}
function $Q_Scale(points)
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
		newpoints[newpoints.length] = new $Q_Point(qx, qy, points[i].ID);
	}
	return newpoints;
}
function $Q_TranslateTo(points, pt) // translates points' centroid to pt
{
	var c = $Q_Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new $Q_Point(qx, qy, points[i].ID);
	}
	return newpoints;
}
function $Q_Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new $Q_Point(x, y, 0);
}
function $Q_PathLength(points) // length traversed by a point path
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++) {
		if (points[i].ID == points[i-1].ID)
			d += $Q_EuclideanDistance(points[i-1], points[i]);
	}
	return d;
}
function $Q_MakeIntCoords(points)
{
	for (var i = 0; i < points.length; i++) {
		points[i].IntX = Math.round((points[i].X + 1.0) / 2.0 * ($Q_MaxIntCoord - 1));
		points[i].IntY = Math.round((points[i].Y + 1.0) / 2.0 * ($Q_MaxIntCoord - 1));
	}
	return points;
}
function $Q_ComputeLUT(points)
{
	var LUT = new Array();
	for (var i = 0; i < $Q_LUTSize; i++)
		LUT[i] = new Array();

	for (var x = 0; x < $Q_LUTSize; x++)
	{
		for (var y = 0; y < $Q_LUTSize; y++)
		{
			var u = -1;
			var b = +Infinity;
			for (var i = 0; i < points.length; i++)
			{
				var row = Math.round(points[i].IntX / $Q_LUTScaleFactor);
				var col = Math.round(points[i].IntY / $Q_LUTScaleFactor);
				var d = ((row - x) * (row - x)) + ((col - y) * (col - y));
				if (d < b) {
					b = d;
					u = i;
				}
			}
      		LUT[x][y] = u;
    	}
	}
  	return LUT;
}
function $Q_SqrEuclideanDistance(pt1, pt2)
{
	var dx = pt2.X - pt1.X;
	var dy = pt2.Y - pt1.Y;
	return (dx * dx + dy * dy);
}
function $Q_EuclideanDistance(pt1, pt2)
{
	var s = $Q_SqrEuclideanDistance(pt1, pt2);
	return Math.sqrt(s);
}
