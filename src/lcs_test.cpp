
#include <iostream>
#include "lcs.h"

using namespace std;

int main() {
    string text1 = "ABCDEF";
    string text2 = "ACEF";

    int length = longestCommonSubsequence(text1, text2);

    cout << "Text 1: " << text1 << endl;
    cout << "Text 2: " << text2 << endl;
    cout << "LCS length: " << length << endl;

    return 0;
}
