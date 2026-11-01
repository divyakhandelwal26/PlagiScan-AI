
#include "plagiarism.h"
#include "tokenizer.h"
#include "hashing.h"
#include "lcs.h"

#include <algorithm>
#include <cctype>
#include <sstream>

PlagiarismReport compareDocuments(
    const string& document1,
    const string& document2
) {
    PlagiarismReport report;
    report.similarityPercentage = 0.0;

    vector<string> words1 = tokenize(document1);
    vector<string> words2 = tokenize(document2);

    if (words1.empty() || words2.empty()) {
        return report;
    }

    // Find matching sequences of three words.
    report.matchingSequences =
        findMatchingSequences(words1, words2, 3);

    // Convert token lists into normalized text.
    string normalized1;
    string normalized2;

    for (size_t i = 0; i < words1.size(); i++) {
        if (i > 0) normalized1 += " ";
        normalized1 += words1[i];
    }

    for (size_t i = 0; i < words2.size(); i++) {
        if (i > 0) normalized2 += " ";
        normalized2 += words2[i];
    }

    // Calculate character-level LCS similarity.
    int lcsLength =
        longestCommonSubsequence(normalized1, normalized2);

    size_t longestLength =
        max(normalized1.length(), normalized2.length());

    if (longestLength > 0) {
        report.similarityPercentage =
            100.0 * lcsLength / longestLength;
    }

    return report;
}
