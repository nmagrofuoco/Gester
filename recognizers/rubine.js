/**
 *  Rubine
 *  Specifying Gestures by Example
 *
 *  This Javascript version was developed by:
 *    Nathan Magrofuoco
 *    Université catholique de Louvain
 *    Louvain Research Institute in Management and Organizations
 *    Louvain-la-Neuve, Belgium
 *    nathan.magrofuoco@uclouvain.be
 *
 *  Based on work by Beat Signer et al. implemented in Java, and Jacob O.
 *  Wobbrock et al. implemented in C#:
 *
 *    1. B. Signer, U. Kurmann, and M. Norrie. 2007. IGesture: A General Gesture
 *    Recognition Framework. In Proceedings of the Ninth International Conference
 *    on Document Analysis and Recognition - Volume 02 (ICDAR '07). IEEE
 *    Computer Society, USA, 954–958.
 *
 *    2. Jacob O. Wobbrock, Andrew D. Wilson, and Yang Li. 2007. Gestures
 *    without libraries, toolkits or training: a $1 recognizer for user
 *    interface prototypes. In Proceedings of the 20th annual ACM symposium on
 *    User interface software and technology (UIST '07). Association for
 *    Computing Machinery, New York, NY, USA, 159–168.
 *    DOI:https://doi.org/10.1145/1294211.1294238
 *
 *  The academic publication for the Rubine recognizer, and what should be
 *  used to cite it, is:
 *
 *    Dean Rubine. 1991. Specifying gestures by example. In Proceedings of the
 *    18th annual conference on Computer graphics and interactive techniques
 *    (SIGGRAPH '91). Association for Computing Machinery, New York, NY, USA,
 *    329–337. DOI:https://doi.org/10.1145/122718.122753
 *
 **/

// Rubine_Point constructor
const Rubine_Point = function (x, y, t = 0) {
  this.x = x;
  this.y = y;
  this.t = t;
}

// List of the 13 features used by the Rubine's original recognizer
const Rubine_Features = [
  'initial angle cosine',
  'initial angle sine',
  'bounding box length',
  'bounding box diagonal angle',
  'start to end distance',
  'start to end cosinus angle',
  'start to end sinus angle',
  'total gesture length',
  'total angle traversed',
  'sum of the absolute values of angles traversed',
  'sum of the squared values of angles traversed',
  'maximum (squared) speed',
  'path duration'
];

// RubineRecognizer constructor
const RubineRecognizer = function () {
  this.gestureClasses = [];
  this.matrix = [];
  this.invMatrix = [];
  this.numExamples = 0;
  this.examples = new Map(); // (gesture class, [])
  this.examplesFeatureVector = new Map(); // (example, [])
  this.classesMeanFeatureVector = new Map(); // (gesture class, [])
  this.covMatrices = new Map(); // (gesture class, [])
  this.initialWeight = new Map(); // (gesture class, int)
  this.weightsVector = new Map(); // (gesture class, [])
  this.trained = false;
}

RubineRecognizer.prototype.addExample = function (name, points) {
  const t0 = performance.now(); // start timer
  if (this.examples.has(name)) {
    let gestures = this.examples.get(name);
    gestures.push(points);
    this.examples.set(name, gestures);
  }
  else {
    this.gestureClasses.push(name);
    this.examples.set(name, [points]);
  }
  this.numExamples += 1;
  this.trained = false;
  const t1 = performance.now(); // stop timer
  return [this.numExamples, t1 - t0];
}

RubineRecognizer.prototype.recognize = function (points) {
  // start recognition
  const t0 = performance.now(); // start timer
  let bestScore = -Infinity;
  let bestGestureClass = null;
  const candidateFeatureVector = this.computeFeatureVector(points);
  const t1 = performance.now(); // intermediate timer
  // if less than 2 examples per gesture class return "No match" since the
  // recognizer cannot be trained
  if (!this.isTrainable()) return ['No match', 0.0, 0.0, 0.0];
  // otherwise compute the similarity score of the candidate against each gesture class
  for (let c = 0; c < this.gestureClasses.length; c += 1) {
    let score = this.initialWeight.get(this.gestureClasses[c]);
    const weightsVector = this.weightsVector.get(this.gestureClasses[c]);
    for (let i = 0; i < weightsVector.length; i += 1)
      score += weightsVector[i] * candidateFeatureVector[i];
    if (score > bestScore) {
      bestScore = score;
      bestGestureClass = this.gestureClasses[c];
    }
  }
  const t2 = performance.now(); // stop timer
  return (bestGestureClass == null) ?
    ['No match', t1 - t0, t2 - t1, t2 - t0] :
    [bestGestureClass, t1 - t0, t2 - t1, t2 - t0];
}

