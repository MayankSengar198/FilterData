#include <stdio.h>
#include <stdlib.h>
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int* filterArray(int *array, int size, int threshold, int *newSize) {
    int *result = (int *)malloc(size * sizeof(int)); // Allocate memory for the result array
    *newSize = 0; // Initialize new size of the result array

    for (int i = 0; i < size; i++) {
        if (array[i] >= threshold) {
            result[*newSize] = array[i];
            (*newSize)++;
        }
    }

    return result; // Return the pointer to the filtered array
}

EMSCRIPTEN_KEEPALIVE
int main() {
    int array[] = {1, 4, 7, 2, 5, 8, 3};
    int size = sizeof(array) / sizeof(array[0]);
    int threshold = 4;
    int newSize; // Size of the result array

    int *filteredArray = filterArray(array, size, threshold, &newSize);

    printf("Filtered array: ");
    for (int i = 0; i < newSize; i++) {
        printf("%d ", filteredArray[i]);
    }
    printf("\n");

    free(filteredArray); // Free the allocated memory for the result array

    return 0;
}