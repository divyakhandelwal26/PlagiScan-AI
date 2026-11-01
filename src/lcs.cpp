
#include "lcs.h"
#include <vector>
#include <algorithm>

int longestCommonSubsequence(const string& text1, const string& text2) {
    int m = static_cast<int>(text1.length());
    int n = static_cast<int>(text2.length());

    vector<int> previous(n + 1, 0);
    vector<int> current(n + 1, 0);

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1[i - 1] == text2[j - 1]) {
                current[j] = previous[j - 1] + 1;
            } else {
                current[j] = max(previous[j], current[j - 1]);
            }
        }

        previous = current;
    }

    return previous[n];
}
