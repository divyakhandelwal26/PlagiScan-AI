
// ==========================================
// PLAGISCAN AI - JAVASCRIPT
// ==========================================

// GET HTML ELEMENTS

const document1 = document.getElementById("document1");
const document2 = document.getElementById("document2");

const file1 = document.getElementById("file1");
const file2 = document.getElementById("file2");

const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistory");

const HISTORY_KEY = "plagiscan_scan_history";

const totalScansElement = document.getElementById("totalScans");
const averageSimilarityElement = document.getElementById("averageSimilarity");
const averageOriginalityElement = document.getElementById("averageOriginality");
const highestSimilarityElement = document.getElementById("highestSimilarity");
const scanChart = document.getElementById("scanChart");

const count1 = document.getElementById("count1");
const count2 = document.getElementById("count2");

const compareButton = document.getElementById("compareButton");
const clearButton = document.getElementById("clearButton");

const resultsSection = document.getElementById("results");
const scoreElement = document.getElementById("score");
const originalityElement = document.getElementById("originalityScore");

const progressBar = document.getElementById("progress");
const matchesList = document.getElementById("matches");
const matchPreview1 = document.getElementById("matchPreview1");
const matchPreview2 = document.getElementById("matchPreview2");

const engineStatus = document.getElementById("engineStatus");

// C++ BACKEND URL

const API_URL = "http://127.0.0.1:8080";


// ==========================================
// UPDATE WORD COUNTS
// ==========================================

function updateWordCounts() {

    const text1 = document1.value.trim();
    const text2 = document2.value.trim();

    count1.textContent =
        (text1 ? text1.split(/\s+/).length : 0) + " words";

    count2.textContent =
        (text2 ? text2.split(/\s+/).length : 0) + " words";
}

// DOCUMENT UPLOAD FUNCTION

function uploadTextFile(fileInput, textArea) {

    fileInput.addEventListener("change", function () {

        const file = fileInput.files[0];

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".txt")) {
            alert("Please upload a .txt file only.");
            fileInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            textArea.value = event.target.result;

            textArea.dispatchEvent(new Event("input"));

            alert(file.name + " uploaded successfully!");

        };

        reader.onerror = function () {
            alert("Unable to read this file.");
        };

        reader.readAsText(file);

    });
}

uploadTextFile(file1, document1);
uploadTextFile(file2, document2);

// ==========================================
// CHECK C++ ENGINE CONNECTION
// ==========================================

async function checkEngine() {

    try {

        const response = await fetch(`${API_URL}/health`);

        if (!response.ok) {
            throw new Error("Server health check failed.");
        }

        const data = await response.json();

        if (data.status === "running" && data.engine === "C++") {

            engineStatus.textContent =
                "Connected to the C++ plagiarism detection engine.";

            engineStatus.style.color = "#39d99a";

        } else {

            throw new Error("Unexpected server response.");

        }

    } catch (error) {

        engineStatus.textContent =
            "C++ engine is offline. Start your backend server.";

        engineStatus.style.color = "#f87171";

    }
}


// ==========================================
// COMPARE TWO DOCUMENTS
// ==========================================

