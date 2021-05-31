/**
 *  Gester
 *  An automated evaluation tool for gesture recognition techniques.
 *
 *  Nathan Magrofuoco
 *  Université catholique de Louvain
 *  Louvain Research Institute in Management and Organizations
 *  Louvain-la-Neuve, Belgium
 *  nathan.magrofuoco@uclouvain.be
 *
 *  Jean Vanderdonckt
 *  Université catholique de Louvain
 *  Louvain Research Institute in Management and Organizations
 *  Institute of Information and Communication Technologies, Electronics and
 *  Applied Mathematics
 *  Louvain-la-Neuve, Belgium
 *  jean.vanderdonckt@uclouvain.be
 *
 *  Paolo Roselli
 *  Università degli Studi di Roma "Tor Vergata"
 *  Rome, Italy
 *  roselli@mat.uniroma2.it
 *
 *  The academic publication for Gester, and what should be
 *  used to cite it, is:
 *
 *    In press.
 *
 *  This software is distributed under the "BSD 3-Clause License" agreement:
 *
 *  Copyright (c) 2021, Nathan Magrofuoco, Jean Vanderdonckt, and Paolo Roselli
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  1. Redistributions of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder nor the names of its
 *     contributors may be used to endorse or promote products derived from
 *     this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 *  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 *  DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 *  SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 *  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 *  OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 *  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 **/

// availalbe recognizers: [name, required number of templates per class]
const RECOGNIZERS = [
  ['Rubine', 2],
  ['$1', 1],
  ['Protractor', 1],
  ['$N', 1],
  ['$N-Protractor', 1],
  ['$P', 1],
  ['Penny Pincher', 1],
  ['$P+', 1],
  ['Jackknife-ED', 1],
  ['Jackknife-IP', 1],
  ['$Q', 1],
  ['!FTL', 1],
  ['!NFTL', 1],
  ['uV', 1],
  ['uF', 1]
];

// set to true if the evaluation procedure must be run
const PROCEDURES = [
  true, // User-Dependent Dataset-Dependent (UDDD)
  false, // User-Independent Dataset-Dependent (UIDD)
  false, // User-Dependent Dataset-Independent (UDDI)
  false  // User-Independent Dataset-Independent (UIDI)
]

// setup the sample for all configured recognizers
const setupSample = function (paths, participant, name) {
  let newPaths = [];
  // initialize an empty array for each recognizer
  for (let r = 0; r < RECOGNIZERS.length; r += 1) {
    newPaths[r] = [];
  }
  // fill in each array with the relevant Point object
  for (let r = 0; r < RECOGNIZERS.length; r += 1) {
    let pathIndex = 0, strokeIndex = 0;
    // loop through all gesture paths
    for (const [pathName, path] of Object.entries(paths)) {
      // uF requires one array per path since it supports multi-path recognition
      if (RECOGNIZERS[r][0] == 'uF') {
        newPaths[r][pathIndex] = [];
      }
      // $N and $N-Protractor require one array per stroke
      else if (RECOGNIZERS[r][0] == '$N' || RECOGNIZERS[r][0] == '$N-Protractor') {
        newPaths[r][strokeIndex] = [];
      }
      for (let p = 0; p < path.strokes.length; p += 1) {
        // setup the relevant Point object for each recognizer
        const newPoint = setupPoint(path.strokes[p], RECOGNIZERS[r][0]);
        // for uF: point is mapped to the current path
        if (RECOGNIZERS[r][0] == 'uF') {
          newPaths[r][pathIndex].push(newPoint);
        }
        // for $N and $N-Protractor: point is mapped to the current stroke
        else if (RECOGNIZERS[r][0] == '$N' || RECOGNIZERS[r][0] == '$N-Protractor') {
          if (strokeIndex != path.strokes[p].stroke_id) {
            strokeIndex = path.strokes[p].stroke_id;
            newPaths[r][strokeIndex] = [newPoint]; // new array for new stroke
          }
          else {
            newPaths[r][strokeIndex].push(newPoint); // add to stroke array
          }
        }
        // otherwise, multi-paths are considered as a uni⁻path
        else {
          newPaths[r].push(newPoint);
        }
      }
    }
    pathIndex += 1; // next path
  }
  // setup the relevant sample for each recognizer
  let sample = new Map();
  for (let r = 0; r < RECOGNIZERS.length; r += 1) {
    // Jackknife require a Sample object for each sample
    if (RECOGNIZERS[r][0] == 'Jackknife-ED' || RECOGNIZERS[r][0] == 'Jackknife-IP') {
      let jackknifeSample = new Sample(participant, name, 0);
      jackknifeSample.add_trajectory(newPaths[r]);
      sample.set(RECOGNIZERS[r][0], jackknifeSample);
    }
    // all the other recognizers simply expect an array of points
    // (or an array of array of points for $N and $N-Protractor)
    else {
      sample.set(RECOGNIZERS[r][0], newPaths[r]);
    }
  }
  return sample;
}

// setup the relevant Point object for each recognizer
const setupPoint = function (point, recognizer) {
  // make sure all coordinates are considered as float or integer
  point.x = parseFloat(point.x);
  point.y = parseFloat(point.y);
  //point.z = parseFloat(point.z); // uncomment for 3D gestures
  point.stroke_id = parseInt(point.stroke_id);
  // search for the right recognizer
  switch (recognizer) {
    case 'Rubine': return new Rubine_Point(point.x, point.y, point.t);
    case '$1': return new $1_Point(point.x, point.y);
    case 'Protractor': return new $1_Point(point.x, point.y);
    case '$N': return new $N_Point(point.x, point.y);
    case '$N-Protractor': return new $N_Point(point.x, point.y);
    case '$P': return new $P_Point(point.x, point.y, point.stroke_id);
    case 'Penny Pincher': return new Penny_Point(point.x, point.y);
    case '$P+': return new $PP_Point(point.x, point.y, point.stroke_id);
    case 'Jackknife-ED': return new Vector([point.x, point.y]);
    case 'Jackknife-IP': return new Vector([point.x, point.y]);
    case '$Q': return new $Q_Point(point.x, point.y, point.stroke_id);
    case '!FTL': return new FTL_Point(point.x, point.y, point.stroke_id);
    case '!NFTL': return new FTL_Point(point.x, point.y, point.stroke_id);
    case 'uV': return new uV_Point(point.x, point.y, point.stroke_id);
    case 'uF': return new uF_Point([point.x, point.y], point.stroke_id);
  }
}

