
#include "kmp.h"

vector<int> buildLPS(const string& pattern) {
    vector<int> lps(pattern.length(), 0);

    int length = 0;
    int i = 1;

    while (i < static_cast<int>(pattern.length())) {
        if (pattern[i] == pattern[length]) {
            length++;
            lps[i] = length;
            i++;
        } else {
            if (length != 0) {
                length = lps[length - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }

    return lps;
}

vector<int> kmpSearch(const string& text, const string& pattern) {
    vector<int> positions;

    if (pattern.empty()) {
        return positions;
    }

    vector<int> lps = buildLPS(pattern);

    int i = 0;
    int j = 0;

    while (i < static_cast<int>(text.length())) {
        if (text[i] == pattern[j]) {
            i++;
            j++;
        }

        if (j == static_cast<int>(pattern.length())) {
            positions.push_back(i - j);
            j = lps[j - 1];
        } else if (i < static_cast<int>(text.length()) &&
                   text[i] != pattern[j]) {
            if (j != 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }

    return positions;
}