compareButton.addEventListener("click", async function () {

    const text1 = document1.value.trim();
    const text2 = document2.value.trim();

    if (!text1 || !text2) {

        alert("Please enter text in both documents.");

        return;
    }

    compareButton.disabled = true;
    compareButton.textContent = "Analyzing...";

    // Hide previous results

    resultsSection.classList.add("hidden");

    try {

        // Prepare document data

        const formData = new URLSearchParams();

        formData.append("document1", text1);
        formData.append("document2", text2);

        // Send request to C++ backend

        const response = await fetch(`${API_URL}/compare`, {

            method: "POST",

            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },

            body: formData.toString()

        });

        if (!response.ok) {

            throw new Error(`HTTP error: ${response.status}`);

        }

        const data = await response.json();
        saveScanHistory({
    similarity: data.similarityPercentage,
    originality: 100 - Number(data.similarityPercentage),
    document1: text1,
    document2: text2,
    date: new Date().toISOString()
});

        if (data.error) {

            throw new Error(data.error);

        }

        // GET SIMILARITY SCORE

        const similarity = Number(data.similarityPercentage);

        if (!Number.isFinite(similarity)) {

            throw new Error("Invalid similarity score received.");

        }

        // Keep percentage between 0 and 100

        const safeSimilarity = Math.max(0, Math.min(100, similarity));

        // CALCULATE ORIGINALITY

        const originality = 100 - safeSimilarity;

        // DISPLAY RESULTS

        scoreElement.textContent =
            safeSimilarity.toFixed(2) + "%";

        originalityElement.textContent =
            originality.toFixed(2) + "%";

        progressBar.style.width =
            safeSimilarity + "%";


        // ==================================
        // DISPLAY MATCHING PASSAGES
        // ==================================

        matchesList.replaceChildren();

        if (
            Array.isArray(data.matchingSequences) &&
            data.matchingSequences.length > 0
        ) {

            data.matchingSequences.forEach(function (passage) {

                const item = document.createElement("li");

                item.textContent = passage;

                matchesList.appendChild(item);

            });

        } else {

            const item = document.createElement("li");

            item.textContent = "No matching sequences found.";

            matchesList.appendChild(item);

        }
        
        // ==================================
        // HIGHLIGHT MATCHING TEXT
        // ==================================

        function highlightMatchingText(originalText, passages, preview) {

            const content = preview.querySelector(".highlighted-text");

            content.replaceChildren();

            const validPassages = passages
                .filter(p => typeof p === "string" && p.trim())
                .sort((a, b) => b.length - a.length);

            if (validPassages.length === 0) {
                preview.classList.add("hidden");
                return;
            }

            const escapedPassages = validPassages.map(
                p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            );

            const pattern = new RegExp(
                "(" + escapedPassages.join("|") + ")",
                "gi"
            );

            let lastIndex = 0;
            let match;

            while ((match = pattern.exec(originalText)) !== null) {

                content.appendChild(
                    document.createTextNode(
                        originalText.slice(lastIndex, match.index)
                    )
                );

                const mark = document.createElement("mark");

                mark.textContent = match[0];

                content.appendChild(mark);

                lastIndex = pattern.lastIndex;

                if (match[0].length === 0) {
                    pattern.lastIndex++;
                }
            }

            content.appendChild(
                document.createTextNode(originalText.slice(lastIndex))
            );

            preview.classList.remove("hidden");
        }

        const passages = Array.isArray(data.matchingSequences)
            ? data.matchingSequences
            : [];

        highlightMatchingText(text1, passages, matchPreview1);
        highlightMatchingText(text2, passages, matchPreview2);



        // SHOW RESULTS

        resultsSection.classList.remove("hidden");

        resultsSection.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

        engineStatus.textContent =
            "Analysis completed using the C++ engine.";

        engineStatus.style.color = "#39d99a";


    } catch (error) {

        console.error("Comparison error:", error);

        alert(
            "Could not compare the documents.\n\n" +
            error.message +
            "\n\nCheck that your C++ backend is running on port 8080."
        );

        checkEngine();

    } finally {

        compareButton.disabled = false;

        compareButton.textContent = "✦ Analyze Documents";

    }

});


// ==========================================
// CLEAR ALL DOCUMENTS AND RESULTS
// ==========================================

clearButton.addEventListener("click", function () {

    document1.value = "";
    document2.value = "";

    scoreElement.textContent = "0%";

    originalityElement.textContent = "0%";

    progressBar.style.width = "0%";

    matchesList.replaceChildren();

    resultsSection.classList.add("hidden");

    matchPreview1.classList.add("hidden");
matchPreview2.classList.add("hidden");

matchPreview1.querySelector(".highlighted-text").replaceChildren();
matchPreview2.querySelector(".highlighted-text").replaceChildren();

    updateWordCounts();

});


// ==========================================
// LIVE WORD COUNT
// ==========================================

document1.addEventListener("input", updateWordCounts);

document2.addEventListener("input", updateWordCounts);


// ==========================================
// INITIALIZE WEBSITE
// ==========================================

updateWordCounts();

checkEngine();

// ==========================================
// DOWNLOAD PLAGISCAN AI PDF REPORT
// ==========================================

const downloadReportButton = document.getElementById("downloadReport");