RubineRecognizer.prototype.train = function () {
  const t0 = performance.now(); // start timer
  if (!this.trained && this.isTrainable()) {
    for (let c = 0; c < this.gestureClasses.length; c += 1) {
      const gestures = this.examples.get(this.gestureClasses[c]);
      this.setFeatureVectors(this.gestureClasses[c], gestures);
      this.setClassCovarianceMatrix(this.gestureClasses[c], gestures);
    }
    this.setCommonCovarianceMatrix();
    this.setInvertedMatrix();
    this.setWeights();
    this.trained = true; // ready for recognition
    const t1 = performance.now(); // stop timer
    return [t1 - t0];
  }
  else return [0.0];
}

RubineRecognizer.prototype.isTrainable = function () {
  for (let c = 0; c < this.gestureClasses.length; c += 1) {
    let examples = this.examples.get(this.gestureClasses[c]);
    if (typeof examples === 'undefined') return false;
    else if (examples.length < 2) return false;
  }
  return true;
}

RubineRecognizer.prototype.setFeatureVectors = function (gestureClass, gestures) {
  let featureVectors = [];
  for (let g = 0; g < gestures.length; g += 1) {
    const featureVector = this.computeFeatureVector(gestures[g]);
    this.examplesFeatureVector.set(gestures[g], featureVector);
    featureVectors.push(featureVector);
  }
  this.classesMeanFeatureVector.set(gestureClass, this.mean(featureVectors));
}

RubineRecognizer.prototype.computeFeatureVector = function (points) {
  let featureVector = [];
  const preprocessedPoints = this.filter(
    this.scale(points.slice(0, points.length))
  );
  // at least three points are required to compute initial sin and cos
  if (preprocessedPoints.length < 3)
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const startPoint = preprocessedPoints[0];
  const thirdPoint = preprocessedPoints[2];
  const endPoint = preprocessedPoints[preprocessedPoints.length - 1];
  // features 0 and 1: initial angle cosine and sine
  let pX = thirdPoint.x - startPoint.x;
  let pY = thirdPoint.y - startPoint.y;
  let tmp = Math.sqrt(pX * pX + pY * pY);
  featureVector[0] = tmp == 0 ? pX : pX / tmp;
  featureVector[1] = tmp == 0 ? pY : pY / tmp;
  // features 2 and 3: bounding box length and diagonal angle
  const pMinMax = this.getMinMax(preprocessedPoints);
  pX = pMinMax[1].x - pMinMax[0].x;
  pY = pMinMax[1].y - pMinMax[0].y;
  featureVector[2] = Math.sqrt(pX * pX + pY * pY);
  featureVector[3] = Math.atan2(pY, pX);
  // features 4, 5 and 6: start to end distance, cosinus and sinus angle
  pX = endPoint.x - startPoint.x;
  pY = endPoint.y - startPoint.y;
  tmp = Math.sqrt(pX * pX + pY * pY);
  featureVector[4] = tmp;
  featureVector[5] = tmp == 0 ? pX : pX / tmp;
  featureVector[6] = tmp == 0 ? pY : pY / tmp;
  // features 7, 8, 9, 10, 11 and 12: total gesture length, total angle
  // traversed, sum of the absolute values of angles traversed, sum of the
  // squared values of angles traversed, maximum (squared) speed, path duration
  let total_length = 0, total_angle = 0, total_abs_angle = 0, total_sqr_angle = 0;
  let maxSpeed = -Infinity;
  for (let i = 1; i < preprocessedPoints.length; i += 1) {
    const delta = new Rubine_Point(
      preprocessedPoints[i].x - preprocessedPoints[i - 1].x,
      preprocessedPoints[i].y - preprocessedPoints[i - 1].y,
      preprocessedPoints[i].t - preprocessedPoints[i - 1].t
    );
    const squaredDelta = new Rubine_Point(
      delta.x * delta.x,
      delta.y * delta.y,
      delta.t * delta.t
    );
    if (i >= 3) {
      const prevDelta = new Rubine_Point(
        preprocessedPoints[i - 1].x - preprocessedPoints[i - 2].x,
        preprocessedPoints[i - 1].y - preprocessedPoints[i - 2].y
      );
      const angle = Math.atan2(
        delta.x * prevDelta.y - prevDelta.x * delta.y,
        delta.x * prevDelta.x - delta.y * prevDelta.y
      );
      total_angle += angle;
      total_abs_angle += Math.abs(angle);
      total_sqr_angle += angle * angle;
    }
    const sum = squaredDelta.x + squaredDelta.y;
    total_length += Math.sqrt(sum);
    maxSpeed = Math.max(maxSpeed, squaredDelta.t == 0 ? sum : sum / squaredDelta.t);
  }
  featureVector[7] = total_length;
  featureVector[8] = total_angle;
  featureVector[9] = total_abs_angle;
  featureVector[10] = total_sqr_angle;
  featureVector[11] = maxSpeed;
  featureVector[12] = endPoint.t - startPoint.t;
  return featureVector;
}

