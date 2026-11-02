
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <cstdlib>
#include <cstring>
#include <cctype>
#include <algorithm>
#include <csignal>

#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <strings.h>

#include "plagiarism.h"

using namespace std;

const string ALLOWED_ORIGIN =
    "https://divyakhandelwal26.github.io";

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

string jsonEscape(const string& text) {
    string result;

    for (char c : text) {
        switch (c) {
            case '"': result += "\\\""; break;
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
    const string& origin,
    const string& status = "200 OK"
) {
    stringstream response;

    response << "HTTP/1.1 " << status << "\r\n";
    response << "Content-Type: application/json\r\n";
    response << "Access-Control-Allow-Origin: " << origin << "\r\n";
    response << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    response << "Access-Control-Allow-Headers: Content-Type\r\n";
    response << "Vary: Origin\r\n";
    response << "Content-Length: " << body.size() << "\r\n";
    response << "Connection: close\r\n\r\n";
    response << body;

    return response.str();
}

string getHeader(const string& headers, const string& name) {
    stringstream stream(headers);
    string line;

    while (getline(stream, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }

        size_t colon = line.find(':');

        if (colon != string::npos) {
            string key = line.substr(0, colon);

            if (strcasecmp(key.c_str(), name.c_str()) == 0) {
                size_t valueStart = line.find_first_not_of(
                    " \t", colon + 1
                );

                if (valueStart == string::npos) {
                    return "";
                }

                return line.substr(valueStart);
            }
        }
    }

    return "";
}

int main() {
    signal(SIGPIPE, SIG_IGN);

    const char* portValue = getenv("PORT");
    int port = portValue ? atoi(portValue) : 8080;

    if (port <= 0 || port > 65535) {
        cerr << "Invalid PORT environment variable." << endl;
        return 1;
    }

    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);

    if (serverSocket < 0) {
        cerr << "Could not create server socket." << endl;
        return 1;
    }

    int reuse = 1;

    setsockopt(
        serverSocket,
        SOL_SOCKET,
        SO_REUSEADDR,
        &reuse,
        sizeof(reuse)
    );

    sockaddr_in serverAddress = {};

    serverAddress.sin_family = AF_INET;
    serverAddress.sin_addr.s_addr = htonl(INADDR_ANY);
    serverAddress.sin_port = htons(port);

    if (bind(
        serverSocket,
        reinterpret_cast<sockaddr*>(&serverAddress),
        sizeof(serverAddress)
    ) < 0) {
        cerr << "Could not bind to port " << port << endl;
        close(serverSocket);
        return 1;
    }

    if (listen(serverSocket, 10) < 0) {
        cerr << "Could not start listening." << endl;
        close(serverSocket);
        return 1;
    }

    cout << "====================================" << endl;
    cout << "       PLAGISCAN AI CLOUD SERVER" << endl;
    cout << "====================================" << endl;
    cout << "Listening on port: " << port << endl;

    while (true) {
        int clientSocket = accept(
            serverSocket,
            nullptr,
            nullptr
        );

        if (clientSocket < 0) {
            continue;
        }

        string request;
        char buffer[4096];

        size_t headerEnd = string::npos;
        size_t contentLength = 0;

        while (true) {
            ssize_t received = recv(
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
                string headers = request.substr(0, headerEnd);

                string lengthValue =
                    getHeader(headers, "Content-Length");

                if (!lengthValue.empty()) {
                    try {
                        contentLength = stoul(lengthValue);
                    }
                    catch (...) {
                        contentLength = 0;
                    }
                }

                if (request.size() >=
                    headerEnd + 4 + contentLength) {
                    break;
                }
            }

            if (request.size() > 10 * 1024 * 1024) {
                break;
            }
        }

        string responseBody;
        string responseStatus = "200 OK";
        string origin = ALLOWED_ORIGIN;

        if (headerEnd == string::npos) {
            responseBody = "{\"error\":\"Invalid HTTP request\"}";
            responseStatus = "400 Bad Request";
        }
        else {
            string headers = request.substr(0, headerEnd);
            string body = request.substr(headerEnd + 4);

            string requestOrigin = getHeader(
                headers, "Origin"
            );

            if (!requestOrigin.empty()) {
                if (requestOrigin == ALLOWED_ORIGIN) {
                    origin = requestOrigin;
                } else {
                    origin = "null";
                }
            }

            size_t firstSpace = request.find(' ');
            size_t secondSpace = request.find(' ', firstSpace + 1);

            string method;
            string path;

            if (firstSpace != string::npos &&
                secondSpace != string::npos) {
                method = request.substr(0, firstSpace);
                path = request.substr(
                    firstSpace + 1,
                    secondSpace - firstSpace - 1
                );
            }

            if (method == "OPTIONS") {
                responseBody = "{}";
                responseStatus = "204 No Content";
            }
            else if (method == "GET" && path == "/health") {
                responseBody = "{\"status\":\"running\",\"engine\":\"C++\"}";
                responseStatus = "200 OK";
            }
            else if (method == "POST" && path == "/compare") {
                string document1 = getField(body, "document1");
                string document2 = getField(body, "document2");

                if (document1.empty() || document2.empty()) {
                    responseBody =
                        "{\"error\":\"Both documents are required\"}";
                    responseStatus = "400 Bad Request";
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
                responseStatus = "404 Not Found";
            }
        }

        string response = makeResponse(
            responseBody,
            origin,
            responseStatus
        );

        size_t sent = 0;

        while (sent < response.size()) {
            ssize_t count = send(
                clientSocket,
                response.c_str() + sent,
                response.size() - sent,
                0
            );

            if (count <= 0) {
                break;
            }

            sent += static_cast<size_t>(count);
        }

        shutdown(clientSocket, SHUT_RDWR);
        close(clientSocket);
    }

    close(serverSocket);
    return 0;
}
