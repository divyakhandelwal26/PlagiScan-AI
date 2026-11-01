#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <algorithm>
#include <cctype>

#include <winsock2.h>
#include "plagiarism.h"

#pragma comment(lib, "ws2_32.lib")

using namespace std;

// Decode URL-encoded text.
string urlDecode(const string& text) {
    string result;

    for (size_t i = 0; i < text.size(); i++) {
        if (text[i] == '+') {
            result += ' ';
        }
        else if (text[i] == '%' && i + 2 < text.size()) {
            try {
                int value = stoi(text.substr(i + 1, 2), nullptr, 16);
                result += static_cast<char>(value);
                i += 2;
            }
            catch (...) {
                result += text[i];
            }
        }
        else {
            result += text[i];
        }
    }

    return result;
}

// Escape strings for JSON output.
string jsonEscape(const string& text) {
    string result;

    for (char c : text) {
        switch (c) {
            case '"':  result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;

            default:
                if (static_cast<unsigned char>(c) < 32) {
                    result += ' ';
                } else {
                    result += c;
                }
        }
    }

    return result;
}

// Read a field from URL-encoded form data.
string getField(const string& body, const string& name) {
    size_t start = 0;

    while (start < body.size()) {
        size_t end = body.find('&', start);

        if (end == string::npos) {
            end = body.size();
        }

        size_t equal = body.find('=', start);

        if (equal != string::npos && equal < end) {
            string key = body.substr(start, equal - start);

            if (urlDecode(key) == name) {
                return urlDecode(
                    body.substr(equal + 1, end - equal - 1)
                );
            }
        }

        start = end + 1;
    }

    return "";
}

string makeResponse(
    const string& body,
    const string& contentType = "application/json"
) {
    stringstream response;

    response << "HTTP/1.1 200 OK\r\n";
    response << "Content-Type: " << contentType << "\r\n";
    response << "Access-Control-Allow-Origin: http://127.0.0.1:5500\r\n";
    response << "Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n";
    response << "Access-Control-Allow-Headers: Content-Type\r\n";
    response << "Content-Length: " << body.size() << "\r\n";
    response << "Connection: close\r\n\r\n";
    response << body;

    return response.str();
}

int main() {
    WSADATA wsaData;

    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cerr << "Winsock initialization failed." << endl;
        return 1;
    }

    SOCKET serverSocket = socket(
        AF_INET,
        SOCK_STREAM,
        IPPROTO_TCP
    );

    if (serverSocket == INVALID_SOCKET) {
        cerr << "Could not create server socket." << endl;
        WSACleanup();
        return 1;
    }

    sockaddr_in serverAddress = {};

    serverAddress.sin_family = AF_INET;
    serverAddress.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    serverAddress.sin_port = htons(8080);

    if (bind(
        serverSocket,
        reinterpret_cast<sockaddr*>(&serverAddress),
        sizeof(serverAddress)
    ) == SOCKET_ERROR) {
        cerr << "Could not bind to port 8080." << endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    if (listen(serverSocket, 5) == SOCKET_ERROR) {
        cerr << "Could not start listening." << endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    cout << "====================================" << endl;
    cout << "       PLAGISCAN AI SERVER" << endl;
    cout << "====================================" << endl;
    cout << "Server running at http://127.0.0.1:8080" << endl;
    cout << "Press Ctrl+C to stop." << endl;

    while (true) {
        SOCKET clientSocket = accept(
            serverSocket,
            nullptr,
            nullptr
        );

        if (clientSocket == INVALID_SOCKET) {
            continue;
        }

        string request;
        char buffer[4096];

        size_t headerEnd = string::npos;
        size_t contentLength = 0;

        // Read headers and request body.
        while (true) {
            int received = recv(
                clientSocket,
                buffer,
                sizeof(buffer),
                0
            );

            if (received <= 0) {
                break;
            }

            request.append(buffer, received);

            headerEnd = request.find("\r\n\r\n");

            if (headerEnd != string::npos) {
                size_t lengthPos =
                    request.find("Content-Length:");

                if (lengthPos != string::npos &&
                    lengthPos < headerEnd) {

                    lengthPos += 15;

                    while (lengthPos < headerEnd &&
                           request[lengthPos] == ' ') {
                        lengthPos++;
                    }

                    contentLength = static_cast<size_t>(
                        stoul(request.substr(
                            lengthPos,
                            headerEnd - lengthPos
                        ))
                    );
                }

                if (request.size() >=
                    headerEnd + 4 + contentLength) {
                    break;
                }
            }
        }

        string responseBody;

        if (headerEnd == string::npos) {
            responseBody =
                "{\"error\":\"Invalid HTTP request\"}";
        }
        else {
            string headers = request.substr(0, headerEnd);
            string body = request.substr(headerEnd + 4);

            if (headers.find("OPTIONS ") == 0) {
                responseBody = "";
            }
            else if (headers.find("GET /health ") == 0) {
                responseBody =
                    "{\"status\":\"running\","
                    "\"engine\":\"C++\"}";
            }
            else if (headers.find("POST /compare ") == 0) {
                string document1 = getField(body, "document1");
                string document2 = getField(body, "document2");

                if (document1.empty() || document2.empty()) {
                    responseBody =
                        "{\"error\":\"Both documents are required\"}";
                }
                else {
                    PlagiarismReport report =
                        compareDocuments(document1, document2);

                    stringstream json;

                    json << "{\"similarityPercentage\":"
                         << report.similarityPercentage
                         << ",\"matchingSequences\":[";

                    for (size_t i = 0;
                         i < report.matchingSequences.size();
                         i++) {

                        if (i > 0) {
                            json << ",";
                        }

                        json << "\""
                             << jsonEscape(
                                 report.matchingSequences[i]
                             )
                             << "\"";
                    }

                    json << "]}";

                    responseBody = json.str();
                }
            }
            else {
                responseBody =
                    "{\"error\":\"Endpoint not found\"}";
            }
        }

        string response = makeResponse(responseBody);

        size_t sent = 0;

        while (sent < response.size()) {
            int count = send(
                clientSocket,
                response.c_str() + sent,
                static_cast<int>(response.size() - sent),
                0
            );

            if (count <= 0) {
                break;
            }

            sent += count;
        }

        shutdown(clientSocket, SD_SEND);
        closesocket(clientSocket);
    }

    closesocket(serverSocket);
    WSACleanup();

    return 0;
}