let parsons = null;

// List your puzzle files here or fetch dynamically from server if possible
const puzzleFiles = ["java.json", "py.json", "cpp.json"];

function populatePuzzleFileSelect() {
    const select = document.getElementById("puzzle-file-select");
    select.innerHTML = "";
    puzzleFiles.forEach((file) => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file.replace(".json", "");
        select.appendChild(option);
    });
}

function populatePuzzleSelect(puzzles) {
    const select = document.getElementById("puzzle-select");
    select.innerHTML = "";
    if (puzzles.length > 1) {
        select.style.display = "";
        puzzles.forEach((puzzle, idx) => {
            const option = document.createElement("option");
            option.value = idx;
            option.textContent = puzzle.title || `Puzzle ${idx + 1}`;
            select.appendChild(option);
        });
    } else {
        select.style.display = "none";
    }
}

function loadPuzzleFromFile(file, puzzleIdx = 0) {
    const puzzlePath = `../../Puzzles/${file}`;
    const feedback = document.getElementById("feedback");
    feedback.style.display = "none";
    const sortableArea = document.getElementById("sortable");
    sortableArea.innerHTML = "";

    fetch(puzzlePath)
        .then((res) => res.json())
        .then((data) => {
            const puzzles = data.puzzles;
            populatePuzzleSelect(puzzles);
            const puzzle = puzzles[puzzleIdx];

            try {
                if (typeof ParsonsWidget === "undefined") {
                    throw new Error("Parsons is not loaded");
                }

                parsons = new ParsonsWidget({
                    sortableId: "sortable",
                    max_wrong_lines: 3,
                    can_indent: true,
                    x_indent: 50,
                    feedback_cb: true,
                    first_error_only: true,
                    trashId: false,
                });

                // Update UI elements and initialize puzzle
                document.getElementById("puzzle-title").textContent =
                    puzzle.title;
                document.getElementById("puzzle-description").textContent =
                    puzzle.description;

                // Convert code blocks array to proper string format
                const codeString = puzzle.codeBlocks
                    .map((block) => block.trim())
                    .join("\n");
                parsons.init(codeString);
                parsons.options.incorrectSound = false;
                parsons.shuffleLines();

                document.getElementById("show-solution").onclick = function () {
                    sortableArea.innerHTML = "";
                    const ul = document.createElement("ul");
                    ul.className = "sortable-code";
                    sortableArea.appendChild(ul);
                    puzzle.codeBlocks.forEach((block) => {
                        const li = document.createElement("li");
                        li.textContent = block;
                        li.classList.add("correct");
                        if (block.startsWith("    ")) {
                            li.style.marginLeft = "50px";
                        }
                        ul.appendChild(li);
                    });
                    feedback.textContent = "This is the correct answer!";
                    feedback.className = "alert success";
                    feedback.style.display = "block";
                };

                document.getElementById("check-button").onclick = function () {
                    const result = parsons.getFeedback();
                    feedback.style.display = "block";
                    document
                        .querySelectorAll(".sortable-code li")
                        .forEach((li) => {
                            li.classList.remove("correct", "indentation-error");
                        });
                    if (result.success) {
                        feedback.textContent =
                            "Perfect! Your answer is correct!";
                        document
                            .querySelectorAll(".sortable-code li")
                            .forEach((li) => {
                                li.classList.add("correct");
                            });
                    } else {
                        let message = "Not quite right. ";
                        if (result.errors) {
                            const hasIndentErrors = result.errors.some(
                                (error) =>
                                    error.includes &&
                                    error.includes("indentation")
                            );
                            if (hasIndentErrors) {
                                message +=
                                    "Check the indentation of your code. ";
                            } else {
                                message +=
                                    "Some blocks are in the wrong position. ";
                            }
                            result.errors.forEach((error) => {
                                if (error.line !== undefined) {
                                    const block = document.querySelector(
                                        `.sortable-code li:nth-child(${
                                            error.line + 1
                                        })`
                                    );
                                    if (block)
                                        block.classList.add(
                                            "indentation-error"
                                        );
                                }
                            });
                        }
                        feedback.textContent = message + "Try again!";
                    }
                    feedback.className = `alert ${
                        result.success ? "success" : "error"
                    }`;
                };
            } catch (e) {
                console.error("Error initializing Parsons:", e);
                feedback.textContent = "Error initializing puzzle widget";
                feedback.className = "alert error";
                feedback.style.display = "block";
            }
        })
        .catch((error) => {
            console.error("Error loading puzzle:", error);
            feedback.textContent = `Error loading puzzle: ${error.message}`;
            feedback.className = "alert error";
            feedback.style.display = "block";
        });
}

document.addEventListener("DOMContentLoaded", () => {
    // Wait for puzzle files to be ready
    setTimeout(() => {
        populatePuzzleFileSelect();
        const fileSelect = document.getElementById("puzzle-file-select");
        const puzzleSelect = document.getElementById("puzzle-select");

        fileSelect.addEventListener("change", () => {
            loadPuzzleFromFile(fileSelect.value);
        });

        puzzleSelect.addEventListener("change", () => {
            loadPuzzleFromFile(
                fileSelect.value,
                parseInt(puzzleSelect.value, 10)
            );
        });

        // Load first puzzle
        if (puzzleFiles.length > 0) {
            loadPuzzleFromFile(puzzleFiles[0]);
        }
    }, 100);
});
