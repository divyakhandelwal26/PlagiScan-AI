
#include "hashing.h"
#include <unordered_map>

vector<string> findMatchingSequences(
    const vector<string>& words1,
    const vector<string>& words2,
    int sequenceLength
) {
    vector<string> matches;

    if (sequenceLength <= 0 ||
        words1.size() < static_cast<size_t>(sequenceLength) ||
        words2.size() < static_cast<size_t>(sequenceLength)) {
        return matches;
    }

    unordered_map<size_t, vector<size_t> > hashPositions;

    const size_t base = 31;
    const size_t modulus = 1000000007;

    for (size_t i = 0;
         i + sequenceLength <= words2.size();
         i++) {

        size_t hashValue = 0;

        for (int j = 0; j < sequenceLength; j++) {
            for (size_t k = 0; k < words2[i + j].size(); k++) {
                hashValue =
                    (hashValue * base +
                     static_cast<unsigned char>(words2[i + j][k]))
                    % modulus;
            }

            hashValue = (hashValue * base + 1) % modulus;
        }

        hashPositions[hashValue].push_back(i);
    }

    for (size_t i = 0;
         i + sequenceLength <= words1.size();
         i++) {

        size_t hashValue = 0;

        for (int j = 0; j < sequenceLength; j++) {
            for (size_t k = 0; k < words1[i + j].size(); k++) {
                hashValue =
                    (hashValue * base +
                     static_cast<unsigned char>(words1[i + j][k]))
                    % modulus;
            }

            hashValue = (hashValue * base + 1) % modulus;
        }

        if (hashPositions.find(hashValue) != hashPositions.end()) {
            const vector<size_t>& positions = hashPositions[hashValue];

            for (size_t p = 0; p < positions.size(); p++) {
                bool equal = true;

                for (int j = 0; j < sequenceLength; j++) {
                    if (words1[i + j] != words2[positions[p] + j]) {
                        equal = false;
                        break;
                    }
                }

                if (equal) {
                    string sequence = "";

                    for (int j = 0; j < sequenceLength; j++) {
                        if (j > 0) {
                            sequence += " ";
                        }

                        sequence += words1[i + j];
                    }

                    matches.push_back(sequence);
                    break;
                }
            }
        }
    }

    return matches;
}
