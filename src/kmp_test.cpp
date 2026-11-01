
#include <iostream>
#include "kmp.h"

using namespace std;

int main() {
    string text = "the quick brown fox jumps over the wall";
    string pattern = "brown fox";

    vector<int> positions = kmpSearch(text, pattern);

    if (positions.empty()) {
        cout << "Pattern not found." << endl;
    } else {
        cout << "Pattern found at index: ";

        for (size_t i = 0; i < positions.size(); i++) {
            cout << positions[i] << " ";
        }

        cout << endl;
    }

    return 0;
}
