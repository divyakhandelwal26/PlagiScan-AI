# PlagiScan AI – Plagiarism Detection System

PlagiScan AI is a C++ powered plagiarism detection system that compares two text documents and identifies matching content.

## Features

- Document comparison
- Similarity percentage calculation
- Originality score
- Matching passage detection
- Matching text highlighting on the website
- Downloadable PDF reports
- `.txt` document upload
- Scan history
- Analytics dashboard

## Technologies Used

- C++
- HTML5
- CSS3
- JavaScript
- Data Structures and Algorithms

## Algorithms Used

- Hashing
- Knuth-Morris-Pratt (KMP)
- Longest Common Subsequence (LCS)
- Text tokenization

## Project Structure

```text
PlagiScan-AI/
├── README.md
├── .gitignore
├── samples/
├── src/
│   ├── main.cpp
│   ├── server.cpp
│   ├── plagiarism.cpp
│   ├── plagiarism.h
│   ├── tokenizer.cpp
│   ├── tokenizer.h
│   ├── hashing.cpp
│   ├── hashing.h
│   ├── kmp.cpp
│   ├── kmp.h
│   ├── lcs.cpp
│   └── lcs.h
└── web/
    ├── index.html
    ├── style.css
    └── script.js
```

## How to Run

### Backend

Compile and run the C++ server using the required source files and dependencies.

The local backend runs at:

`http://127.0.0.1:8080`

### Frontend

1. Open the project in Visual Studio Code.
2. Open the `web` folder.
3. Right-click `index.html`.
4. Select Open with Live Server.

The backend must be running for document comparison.

## Scan History

Scan history is stored locally in the browser using localStorage.

## Disclaimer

Similarity scores are screening results and do not independently establish plagiarism.

## Author

Developed as a C++ and Data Structures and Algorithms project.