if (downloadReportButton) {

    downloadReportButton.addEventListener("click", function () {

        // Get current analysis results

        const similarity = scoreElement.textContent;
        const originality = originalityElement.textContent;

        const text1 = document1.value.trim();
        const text2 = document2.value.trim();

        if (!text1 || !text2) {
            alert("Please compare two documents before downloading.");
            return;
        }

        // Collect matching passages safely

        const matches = Array.from(matchesList.children)
            .map(item => item.textContent);

        const escapeHTML = function (text) {
            return String(text).replace(/[&<>"']/g, function (char) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[char];
            });
        };

        // Create report content

        const reportWindow = window.open("", "_blank");

        if (!reportWindow) {
            alert("Please allow pop-ups to generate your PDF report.");
            return;
        }

        const reportHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>PlagiScan AI - Analysis Report</title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 35px;
                    color: #222;
                    line-height: 1.6;
                }

                .header {
                    border-bottom: 3px solid #8055dc;
                    padding-bottom: 15px;
                }

                h1 {
                    color: #7045c5;
                    margin-bottom: 5px;
                }

                .subtitle {
                    color: #666;
                }

                .scores {
                    display: flex;
                    gap: 20px;
                    margin: 30px 0;
                }

                .score-card {
                    flex: 1;
                    padding: 20px;
                    background: #f3efff;
                    border-radius: 10px;
                }

                .score {
                    font-size: 30px;
                    font-weight: bold;
                    color: #7045c5;
                }

                h2 {
                    color: #7045c5;
                    margin-top: 30px;
                }

                .document {
                    padding: 15px;
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                }

                li {
                    margin-bottom: 10px;
                    overflow-wrap: anywhere;
                }

                .footer {
                    margin-top: 45px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }

                @media print {
                    body {
                        padding: 10px;
                    }

                    .scores {
                        display: flex;
                    }
                }
            </style>
        </head>

        <body>

            <div class="header">
                <h1>PlagiScan AI</h1>
                <div class="subtitle">
                    Document Similarity Analysis Report
                </div>
                <p>Generated: ${escapeHTML(new Date().toLocaleString())}</p>
            </div>

            <div class="scores">

                <div class="score-card">
                    <div>Textual Similarity</div>
                    <div class="score">${escapeHTML(similarity)}</div>
                </div>

                <div class="score-card">
                    <div>Originality</div>
                    <div class="score">${escapeHTML(originality)}</div>
                </div>

            </div>

            <h2>Document 1</h2>
            <div class="document">${escapeHTML(text1)}</div>

            <h2>Document 2</h2>
            <div class="document">${escapeHTML(text2)}</div>

            <h2>Matching Passages</h2>

            <ul>
                ${matches.map(match =>
                    `<li>${escapeHTML(match)}</li>`
                ).join("")}
            </ul>

            <div class="footer">
                This report is generated by PlagiScan AI.
                Similarity is a screening signal and does not
                independently establish plagiarism.
            </div>

            <script>
                window.onload = function () {
                    window.print();
                };
            <\/script>

        </body>
        </html>
        `;

        reportWindow.document.open();
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();

    });

}
// =====================================
// SCAN HISTORY FUNCTIONS
// =====================================

function getScanHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveScanHistory(scan) {
    const history = getScanHistory();

    history.unshift(scan);

    // Keep only the latest 20 scans
    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, 20))
    );

    displayScanHistory();
}

function displayScanHistory() {

    const history = getScanHistory();

    historyList.replaceChildren();

    if (history.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-history";
        emptyMessage.textContent = "No previous scans yet.";

        historyList.appendChild(emptyMessage);
        return;
    }

    history.forEach((scan, index) => {

        const card = document.createElement("div");
        card.className = "history-item";

        const heading = document.createElement("h3");
        heading.textContent = "Scan #" + (index + 1);

        const similarity = document.createElement("p");
        similarity.textContent =
            "Similarity: " + scan.similarity + "%";

        const originality = document.createElement("p");
        originality.textContent =
            "Originality: " + scan.originality + "%";

        const date = document.createElement("p");
        date.className = "history-date";
        date.textContent = new Date(scan.date).toLocaleString();

        const documentInfo = document.createElement("p");
        documentInfo.textContent =
            "Document 1: " + scan.document1.substring(0, 100) +
            (scan.document1.length > 100 ? "..." : "");

        const documentInfo2 = document.createElement("p");
        documentInfo2.textContent =
            "Document 2: " + scan.document2.substring(0, 100) +
            (scan.document2.length > 100 ? "..." : "");

        card.append(
            heading,
            similarity,
            originality,
            documentInfo,
            documentInfo2,
            date
        );

        historyList.appendChild(card);
    });
}

// Clear saved history
clearHistoryButton.addEventListener("click", function () {

    const confirmClear = confirm(
        "Are you sure you want to delete all scan history?"
    );

    if (confirmClear) {
        localStorage.removeItem(HISTORY_KEY);
        displayScanHistory();
    }
});

// Display saved history when website opens
displayScanHistory();


function getScanHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveScanHistory(scan) {
    const history = getScanHistory();

    history.unshift(scan);

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, 20))
    );

    displayScanHistory();

    updateAnalytics();
}

function displayScanHistory() {
    const history = getScanHistory();

    historyList.replaceChildren();

    if (history.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-history";
        emptyMessage.textContent = "No previous scans yet.";

        historyList.appendChild(emptyMessage);
        return;
    }

    history.forEach((scan, index) => {
        const card = document.createElement("div");
        card.className = "history-item";

        const heading = document.createElement("h3");
        heading.textContent = "Scan #" + (index + 1);

        const similarity = document.createElement("p");
        similarity.textContent =
            "Similarity: " + scan.similarity + "%";

        const originality = document.createElement("p");
        originality.textContent =
            "Originality: " + scan.originality + "%";

        const date = document.createElement("p");
        date.className = "history-date";
        date.textContent = new Date(scan.date).toLocaleString();

        const doc1 = document.createElement("p");
        doc1.textContent =
            "Document 1: " + scan.document1.substring(0, 100);

        const doc2 = document.createElement("p");
        doc2.textContent =
            "Document 2: " + scan.document2.substring(0, 100);

        card.append(
            heading,
            similarity,
            originality,
            doc1,
            doc2,
            date
        );

        historyList.appendChild(card);
    });
}

clearHistoryButton.addEventListener("click", function () {
    const confirmClear = confirm(
        "Are you sure you want to delete all scan history?"
    );

    if (confirmClear) {
        localStorage.removeItem(HISTORY_KEY);
        displayScanHistory();
        updateAnalytics();
    }
});

displayScanHistory();


/* =====================================
   ANALYTICS DASHBOARD FUNCTIONS
===================================== */

function updateAnalytics() {

    const history = getScanHistory();

    const total = history.length;

    totalScansElement.textContent = total;

    if (total === 0) {

        averageSimilarityElement.textContent = "0%";
        averageOriginalityElement.textContent = "0%";
        highestSimilarityElement.textContent = "0%";

        drawScanChart([]);
        return;
    }

    const similarities = history.map(
        scan => Number(scan.similarity) || 0
    );

    const originalities = history.map(
        scan => Number(scan.originality) || 0
    );

    const averageSimilarity =
        similarities.reduce((sum, value) => sum + value, 0) / total;

    const averageOriginality =
        originalities.reduce((sum, value) => sum + value, 0) / total;

    const highestSimilarity = Math.max(...similarities);

    averageSimilarityElement.textContent =
        averageSimilarity.toFixed(2) + "%";

    averageOriginalityElement.textContent =
        averageOriginality.toFixed(2) + "%";

    highestSimilarityElement.textContent =
        highestSimilarity.toFixed(2) + "%";

    drawScanChart(history.slice(0, 10).reverse());
}

/* DRAW SCAN ACTIVITY CHART */

function drawScanChart(history) {

    const canvas = scanChart;
    const ctx = canvas.getContext("2d");

    const width = canvas.clientWidth;
    const height = 300;

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.font = "12px Arial";
    ctx.fillStyle = "#aaa4bd";
    ctx.strokeStyle = "#39304f";
    ctx.lineWidth = 1;

    // Horizontal grid lines and labels

    for (let i = 0; i <= 4; i++) {

        const y = padding + (chartHeight / 4) * i;
        const value = 100 - i * 25;

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        ctx.fillText(value + "%", 5, y + 4);
    }

    if (history.length === 0) {

        ctx.fillStyle = "#aaa4bd";
        ctx.textAlign = "center";
        ctx.fillText(
            "Complete a scan to see activity",
            width / 2,
            height / 2
        );

        ctx.textAlign = "left";
        return;
    }

    const values = history.map(
        scan => Number(scan.similarity) || 0
    );

    const points = values.map((value, index) => {

        const x = history.length === 1
            ? padding + chartWidth / 2
            : padding + (index / (values.length - 1)) * chartWidth;

        const y = padding + chartHeight -
            (value / 100) * chartHeight;

        return { x, y, value };
    });

    // Draw the similarity line

    ctx.beginPath();

    points.forEach((point, index) => {

        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }

    });

    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw data points

    points.forEach((point, index) => {

        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);

        ctx.fillStyle = "#c4b5fd";
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        ctx.fillText(
            point.value.toFixed(1) + "%",
            point.x,
            point.y - 12
        );

        ctx.fillStyle = "#aaa4bd";

        ctx.fillText(
            "Scan " + (index + 1),
            point.x,
            height - 8
        );

    });

    ctx.textAlign = "left";
}

/* INITIALIZE ANALYTICS */

updateAnalytics();

/* UPDATE ANALYTICS WHEN HISTORY CHANGES */

window.addEventListener("resize", updateAnalytics);