// setup the relevant Recognizer object for each recognizer
const setupRecognizer = function (recognizer, N) {
  // search for the right recognizer
  switch (recognizer) {
    case 'Rubine': return new RubineRecognizer();
    case '$1': return new DollarRecognizer(N, false);
    case 'Protractor': return new DollarRecognizer(N, true);
    case '$N': return new NDollarRecognizer(N, false, false);
    case '$N-Protractor': return new NDollarRecognizer(N, false, true);
    case '$P': return new PDollarRecognizer(N);
    case 'Penny Pincher': return new PennyPincherRecognizer(N);
    case '$P+': return new PDollarPlusRecognizer(N);
    case 'Jackknife-ED':
      let bladesEd = new jackknife_blades(N);
      bladesEd.set_ed_defaults(N);
      return new Jackknife(bladesEd);
    case 'Jackknife-IP':
      let bladesIp = new jackknife_blades(N);
      bladesIp.set_ip_defaults(N);
      return new Jackknife(bladesIp);
    case '$Q': return new QDollarRecognizer(N);
    case '!FTL': return new VectorAlgorithm(N);
    case '!NFTL': return new VectorAlgorithm(N);
    case 'uV': return new uVRecognizer(N);
    // here, uF is setup for the classification of 2D uni-touch gestures
    case 'uF': return new uFRecognizer(N, 3, 1.5, 1, 2, [[0]]);
  }
}

// add a training sample, or template, to each recognizer
const addTemplate = function (recognizers, gestureClass, template) {
  let results = [];
  for (const [k, r] of recognizers) {
    let result;
    // search for the right recognizer
    switch (k) {
      case 'Rubine': result = r.addExample(gestureClass, template.get(k)); break;
      case '$1': result = r.AddGesture(gestureClass, template.get(k)); break;
      case 'Protractor': result = r.AddGesture(gestureClass, template.get(k)); break;
      case '$N': result = r.AddGesture(gestureClass, template.get(k)); break;
      case '$N-Protractor': result = r.AddGesture(gestureClass, template.get(k)); break;
      case '$P': result = r.AddGesture(gestureClass, template.get(k)); break;
      case 'Penny Pincher': result = r.addTemplate(template.get(k), gestureClass); break;
      case '$P+': result = r.AddGesture(gestureClass, template.get(k)); break;
      case 'Jackknife-ED': result = r.add_template(template.get(k)); break;
      case 'Jackknife-IP': result = r.add_template(template.get(k)); break;
      case '$Q': result = r.AddGesture(gestureClass, template.get(k)); break;
      case '!FTL': result = r.SaveAs(template.get(k), gestureClass, '', +Infinity); break;
      case '!NFTL': result = r.SaveAs(template.get(k), gestureClass, '', +Infinity); break;
      case 'uV': result = r.addTemplate(template.get(k), gestureClass); break;
      case 'uF': result = r.addTemplate(template.get(k), gestureClass); break;
    }
    results.push(result);
  }
  return results;
}

// some recognizers must be trained explicitly to generate a classification model
// (e.g., Rubine and Jackknife)
const trainRecognizers = function (recognizers) {
  let results = [];
  for (const [k, r] of recognizers) {
    let result;
    // search for the right recognizer
    switch (k) {
      case 'Rubine': result = r.train(); break;
      case 'Jackknife-ED': result = r.train(6, 2, 1.00); break;
      case 'Jackknife-IP': result = r.train(6, 2, 1.00); break;
      // all the other recognizers must not be trained further
      default: result = [0.0]; break;
    }
    results.push(result);
  }
  return results;
}

// send a candidate gesture to recognition for each recognizer
const recognize = function (recognizers, candidate) {
  let results = [];
  for (const [k, r] of recognizers) {
    let result;
    // search for the right recognizer
    switch (k) {
      case 'Rubine': result = r.recognize(candidate.get(k)); break;
      case '$1': result = r.Recognize(candidate.get(k)); break;
      case 'Protractor': result = r.Recognize(candidate.get(k)); break;
      case '$N': result = r.Recognize(candidate.get(k), true); break;
      case '$N-Protractor': result = r.Recognize(candidate.get(k), true); break;
      case '$P': result = r.Recognize(candidate.get(k)); break;
      case 'Penny Pincher': result = r.recognize(candidate.get(k)); break;
      case '$P+': result = r.Recognize(candidate.get(k)); break;
      case 'Jackknife-ED': result = r.classify(candidate.get(k)); break;
      case 'Jackknife-IP': result = r.classify(candidate.get(k)); break;
      case '$Q': result = r.Recognize(candidate.get(k)); break;
      case '!FTL':
        result = r.CompareGesture(candidate.get(k), +Infinity, '', false, 'LSD');
        break;
      case '!NFTL':
        result = r.CompareGesture(candidate.get(k), +Infinity, '', false, 'NLSD');
        break;
      case 'uV': result = r.recognize(candidate.get(k)); break;
      case 'uF': result = r.recognize(candidate.get(k)); break;
    }
    results.push(result);
  }
  return results;
}
