
#include "tokenizer.h"
#include <cctype>

vector<string> tokenize(const string& text) {
    vector<string> words;
    string word = "";

    for (size_t i = 0; i < text.length(); i++) {
        unsigned char ch = text[i];

        if (isalnum(ch)) {
            word += static_cast<char>(tolower(ch));
        } else {
            if (!word.empty()) {
                words.push_back(word);
                word = "";
            }
        }
    }

    if (!word.empty()) {
        words.push_back(word);
    }

    return words;
}