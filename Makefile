
CXX = g++
CXXFLAGS = -std=c++11 -O2 -Wall

TARGET = plagiscan_server

SOURCES = src/server_linux.cpp \
          src/plagiarism.cpp \
          src/tokenizer.cpp \
          src/hashing.cpp \
          src/lcs.cpp

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SOURCES)
	$(CXX) $(CXXFLAGS) $(SOURCES) -o $(TARGET)

clean:
	rm -f $(TARGET)
