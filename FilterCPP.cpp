#include <iostream>
#include <vector>
#include <emscripten.h>

extern "C" {

// Function to filter the array based on threshold
EMSCRIPTEN_KEEPALIVE
std::vector<int>* filterArray(int *array, int size, int threshold) {
    auto* result = new std::vector<int>();
    result->reserve(size);  // Avoid unnecessary reallocations

    for (int i = 0; i < size; i++) {
        if (array[i] >= threshold) {
            result->push_back(array[i]);
        }
    }

    return result;  // Return a pointer to a dynamically allocated vector
}

EMSCRIPTEN_KEEPALIVE
void freeArray(std::vector<int>* array) {
    delete array;
}


// Main function to test filtering
EMSCRIPTEN_KEEPALIVE
int main() {
    int array[] = {1, 4, 7, 2, 5, 8, 3};
    int size = sizeof(array) / sizeof(array[0]);
    int threshold = 4;

    return 0;
}

} // extern "C"
