
#include <iostream>
#include <string>
#include <vector>
#include "tokenizer.h"

using namespace std;

int main() {
    string text = "The Quick Brown Fox jumps!";

    vector<string> words = tokenize(text);

    cout << "Tokenized words:" << endl;

    for (size_t i = 0; i < words.size(); i++) {
        cout << words[i] << endl;
    }

    return 0;
}
