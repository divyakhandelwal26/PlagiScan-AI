
#ifndef PLAGIARISM_H
#define PLAGIARISM_H

#include <string>
#include <vector>

using namespace std;

struct PlagiarismReport {
    double similarityPercentage;
    vector<string> matchingSequences;
};

PlagiarismReport compareDocuments(
    const string& document1,
    const string& document2
);

#endif
