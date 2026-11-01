
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>

#include "plagiarism.h"

using namespace std;

string readFile(const string& filename) {
    ifstream file(filename.c_str());

    if (!file.is_open()) {
        cerr << "Error: Could not open " << filename << endl;
        return "";
    }

    stringstream buffer;
    buffer << file.rdbuf();

    return buffer.str();
}

int main() {
    cout << "====================================" << endl;
    cout << "           PLAGISCAN AI" << endl;
    cout << "     Plagiarism Detection System" << endl;
    cout << "====================================" << endl;


string document1 = readFile("../samples/document1.txt");
string document2 = readFile("../samples/document2.txt");


    if (document1.empty() || document2.empty()) {
        cout << "Could not read the sample documents." << endl;
        cout << "Check the file paths and document contents." << endl;
        return 1;
    }

    PlagiarismReport report =
        compareDocuments(document1, document2);

    cout << "\nSimilarity Score: "
         << report.similarityPercentage << "%" << endl;

    cout << "\nMatching Sequences:" << endl;

    if (report.matchingSequences.empty()) {
        cout << "No matching sequences found." << endl;
    } else {
        for (size_t i = 0;
             i < report.matchingSequences.size();
             i++) {
            cout << "- "
                 << report.matchingSequences[i]
                 << endl;
        }
    }

    cout << "\nAnalysis completed successfully!" << endl;

    return 0;
}
