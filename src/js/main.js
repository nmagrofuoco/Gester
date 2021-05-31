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

const gester = new Gester();

// load datasets in memory
const load = async function () {
  const datasets = await gester.loadDatasets(
    document.getElementById('dataset').files,
    document.getElementById('dataset2').files
  );
  gester.setDatasets(datasets);
}

// start the evaluation
const test = function() {
  gester.test();
}

document.getElementById('load').addEventListener('click', load, false);
document.getElementById('test').addEventListener('click', test, false);
