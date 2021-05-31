# Gester
An automated evaluation tool for gesture recognition techniques.  

## Description
Gester is a single-page application developed for the gesture recognition community. The application measures the speed and accuracy of a series of recognizers provided one or two datasets according to several evaluation procedures. The recognizers must be written in Javascript and the datasets provided in a consistent JSON format. Four combinations of two evaluation procedures are available to researchers and practitioners: user-(in)dependent and dataset-(in)dependent. Gester is only available on the Google Chrome web browser due to compatibility issues.

## Get Started
1. Select and setup the relevant recognizers and evaluation procedures in the `config.js` file,
2. Open the `index.html` page in Google Chrome,
3. Setup the relevant parameters and import one or two datasets into the application,
4. Load the datasets in memory,
5. Start the evaluation procedures and wait for the results to be downloaded. In-progress logs are available in the developer console.

## Evaluation Procedures
1. __User-dependent dataset-dependent (uddd):__
T samples per class are randomly selected for training (T), and one remaining sample per class is selected for testing. All samples are produced by the same end-user and chosen among the same dataset.
2. __User-independent dataset-dependent (uidd):__
T samples per class for each P independent participant are randomly selected for training (TxP), and one sample per class produced by another independent end-user is selected for testing. All samples are chosen among the same dataset.
3. __User-dependent dataset-independent (uddi):__
T samples per class are randomly selected for training (T), and one remaining sample per class is selected for testing. All samples are produced by the same end-user, but training and testing samples are chosen among the first and second dataset, respectively. Therefore, the results are reported for the testing participants from the second dataset.
4. __User-independent dataset-independent (uidi):__
T samples per class for each P independent participant are randomly selected for training (TxP), and one remaining sample per class produced by another independent end-user is selected for testing. Training and testing samples are chosen among the first and second dataset, respectively. Therefore, the results are reported for the testing participants from the second dataset.

## License
The academic publication for Gester, and what should be used to cite it, is:

In press.

BSD 3-Clause License

Copyright (c) 2021, Nathan Magrofuoco, Jean Vanderdonckt, and Paolo Roselli
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