RubineRecognizer.prototype.setClassCovarianceMatrix = function (gestureClass, gestures) {
  let matrix = [];
  const classMeanVector = this.classesMeanFeatureVector.get(gestureClass);
  for (let i = 0; i < Rubine_Features.length; i += 1) {
    matrix[i] = [];
    for (let j = 0; j < Rubine_Features.length; j += 1) {
      let sum = 0.0;
      for (let g = 0; g < gestures.length; g += 1) {
        const gestureFeatureVector = this.examplesFeatureVector.get(gestures[g]);
        sum += (gestureFeatureVector[i] - classMeanVector[i]) * (gestureFeatureVector[j] - classMeanVector[j]);
      }
      matrix[i][j] = sum;
    }
  }
  this.covMatrices.set(gestureClass, matrix);
}

RubineRecognizer.prototype.setCommonCovarianceMatrix = function () {
  let matrix = [];
  for (let i = 0; i < Rubine_Features.length; i += 1) {
    matrix[i] = [];
    for (let j = 0; j < Rubine_Features.length; j += 1) {
      let num = 0.0;
      let den = -this.gestureClasses.length;
      for (let c = 0; c < this.gestureClasses.length; c += 1) {
        const numExamples = this.examples.get(this.gestureClasses[c]).length;
        num += (this.covMatrices.get(this.gestureClasses[c]))[i][j] / (numExamples - 1);
        den += numExamples;
      }
      matrix[i][j] = (den == 0) ? num : num / den;
    }
  }
  this.matrix = matrix;
}

RubineRecognizer.prototype.setInvertedMatrix = function () {
  this.invMatrix = this.invert(this.matrix);
}

RubineRecognizer.prototype.setWeights = function () {
  let weightsVectors = new Map();
  for (let c = 0; c < this.gestureClasses.length; c += 1) {
    const classMeanVector = this.classesMeanFeatureVector.get(this.gestureClasses[c]);
    // compute the weights for each gesture class
    let weightsVector = [];
    for (let j = 0; j < classMeanVector.length; j += 1) {
      let weight = 0.0;
      for (let i = 0; i < classMeanVector.length; i += 1)
        weight += this.invMatrix[i][j] * classMeanVector[i];
      weightsVector[j] = weight;
    }
    this.weightsVector.set(this.gestureClasses[c], weightsVector);
    // compute the initial weight for each gesture class
    let initialWeight = 0.0;
    for (let f = 0; f < classMeanVector.length; f += 1)
      initialWeight += weightsVector[f] * classMeanVector[f];
    this.initialWeight.set(this.gestureClasses[c], -0.5 * initialWeight);
  }
}

RubineRecognizer.prototype.mean = function (vectors) {
  return this.scalarDiv(this.sum(vectors), vectors.length);
}

RubineRecognizer.prototype.scalarDiv = function (vector, den) {
  let res = [];
  for (let i = 0; i < vector.length; i += 1)
    res[i] = den == 0 ? vector[i] : vector[i] / den;
  return res;
}

