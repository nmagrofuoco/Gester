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

const Gester = function () {
  this.Dataset = new Map();
  this.Dataset2 = new Map();

  /** Public functions **/

  // load datasets in memory
  this.loadDatasets = function (files, files2) {
    return new Promise(res => {
      let dataset = new Map(); // (participant, classes)
      for (let i = 0; i < files.length; i += 1) {
        const reader = new FileReader();
        reader.onloadend = function (f) {
          const raw = JSON.parse(f.target.result);
          // setup the sample for all configured recognizers
          const sample = setupSample(raw.paths, raw.subject, raw.name);
          let gestures = dataset.get(raw.subject);
          // if the subject has not registered this class yet
          if (typeof gestures === 'undefined')
            dataset.set(raw.subject, new Map([
              [raw.name, [sample]] // (class, samples)
            ]));
          else {
            let samples = gestures.get(raw.name);
            // if the subject has not registered any sample for this class yet
            if (typeof samples === 'undefined') {
              gestures.set(raw.name, [sample]); // (class, samples)
            }
            else {
              samples.push(sample);
              gestures.set(raw.name, samples);
            }
          }
          // if all files from the first dataset have been loaded (and)
          // if there is no second dataset available
          if (i == files.length - 1 && files2.length == 0) {
            document.getElementById('test').disabled = false;
            console.log('The dataset has been loaded in memory.');
            res([dataset]);
          }
          // if all files from the first dataset have been loaded (and)
          // if there is a second dataset available
          else if (i == files.length - 1 && files2.length > 0) {
            let dataset2 = new Map();
            for (let j = 0; j < files2.length; j += 1) {
              const reader = new FileReader();
              reader.onloadend = function (f) {
                const raw = JSON.parse(f.target.result);
                // setup the sample for all configured recognizers
                const sample = setupSample(raw.paths, raw.subject, raw.name);
                let gestures = dataset2.get(raw.subject);
                // if the subject has not registered this class yet
                if (typeof gestures === 'undefined')
                  dataset2.set(raw.subject, new Map([
                    [raw.name, [sample]] // (class, samples)
                  ]));
                else {
                  let samples = gestures.get(raw.name);
                  // if the subject has not registered any sample for this class yet
                  if (typeof samples === 'undefined') {
                    gestures.set(raw.name, [sample]); // (class, samples)
                  }
                  else {
                    samples.push(sample);
                    gestures.set(raw.name, samples);
                  }
                }
                // if all files from the second dataset have been loaded
                if (j == files2.length - 1) {
                  document.getElementById('test').disabled = false;
                  console.log('The datasets have been loaded in memory.');
                  res([dataset, dataset2]);
                }
              }
              reader.readAsText(files2[j]);
            }
          }
        }
        reader.readAsText(files[i]);
      }
    });
  }

  // set the datasets in memory (global variables)
  this.setDatasets = function (datasets) {
    this.Dataset = datasets[0];
    this.Dataset2 = (datasets.length == 2) ? datasets[1] : new Map();
  }

  // start the evaluation procedures
  this.test = function () {
    run(this.Dataset, this.Dataset2);
  }

  /** Private functions **/

  // run the relevant evaluation procedures
  const run = function (dataset, dataset2) {
    // load global variables
    this.Dataset = dataset;
    this.Dataset2 = dataset2;
    this.P = sizeOf(this.Dataset.keys()); // participants in the 1st dataset
    this.P2 = sizeOf(this.Dataset2.keys()); // participants in the 2nd dataset
    this.G = sizeOf(this.Dataset.values().next().value.keys()); // classes
    this.R = getNumberById('R'); // repetitions
    this.N = getNumberById('N'); // resampling points (N)
    this.RT = getRangeById('RT'); // range of templates (T)
    this.RP = getRangeById('RP'); // range of participants (P)
    // run the relevant evaluation procedures in sequence
    let configurations = [];
    let results = [];
    if (PROCEDURES[0]) {
      console.log('The User-Dependent Dataset-Dependent (UDDD) evaluation procedure has started.');
      configurations.push('ud_dd');
      results.push(convertToCSV(runUDDD(), false, false));
    }
    if (PROCEDURES[1] && this.RP.length > 0) {
      console.log('The User-Independent Dataset-Dependent (UIDD) evaluation procedure has started.');
      configurations.push('ui_dd');
      results.push(convertToCSV(runUIDD(), true, false));
    }
    if (PROCEDURES[2] && this.Dataset2.size > 0) {
      console.log('The User-Dependent Dataset-Independent (UDDI) evaluation procedure has started.');
      configurations.push('ud_di');
      results.push(convertToCSV(runUDDI(), false, true));
    }
    if (PROCEDURES[3] && this.Dataset2.size > 0 && this.RP.length > 0) {
      console.log('The User-Independent Dataset-Independent (UIDI) evaluation procedure has started.');
      configurations.push('ui_di');
      results.push(convertToCSV(runUIDI(), true, true));
    }
    exportToFiles(configurations, results);
  }

  // user-dependent, dataset-dependent evaluation procedure:
  // train and test with samples performed by the same end-user.
  const runUDDD = function () {
    // initialize variables to store interesting results
    let matrices = initMatrices(RECOGNIZERS.length, this.P + 1);
    let rates = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let trainingTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let preprocessingTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let classificationTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let recognitionTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    // iterate over the testing participants
    const participants = this.Dataset.entries();
    let p = 0;
    for (let [participant, gestures] of participants) {
      console.log(participant); // log to track progress
      // for maxt templates per class
      for (let rt = 0; rt < this.RT.length; rt += 1) {
        const maxt = this.RT[rt];
        // for R repetitions
        for (let r = 0; r < this.R; r += 1) {
          let recognizers = initRecognizers(this.N);
          // choose one candidate per class
          const candidates = selectCandidates(gestures.entries());
          // choose maxt templates per class and train the recognizers
          let templates = initTemplates(candidates.entries());
          for (let t = 0; t < maxt; t += 1) {
            const gesturesIterator = gestures.entries();
            for (const [gestureClass, samples] of gesturesIterator) {
              let currentTemplates = templates.get(gestureClass);
              let template = selectTemplate(currentTemplates, samples.length);
              currentTemplates.push(template);
              templates.set(gestureClass, currentTemplates);
              const res = addTemplate(
                recognizers.entries(), gestureClass, samples[template]
              );
              updateTimes(res, 1, trainingTimes, p, rt);
            }
          }
          // explicitly train some recognizers
          const res = trainRecognizers(recognizers.entries());
          updateTimes(res, 0, trainingTimes, p, rt);
          // test the recognizers
          const candidatesIterator = candidates.entries();
          for (const [gestureClass, id] of candidatesIterator) {
            const res = recognize(recognizers, gestures.get(gestureClass)[id]);
            updateMatrices(res, gestureClass, matrices, 0, rt);
            updateMatrices(res, gestureClass, matrices, p + 1, rt);
            updateRates(res, gestureClass, rates, p, rt);
            updateTimes(res, 1, preprocessingTimes, p, rt);
            updateTimes(res, 2, classificationTimes, p, rt);
            updateTimes(res, 3, recognitionTimes, p, rt);
          }
        }
        // compute average results for R repetitions
        updateAverage(rates, p, rt);
        updateTrainingAverage(trainingTimes, p, rt);
        updateAverage(preprocessingTimes, p, rt);
        updateAverage(classificationTimes, p, rt);
        updateAverage(recognitionTimes, p, rt);
      }
      p += 1; // next participant
    }
    updateAverageMatrices(matrices, false, false);
    return [matrices, rates, trainingTimes, preprocessingTimes,
      classificationTimes, recognitionTimes];
  }

  // user-dependent, dataset-dependent evaluation procedure:
  // train with samples performed by a set of independent end-users, and
  // test with samples performed by another end-user
  const runUIDD = function () {
    // initialize variables to store interesting results
    let matrices = initMatrices(RECOGNIZERS.length, this.P + 1);
    let rates = initArrays(RECOGNIZERS.length, this.P, this.RP.length, this.RT.length);
    let trainingTimes = initArrays(RECOGNIZERS.length, this.P, this.RP.length, this.RT.length);
    let preprocessingTimes = initArrays(RECOGNIZERS.length, this.P, this.RP.length, this.RT.length);
    let classificationTimes = initArrays(RECOGNIZERS.length, this.P, this.RP.length, this.RT.length);
    let recognitionTimes = initArrays(RECOGNIZERS.length, this.P, this.RP.length, this.RT.length);
    // iterate over the testing participants
    const participants = this.Dataset.entries();
    let p = 0;
    for (let [participant, gestures] of participants) {
      console.log(participant); // log to track progress
      // for maxp independent participants
      for (let rp = 0; rp < this.RP.length; rp += 1) {
        const maxp = this.RP[rp];
        // for maxt templates per class
        for (let rt = 0; rt < this.RT.length; rt += 1) {
          const maxt = this.RT[rt];
          // for R repetitions
          for (let r = 0; r < this.R; r += 1) {
            let recognizers = initRecognizers(this.N);
            // choose one candidate per class
            const candidates = selectCandidates(gestures.entries());
            // choose maxp independent participants
            let trainers = selectTrainers(p, maxp);
            // choose maxt templates per class per independent participant
            for (let t = 0; t < maxt; t += 1) {
              let trainersIterator = trainers.entries();
              for (const [trainer, templates] of trainersIterator) {
                const gesturesIterator = this.Dataset.get(trainer).entries();
                for (const [gestureClass, samples] of gesturesIterator) {
                  let currentTemplates = templates.get(gestureClass);
                  let template = selectTemplate(
                    currentTemplates, samples.length
                  );
                  currentTemplates.push(template);
                  templates.set(gestureClass, currentTemplates);
                  // train the recognizers
                  const res = addTemplate(
                    recognizers.entries(), gestureClass, samples[template]
                  );
                  updateTimes(res, 1, trainingTimes, p, rt, rp);
                }
              }
            }
            // explicitly train some recognizers
            const res = trainRecognizers(recognizers.entries());
            updateTimes(res, 0, trainingTimes, p, rt, rp);
            // test the recognizers
            const candidatesIterator = candidates.entries();
            for (const [gestureClass, id] of candidatesIterator) {
              const res = recognize(
                recognizers, gestures.get(gestureClass)[id]
              );
              updateMatrices(res, gestureClass, matrices, 0, rt, rp);
              updateMatrices(res, gestureClass, matrices, p + 1, rt, rp);
              updateRates(res, gestureClass, rates, p, rt, rp);
              updateTimes(res, 1, preprocessingTimes, p, rt, rp);
              updateTimes(res, 2, classificationTimes, p, rt, rp);
              updateTimes(res, 3, recognitionTimes, p, rt, rp);
            }
          }
          // compute average results for R repetitions
          updateAverage(rates, p, rt, rp);
          updateTrainingAverage(trainingTimes, p, rt, rp);
          updateAverage(preprocessingTimes, p, rt, rp);
          updateAverage(classificationTimes, p, rt, rp);
          updateAverage(recognitionTimes, p, rt, rp);
        }
      }
      p += 1; // next participant
    }
    updateAverageMatrices(matrices, true, false);
    return [matrices, rates, trainingTimes, preprocessingTimes,
      classificationTimes, recognitionTimes];
  }

  // user-dependent, dataset-independent evaluation procedure:
  // train with samples performed by one end-user from the 1st dataset, and
  // test with samples performed by the same end-user from the 2nd dataset
  const runUDDI = function () {
    /// initialize variables to store interesting results
    let matrices = initMatrices(RECOGNIZERS.length, this.P + 1);
    let rates = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let trainingTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let preprocessingTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let classificationTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    let recognitionTimes = initArrays(RECOGNIZERS.length, this.P, this.RT.length);
    // iterate over the testing participants (from the 2nd dataset)
    const participants = this.Dataset2.entries();
    let p = 0;
    for (let [participant, gestures] of participants) {
      console.log(participant); // log to track progress
      // for maxt templates per class
      for (let rt = 0; rt < this.RT.length; rt += 1) {
        const maxt = this.RT[rt];
        // for R repetitions
        for (let r = 0; r < this.R; r += 1) {
          let recognizers = initRecognizers(this.N);
          // choose one candidate per class (from the 2nd dataset)
          const candidates = selectCandidates(gestures.entries());
          // choose maxt templates per class (from the 1st dataset)
          let templates = initTemplates(candidates.entries());
          for (let t = 0; t < maxt; t += 1) {
            const gesturesIterator = this.Dataset.get(participant).entries();
            for (const [gestureClass, samples] of gesturesIterator) {
              let currentTemplates = templates.get(gestureClass);
              let template = selectTemplate(currentTemplates, samples.length);
              currentTemplates.push(template);
              templates.set(gestureClass, currentTemplates);
              // train the recognizers
              const res = addTemplate(
                recognizers.entries(), gestureClass, samples[template]
              );
              updateTimes(res, 1, trainingTimes, p, rt);
            }
          }
          // explicitly train some recognizers
          const res = trainRecognizers(recognizers.entries());
          updateTimes(res, 0, trainingTimes, p, rt);
          // test the recognizers
          const candidatesIterator = candidates.entries();
          for (const [gestureClass, id] of candidatesIterator) {
            const res = recognize(recognizers, gestures.get(gestureClass)[id]);
            updateMatrices(res, gestureClass, matrices, 0, rt);
            updateMatrices(res, gestureClass, matrices, p + 1, rt);
            updateRates(res, gestureClass, rates, p, rt);
            updateTimes(res, 1, preprocessingTimes, p, rt);
            updateTimes(res, 2, classificationTimes, p, rt);
            updateTimes(res, 3, recognitionTimes, p, rt);
          }
        }
        // compute average results for R repetitions
        updateAverage(rates, p, rt);
        updateTrainingAverage(trainingTimes, p, rt);
        updateAverage(preprocessingTimes, p, rt);
        updateAverage(classificationTimes, p, rt);
        updateAverage(recognitionTimes, p, rt);
      }
      p += 1; // next participant
    }
    updateAverageMatrices(matrices, false, true);
    return [matrices, rates, trainingTimes, preprocessingTimes,
      classificationTimes, recognitionTimes];
  }

  // user-independent, dataset-independent evaluation procedure:
  // train with samples performed by a set of independent end-users from the 1st
  // dataset, and test with samples performed by another end-user from the 2nd
  // dataset
  const runUIDI = function () {
    // initialize variables to store interesting results
    let matrices = initMatrices(RECOGNIZERS.length, this.P2 + 1);
    let rates = initArrays(RECOGNIZERS.length, this.P2, this.RP.length, this.RT.length);
    let trainingTimes = initArrays(RECOGNIZERS.length, this.P2, this.RP.length, this.RT.length);
    let preprocessingTimes = initArrays(RECOGNIZERS.length, this.P2, this.RP.length, this.RT.length);
    let classificationTimes = initArrays(RECOGNIZERS.length, this.P2, this.RP.length, this.RT.length);
    let recognitionTimes = initArrays(RECOGNIZERS.length, this.P2, this.RP.length, this.RT.length);
    // iterate over the testing participants (from the 2nd dataset)
    const participants = this.Dataset2.entries();
    let p = 0;
    for (let [participant, gestures] of participants) {
      console.log(participant); // log to track progress
      // for maxp participants per training
      for (let rp = 0; rp < this.RP.length; rp += 1) {
        const maxp = this.RP[rp];
        // for maxt templates per class
        for (let rt = 0; rt < this.RT.length; rt += 1) {
          const maxt = this.RT[rt];
          // for R repetitions
          for (let r = 0; r < this.R; r += 1) {
            let recognizers = initRecognizers(this.N);
            // choose one candidate per class
            const candidates = selectCandidates(gestures.entries());
            // choose maxt templates per class per independent participant
            // (from 1st dataset)
            let trainers = selectTrainers(p, maxp);
            for (let t = 0; t < maxt; t += 1) {
              let trainersIterator = trainers.entries();
              for (const [trainer, templates] of trainersIterator) {
                const gesturesIterator = this.Dataset.get(trainer).entries();
                for (const [gestureClass, samples] of gesturesIterator) {
                  let currentTemplates = templates.get(gestureClass);
                  let template = selectTemplate(
                    currentTemplates, samples.length
                  );
                  currentTemplates.push(template);
                  templates.set(gestureClass, currentTemplates);
                  // train the recognizers
                  const res = addTemplate(
                    recognizers.entries(), gestureClass, samples[template]
                  );
                  updateTimes(res, 1, trainingTimes, p, rt, rp);
                }
              }
            }
            // explicitly train some recognizers
            const res = trainRecognizers(recognizers.entries());
            updateTimes(res, 0, trainingTimes, p, rt, rp);
            // test the recognizers
            const candidatesIterator = candidates.entries();
            for (const [gestureClass, id] of candidatesIterator) {
              const res = recognize(
                recognizers, gestures.get(gestureClass)[id]
              );
              updateMatrices(res, gestureClass, matrices, 0, rt, rp);
              updateMatrices(res, gestureClass, matrices, p + 1, rt, rp);
              updateRates(res, gestureClass, rates, p, rt, rp);
              updateTimes(res, 1, preprocessingTimes, p, rt, rp);
              updateTimes(res, 2, classificationTimes, p, rt, rp);
              updateTimes(res, 3, recognitionTimes, p, rt, rp);
            }
          }
          // compute average results for R repetitions
          updateAverage(rates, p, rt, rp);
          updateTrainingAverage(trainingTimes, p, rt, rp);
          updateAverage(preprocessingTimes, p, rt, rp);
          updateAverage(classificationTimes, p, rt, rp);
          updateAverage(recognitionTimes, p, rt, rp);
        }
      }
      p += 1; // next participant
    }
    updateAverageMatrices(matrices, true, true);
    return [matrices, rates, trainingTimes, preprocessingTimes,
      classificationTimes, recognitionTimes];
  }

  // return ready-to-print results in a CSV format
  const convertToCSV = function (results, userIndependent, datasetIndependent) {
    const testingParticipants = datasetIndependent ? this.P2 : this.P;
    // initialize variables to store interesting results
    let confusionMatrices = [];
    let ratesGlobal = '';
    let ratesParticipant = '';
    let ratesClass = '';
    let trainingTimes = '';
    let preprocessingTimes = '';
    let classificationTimes = '';
    let recognitionTimes = '';
    let tmpRatesGlobal = [];
    let tmpRatesParticipant = [];
    let tmpRatesClass = new Map();
    let tmpTrainingTimes = [];
    let tmpPreprocessingTimes = [];
    let tmpClassificationTimes = [];
    let tmpRecognitionTimes = [];
    let gestureClasses = results[0][0][0].keys();
    for (const gc of gestureClasses) {
      let array = [];
      for (let r = 0; r < RECOGNIZERS.length; r += 1) {
        array[r] = 0.0;
      }
      tmpRatesClass.set(gc, array); // [class, recognition rates]
    }
    // results are prepared for each recognizer
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      confusionMatrices[r] = '';
      tmpRatesParticipant[r] = '';
      tmpTrainingTimes[r] = '';
      tmpPreprocessingTimes[r] = '';
      tmpClassificationTimes[r] = '';
      tmpRecognitionTimes[r] = '';
      tmpRatesGlobal[r] = [];
      if (userIndependent) {
        for (let rp = 0; rp < this.RP.length; rp += 1) {
          tmpRatesGlobal[r][rp] = [];
          for (let rt = 0; rt < this.RT.length; rt += 1) {
            tmpRatesGlobal[r][rp][rt] = 0.0;
          }
        }
      }
      else {
        for (let rt = 0; rt < this.RT.length; rt += 1)
          tmpRatesGlobal[r][rt] = 0.0;
      }
      // print the confusion matrix for each testing participant
      for (let p = 0; p < testingParticipants + 1; p += 1) {
        // first row is: 'participant;class1;class2;...;classN;No match\n'
        confusionMatrices[r] += getParticipantName(p - 1)+ ';';
        let iterator = results[0][r][p].entries();
        for (const [gc, map] of iterator) confusionMatrices[r] += gc + ';';
        confusionMatrices[r] += 'No match' + '\n';
        // one row per tested class:
        // 'class1;rates of class1;rates of class2;...;rates of classN\n'
        iterator = results[0][r][p].entries();
        for (const [gc, map] of iterator) {
          confusionMatrices[r] += gc + ';';
          let iterator2 = map.entries();
          let counter = 0, size = map.size;
          for (const [gc2, v] of iterator2) {
            if (counter < size - 1) confusionMatrices[r] += (v * 100).toFixed(2) + ';';
            else confusionMatrices[r] +=  (v * 100).toFixed(2) + '\n';
            counter += 1;
            if (p > 0 && gc == gc2) {
              let rates = tmpRatesClass.get(gc);
              rates[r] += v;
              tmpRatesClass.set(gc, rates);
            }
          }
        }
        // print the rates achieved for each testing participant and for the
        // various times recorded (training, pre-processing, classification, and
        // recognition)
        if (p < testingParticipants) {
          tmpRatesParticipant[r] += RECOGNIZERS[r][0] + ';';
          tmpTrainingTimes[r] += RECOGNIZERS[r][0] + ';';
          tmpPreprocessingTimes[r] += RECOGNIZERS[r][0] + ';';
          tmpClassificationTimes[r] += RECOGNIZERS[r][0] + ';';
          tmpRecognitionTimes[r] += RECOGNIZERS[r][0] + ';';
          // results of the user-independent procedure are printed for each
          // value within the range of templates (RT) from each value of within
          // the range of participants (RP)
          if (userIndependent) {
            for (let rp = 0; rp < this.RP.length; rp += 1) {
              for (let rt = 0; rt < this.RT.length; rt += 1) {
                tmpRatesGlobal[r][rp][rt] += results[1][r][p][rp][rt];
                if (rp < this.RP.length - 1 || rt < this.RT.length - 1) {
                  tmpRatesParticipant[r] += (results[1][r][p][rp][rt] * 100).toFixed(2) + ';';
                  tmpTrainingTimes[r] += results[2][r][p][rp][rt].toFixed(2) + ';';
                  tmpPreprocessingTimes[r] += results[3][r][p][rp][rt].toFixed(2) + ';';
                  tmpClassificationTimes[r] += results[4][r][p][rp][rt].toFixed(2) + ';';
                  tmpRecognitionTimes[r] += results[5][r][p][rp][rt].toFixed(2) + ';';
                }
                else {
                  tmpRatesParticipant[r] += (results[1][r][p][rp][rt] * 100).toFixed(2) + '\n';
                  tmpTrainingTimes[r] += results[2][r][p][rp][rt].toFixed(2) + '\n';
                  tmpPreprocessingTimes[r] += results[3][r][p][rp][rt].toFixed(2) + '\n';
                  tmpClassificationTimes[r] += results[4][r][p][rp][rt].toFixed(2) + '\n';
                  tmpRecognitionTimes[r] += results[5][r][p][rp][rt].toFixed(2) + '\n';
                }
              }
            }
          }
          // results of the user-independent procedure are printed for each
          // value within the range of templates (RT)
          else {
            for (let rt = 0; rt < this.RT.length; rt += 1) {
              tmpRatesGlobal[r][rt] += results[1][r][p][rt];
              if (rt < this.RT.length - 1) {
                tmpRatesParticipant[r] += (results[1][r][p][rt] * 100).toFixed(2) + ';';
                tmpTrainingTimes[r] += results[2][r][p][rt].toFixed(2) + ';';
                tmpPreprocessingTimes[r] += results[3][r][p][rt].toFixed(2) + ';';
                tmpClassificationTimes[r] += results[4][r][p][rt].toFixed(2) + ';';
                tmpRecognitionTimes[r] += results[5][r][p][rt].toFixed(2) + ';';
              }
              else {
                tmpRatesParticipant[r] += (results[1][r][p][rt] * 100).toFixed(2) + '\n';
                tmpTrainingTimes[r] += results[2][r][p][rt].toFixed(2) + '\n';
                tmpPreprocessingTimes[r] += results[3][r][p][rt].toFixed(2) + '\n';
                tmpClassificationTimes[r] += results[4][r][p][rt].toFixed(2) + '\n';
                tmpRecognitionTimes[r] += results[5][r][p][rt].toFixed(2) + '\n';
              }
            }
          }
        }
      }
    }
    // print the average rates achieved per class of gesture for all conditions
    ratesClass += 'Gesture classes;'
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      if (r < RECOGNIZERS.length - 1) {
        ratesClass += RECOGNIZERS[r][0] + ';';
      }
      else {
        ratesClass += RECOGNIZERS[r][0] + '\n';
      }
    }
    let iterator = tmpRatesClass.entries();
    for (const [gc, rates] of iterator) {
      ratesClass += gc + ';';
      for (let r = 0; r < RECOGNIZERS.length; r += 1) {
        if (r < RECOGNIZERS.length - 1) {
          ratesClass += ((rates[r] / this.P) * 100).toFixed(2) + ';';
        }
        else {
          ratesClass += ((rates[r] / this.P) * 100).toFixed(2) + '\n';
        }
      }
    }
    // print the rates achieved per recognizer
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      ratesGlobal += RECOGNIZERS[r][0] + ';';
      // in the user-independent procedure, rates are printed for each
      // value within the range of templates (RT) from each value of within
      // the range of participants (RP)
      if (userIndependent) {
        for (let rp = 0; rp < this.RP.length; rp += 1)
          for (let rt = 0; rt < this.RT.length; rt += 1) {
            const rates = (
              (tmpRatesGlobal[r][rp][rt] / this.P) * 100
            ).toFixed(2);
            if (rp < this.RP.length - 1 || rt < this.RT.length - 1) {
              ratesGlobal += rates + ';';
            }
            else {
              ratesGlobal += rates + '\n';
            }
          }
      }
      // in the user-dependent procedure, rates are printed for each
      // value within the range of templates (RT)
      else {
        for (let rt = 0; rt < this.RT.length; rt += 1) {
          const rates = ((tmpRatesGlobal[r][rt] / this.P) * 100).toFixed(2);
          if (rt < this.RT.length - 1) {
            ratesGlobal += rates + ';';
          }
          else {
            ratesGlobal += rates + '\n';
          }
        }
      }
      ratesParticipant += tmpRatesParticipant[r];
      trainingTimes += tmpTrainingTimes[r];
      preprocessingTimes += tmpPreprocessingTimes[r];
      classificationTimes += tmpClassificationTimes[r];
      recognitionTimes += tmpRecognitionTimes[r];
    }
    return [confusionMatrices, ratesGlobal, ratesParticipant, ratesClass,
      trainingTimes, preprocessingTimes, classificationTimes, recognitionTimes];
  }

  // create and donwload locally one CSV file per ready-to-print result
  const exportToFiles = function (configurations, results) {
    const jszip = new JSZip();
    const categories = [
      'confusion_matrix',
      'rates_global',
      'rates_participant',
      'rates_class',
      'training_times',
      'preprocessing_times',
      'classification_times',
      'recognition_times'
    ];
    for (let c = 0; c < configurations.length; c += 1) {
      // create one file for the confusion matrices of each recognizer
      for (let r = 0; r < RECOGNIZERS.length; r += 1) {
        jszip
          .folder(configurations[c])
          .folder('confusion_matrices')
          .file(
            categories[0] + '_' + RECOGNIZERS[r][0] + '.csv',
            results[c][0][r]
          );
      }
      // create one file for each type of ready-to-print result
      for (let c2 = 1; c2 < results[c].length; c2 += 1) {
        jszip
          .folder(configurations[c])
          .file(categories[c2] + '.csv', results[c][c2]);
      }
    }
    // generate and download locally an archive containing all created files
    jszip.generateAsync({type:'blob'}).then(function (content) {
      var tmpLink = document.createElement('a');
      tmpLink.style.display = "none";
      document.body.appendChild(tmpLink);
      tmpLink.href = window.URL.createObjectURL(
        new Blob([content], {type:'application/zip'})
      );
      tmpLink.setAttribute('download', 'gester_benchmark' + '.zip');
      tmpLink.click();
      window.URL.revokeObjectURL(tmpLink.href);
      document.body.removeChild(tmpLink);
    });
  }

  // initialize each recognizer found in config.js
  const initRecognizers = function (N) {
    let recognizers = new Map();
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      recognizers.set(RECOGNIZERS[r][0], setupRecognizer(RECOGNIZERS[r][0], N));
    }
    return recognizers;
  }

  // initialize an array of samples for each class of gesture s.t. each array
  // contains at least the candidate sample
  const initTemplates = function (candidates) {
    let templates = new Map();
    for (const [gestureClass, sampleId] of candidates) {
      templates.set(gestureClass, [sampleId]); // [class, samples]
    }
    return templates;
  }

  // initialize an empty array of samples for each class of gesture
  const initEmptyTemplates = function () {
    let templates = new Map();
    let iterator = this.Dataset.entries().next().value[1].keys();
    for (const gestureClass of iterator) {
      templates.set(gestureClass, []); // [class, samples]
    }
    return templates;
  }

  // select one candidate sample per class
  const selectCandidates = function (gestures) {
    let candidates = new Map(); // [class, template]
    for (const [gestureClass, samples] of gestures) {
      candidates.set(gestureClass, getRandomNumber(0, samples.length));
    }
    return candidates;
  }

  // select one random template that is not part of templates yet
  const selectTemplate = function (templates, maxSize) {
    let t = 0;
    do {
      t = getRandomNumber(0, maxSize);
    } while (templates.includes(t));
    return t;
  }

  // select maxp independent participants for training
  const selectTrainers = function (testerId, maxp) {
    let size = sizeOf(this.Dataset.keys()); // nbr of available participants
    // select maxp independent participants by index
    let trainersId = [];
    for (let p = 0; p < maxp; p += 1) {
      let t = 0;
      do {
        t = getRandomNumber(0, size);
      } while (t == testerId || trainersId.includes(t));
      trainersId.push(t);
    }
    // initialize an empty array of templates for each selected participant
    let p = 0;
    let trainers = new Map(); // [participant, templates]
    let participants = this.Dataset.keys();
    for (const participant of participants) {
      // if the current participant has been selected
      if (trainersId.includes(p)) {
        trainers.set(participant, initEmptyTemplates());
      }
      p += 1;
    }
    return trainers;
  }

  // return the value contained in the HTML DOM element by 'id'
  const getNumberById = function (id) {
    const v = document.getElementById(id).value;
    if (isNaN(v)) return 0;
    else return Number(v);
  }

  // return the range of values contained in the HTML DOM element by 'id'
  // the function supports two operators 'A+B' to input both values A and B, and
  // and 'A-B' to input all values between A and B
  const getRangeById = function (id) {
    const v = document.getElementById(id).value;
    let range = [];
    let startNumber = '';
    let endNumber = '';
    let until = false;
    // search for creating sequences of digits, or the '-' and '+' concatenators
    for (let i = 0; i < v.length; i += 1) {
      if (v[i] == '+') {
        range = push(range, startNumber, endNumber);
        until = false;
        startNumber = '';
        endNumber = '';
      }
      else if (v[i] == '-') {
        if (startNumber == '-') startNumber = range.pop();
        until = true;
      }
      else if (!until) startNumber += v[i];
      else if (until) endNumber += v[i];
    }
    range = push(range, startNumber, endNumber); // push last digit(s) found
    return range;
  }

  // return the number of items in the iterator
  const sizeOf = function (iterator) {
    let size = 0;
    for (let i of iterator) size += 1;
    return size;
  }

  // push all values between start and end into array
  const push = function (array, start, end) {
    if (start == '') {
      return array;
    }
    else {
      const s = Number(start);
      const e = (end == '') ? s : Number(end);
      for (let i = s; i <= e; i += 1) array.push(i);
      return array;
    }
  }

  // initialize a 3d or 4d array whose roots values are set to 0.0
  const initArrays = function (size, size2, size3, size4 = 0) {
    let array = [];
    for (let s = 0; s < size; s += 1) {
      array[s] = [];
      for (let s2 = 0; s2 < size2; s2 += 1) {
        array[s][s2] = [];
        for (let s3 = 0; s3 < size3; s3 += 1) {
          if (size4 == 0) array[s][s2][s3] = 0.0;
          else {
            array[s][s2][s3] = [];
            for (let s4 = 0; s4 < size4; s4 += 1)
              array[s][s2][s3][s4] = 0.0;
          }
        }
      }
    }
    return array;
  }

  const updateRates = function (values, gestureClass, array, p, rt, rp = -1) {
    const numParticipants = (rp == -1) ? 1 : this.RP[rp];
    const numTemplates = this.RT[rt] * numParticipants;
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      if (numTemplates >= RECOGNIZERS[r][1]) {
        if (rp == -1) array[r][p][rt] += (values[r][0] == gestureClass) ? 1 : 0;
        else array[r][p][rp][rt] += (values[r][0] == gestureClass) ? 1 : 0;
      }
      else {
        if (rp == -1) array[r][p][rt] += 0;
        else array[r][p][rp][rt] += 0;
      }
    }
  }

  const updateTimes = function (values, id, array, p, rt, rp = -1) {
    const numParticipants = (rp == -1) ? 1 : this.RP[rp];
    const numTemplates = this.RT[rt] * numParticipants;
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      if (numTemplates >= RECOGNIZERS[r][1]) {
        if (rp == -1) array[r][p][rt] += values[r][id];
        else array[r][p][rp][rt] += values[r][id];
      }
      else {
        if (rp == -1) array[r][p][rt] += 0.0;
        else array[r][p][rp][rt] += 0.0;
      }
    }
  }

  const updateAverage = function (array, p, rt, rp = -1) {
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      if (rp == -1) array[r][p][rt] /= this.G * this.R;
      else array[r][p][rp][rt] /= this.G * this.R;
    }
  }

  const updateTrainingAverage = function (array, p, rt, rp = -1) {
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      if (rp == -1) array[r][p][rt] /= this.R;
      else array[r][p][rp][rt] /= this.R;
    }
  }

  const initMatrices = function (size1, size2) {
    let matrix = [];
    for (let s = 0; s < size1; s += 1) {
      matrix[s] = [];
      for (let s2 = 0; s2 < size2; s2 += 1) {
        // each gesture class...
        let gcMap = new Map();
        let gcIterator = this.Dataset.values().next().value.keys();
        for (const gc of gcIterator) {
          let gcMap2 = new Map();
          // ...is not yet recognized as each gesture class
          let gcIterator2 = this.Dataset.values().next().value.keys();
          for (const gc2 of gcIterator2) gcMap2.set(gc2, 0);
          // also add the 'No match' gesture class when a recognizer has found
          // no valid result
          gcMap2.set('No match', 0);
          gcMap.set(gc, gcMap2);
        }
        matrix[s][s2] = gcMap;
      }
    }
    return matrix;
  }

  const updateMatrices = function (values, gestureClass, matrices, p, rt, rp = -1) {
    const numParticipants = (rp == -1) ? 1 : this.RP[rp];
    const numTemplates = this.RT[rt] * numParticipants;
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      if (numTemplates >= RECOGNIZERS[r][1]) {
        let gc = matrices[r][p].get(gestureClass);
        let gc2 = gc.get(values[r][0]);
        gc.set(values[r][0], gc2 + 1);
      }
    }
  }

  const updateAverageMatrices = function (matrices, userIndependent, datasetIndependent) {
    const restriction = (this.RT[0] == 1) ? 1 : 0;
    const restriction2 = (this.RT[0] * this.RP[0] == 1) ? 1 : 0;
    const testingParticipants = datasetIndependent ? this.P2 : this.P;
    for (let r = 0; r < RECOGNIZERS.length; r += 1) {
      for (let p = 0; p < testingParticipants + 1; p += 1) {
        let gcIterator = matrices[r][p].entries();
        for (const [gc, map] of gcIterator) {
          let mapIterator = map.entries();
          for (const [gc2, v] of mapIterator) {
            if (!userIndependent) {
              if (p == 0) {
                if (RECOGNIZERS[r][1] > 1)
                  map.set(gc2, (v / (this.R * (this.RT.length - restriction) * this.P)));
                else
                  map.set(gc2, (v / (this.R * this.RT.length * this.P)));
              }
              else {
                if (RECOGNIZERS[r][1] > 1)
                  map.set(gc2, (v / (this.R * (this.RT.length - restriction))));
                else
                  map.set(gc2, (v / (this.R * this.RT.length)));
              }
            }
            else {
              if (p == 0) {
                if (RECOGNIZERS[r][1] > 1)
                  map.set(gc2, (v / (this.R * (this.RT.length * this.RP.length - restriction2) * this.P)));
                else
                  map.set(gc2, (v / (this.R * this.RT.length * this.RP.length * this.P)));
              }
              else {
                if (RECOGNIZERS[r][1] > 1)
                  map.set(gc2, (v / (this.R * (this.RT.length * this.RP.length - restriction2))));
                else
                  map.set(gc2, (v / (this.R * this.RT.length * this.RP.length)));
              }
            }
          }
        }
      }
    }
  }

  // return the participant's name according to the provided index
  // return 'AllParticipants' if the index is equal to -1
  const getParticipantName = function (index) {
    if (index == -1) {
      return 'AllParticipants';
    }
    else {
      let counter = 0;
      let participants = this.Dataset.keys();
      for (const k of participants) {
        if (counter == index) return k;
        counter += 1;
      }
    }
  }

  // return a random number in [min,max[
  const getRandomNumber = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
