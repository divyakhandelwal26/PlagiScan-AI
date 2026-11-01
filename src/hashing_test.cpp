
#include <iostream>
#include "tokenizer.h"
#include "hashing.h"

using namespace std;

int main() {
    string text1 = "The quick brown fox jumps over the wall.";
    string text2 = "The quick brown fox sleeps near the wall.";

    vector<string> words1 = tokenize(text1);
    vector<string> words2 = tokenize(text2);

    vector<string> matches =
        findMatchingSequences(words1, words2, 3);

    cout << "Matching sequences:" << endl;

    for (size_t i = 0; i < matches.size(); i++) {
        cout << matches[i] << endl;
    }

    return 0;
}