RubineRecognizer.prototype.sum = function (vectors) {
  if (vectors.length > 0) {
    let res = [];
    for (let i = 0; i < vectors[0].length; i += 1) res[i] = 0.0;
    for (let i = 0; i < vectors.length; i += 1) res = this.add(res, vectors[i]);
    return res;
  }
  else return 0; // ERROR : not enough vector
}

RubineRecognizer.prototype.add = function (v1, v2) {
  let res = [];
  for (let i = 0; i < v1.length; i += 1) res[i] = v1[i] + v2[i];
  return res;
}

// copied from http://blog.acipo.com/matrix-inversion-in-javascript/
// retrieved the 04.29.2020
RubineRecognizer.prototype.invert = function (matrix) {
  let I = []; // identity matrix
  let C = []; // copy of the original matrix
  // initialize the identity matrix and the copy of the original matrix
  for (let i = 0; i < matrix.length; i += 1) {
    I[i] = [];
    C[i] = [];
    for (let j = 0; j < matrix.length; j += 1) {
      if (i == j) I[i][j] = 1.0;
      else I[i][j] = 0.0;
      C[i][j] = matrix[i][j];
    }
  }
  // perform elementary row operations
  for (let i = 0; i < matrix.length; i += 1) {
    let e = C[i][i]; // element on the diagonal
    if (e == 0) {
      for (let ii = i + 1; ii < matrix.length; ii += 1) {
        if (C[ii][i] != 0) {
          for (let j = 0; j < matrix.length; j += 1) {
            e = C[i][j];
            C[i][j] = C[ii][j];
            C[ii][j] = e;
            e = I[i][j];
            I[i][j] = I[ii][j];
            I[ii][j] = e;
          }
          break;
        }
      }
      e = C[i][i];
      if (e == 0) return -1; // ERROR: not invertible
    }
    for (let j = 0; j < matrix.length; j += 1) {
      C[i][j] = C[i][j] / e;
      I[i][j] = I[i][j] / e;
    }
    for (let ii = 0; ii < matrix.length; ii += 1) {
      if (ii == i) continue;
      e = C[ii][i];
      for (let j = 0; j < matrix.length; j += 1) {
        C[ii][j] -= e * C[i][j];
        I[ii][j] -= e * I[i][j];
      }
    }
  }
  // now, C should be the identity and I should be the inverse
  return I;
}

RubineRecognizer.prototype.scale = function (points) {
  let newPoints = [];
  let minX = +Infinity, maxX = -Infinity;
  let minY = +Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i += 1) {
    minX = Math.min(minX, points[i].x);
    minY = Math.min(minY, points[i].y);
    maxX = Math.max(maxX, points[i].x);
    maxY = Math.max(maxY, points[i].y);
  }
  let sizeFactor = Math.max(maxX - minX, maxY - minY);
  sizeFactor = sizeFactor == 0 ? 1 : sizeFactor;
  for (var i = 0; i < points.length; i++) {
    newPoints.push(new Rubine_Point(
      (points[i].x - minX) / sizeFactor,
      (points[i].y - minY) / sizeFactor,
      points[i].t
    ));
  }
  return newPoints;
}

RubineRecognizer.prototype.filter = function (points) {
  let newPoints = [];
  // discard all points <= 3 pixels away from the previous point
  for (let i = 1; i < points.length ; i += 1)
    if (this.computePixelDistance(points[i - 1], points[i]) > 0.0003)
      newPoints.push(points[i]);
  return newPoints;
}

RubineRecognizer.prototype.computePixelDistance = function (p1, p2) {
  return Math.abs(p2.x - p1.x + p2.y - p1.y);
}

RubineRecognizer.prototype.getMinMax = function (points) {
  let min = new Rubine_Point(+Infinity, +Infinity);
  let max = new Rubine_Point(-Infinity, -Infinity);
  for (let i = 0; i < points.length; i += 1) {
    if (points[i].x < min.x) min.x = points[i].x;
    if (points[i].x > max.x) max.x = points[i].x;
    if (points[i].y < min.y) min.y = points[i].y;
    if (points[i].y > max.y) max.y = points[i].y;
  }
  return [min, max];
}
