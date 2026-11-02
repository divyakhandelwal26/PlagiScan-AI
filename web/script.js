// ==========================================
// PLAGISCAN AI - JAVASCRIPT
// ==========================================

// C++ BACKEND URL
const API_URL = "https://plagiscan-ai-jxx8.onrender.com";

// GET HTML ELEMENTS
const $ = (id) => document.getElementById(id);

const document1 = $("document1");
const document2 = $("document2");

const file1 = $("file1");
const file2 = $("file2");

const compareButton = $("compareButton");
const clearButton = $("clearButton");

const resultsSection = $("results");
const scoreElement = $("score");
const originalityElement = $("originalityScore");

const progressBar = $("progress");
const matchesList = $("matches");
const engineStatus = $("engineStatus");

const matchPreview1 = $("matchPreview1");
const matchPreview2 = $("matchPreview2");

const HISTORY_KEY = "plagiscan_scan_history";

let latestResult = null;


// ==========================================
// UPDATE WORD COUNTS
// ==========================================

function updateWordCounts() {
    const text1 = document1.value.trim();
    const text2 = document2.value.trim();

    $("count1").textContent =
        `${text1 ? text1.split(/\s+/).length : 0} words`;

    $("count2").textContent =
        `${text2 ? text2.split(/\s+/).length : 0} words`;
}


// ==========================================
// UPDATE ENGINE STATUS
// ==========================================

function setStatus(message, state = "neutral") {
    engineStatus.textContent = message;
    engineStatus.dataset.state = state;
}


// ==========================================
// DOCUMENT UPLOAD FUNCTION
// ==========================================

function readTextFile(input, target) {

    input.addEventListener("change", () => {

        const file = input.files && input.files[0];

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".txt")) {

            alert("Please upload a .txt file only.");

            input.value = "";

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            target.value = String(reader.result || "");

            target.dispatchEvent(new Event("input"));

        };

        reader.onerror = () => {

            alert("Unable to read this file.");

        };

        reader.readAsText(file);

    });

}

readTextFile(file1, document1);
readTextFile(file2, document2);


// ==========================================
// CHECK C++ ENGINE CONNECTION
// ==========================================

async function checkEngine() {

    try {

        const response = await fetch(`${API_URL}/health`);

        if (!response.ok) {
            throw new Error("Health check failed");
        }

        const data = await response.json();

        if (
            data.status !== "running" ||
            data.engine !== "C++"
        ) {
            throw new Error("Unexpected engine response");
        }

        setStatus(
            "Connected to the C++ plagiarism detection engine.",
            "success"
        );

    } catch (error) {

        setStatus(
            "C++ analysis engine is currently unavailable. Please try again later.",
            "error"
        );

    }

}


// ==========================================
// HIGHLIGHT MATCHING TEXT
// ==========================================

function showHighlights(originalText, passages, preview) {

    const container = preview.querySelector(".highlighted-text");

    container.replaceChildren();

    const valid = [
        ...new Set(
            passages.filter(
                passage =>
                    typeof passage === "string" &&
                    passage.trim()
            )
        )
    ].sort((a, b) => b.length - a.length);

    if (!valid.length) {

        preview.classList.add("hidden");

        return;
    }

    const escaped = valid.map(
        passage =>
            passage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    const pattern = new RegExp(
        `(${escaped.join("|")})`,
        "gi"
    );

    let last = 0;
    let match;

    while ((match = pattern.exec(originalText)) !== null) {

        container.append(
            document.createTextNode(
                originalText.slice(last, match.index)
            )
        );

        const mark = document.createElement("mark");

        mark.textContent = match[0];

        container.append(mark);

        last = pattern.lastIndex;

        if (!match[0].length) {
            pattern.lastIndex++;
        }

    }

    container.append(
        document.createTextNode(
            originalText.slice(last)
        )
    );

    preview.classList.remove("hidden");

}


// ==========================================
// GET SCAN HISTORY
// ==========================================

function getHistory() {

    try {

        const value = JSON.parse(
            localStorage.getItem(HISTORY_KEY) || "[]"
        );

        return Array.isArray(value) ? value : [];

    } catch {

        return [];

    }

}


// ==========================================
// SAVE SCAN HISTORY
// ==========================================

function saveHistory(scan) {

    const history = getHistory();

    history.unshift(scan);

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, 30))
    );

    renderHistory();

    updateAnalytics();

}


// ==========================================
// DISPLAY SCAN HISTORY
// ==========================================

function renderHistory() {

    const list = $("historyList");

    const history = getHistory();

    list.replaceChildren();

    if (!history.length) {

        const p = document.createElement("p");

        p.className = "empty-history";

        p.textContent = "No previous scans yet.";

        list.append(p);

        return;
    }

    history.forEach((scan, index) => {

        const row = document.createElement("article");

        row.className = "history-item";

        const info = document.createElement("div");

        const title = document.createElement("strong");

        title.textContent =
            `Comparison ${history.length - index}`;

        const date = document.createElement("p");

        date.textContent = scan.date
            ? new Date(scan.date).toLocaleString()
            : "Date unavailable";

        info.append(title, date);

        const score = document.createElement("span");

        score.className = "history-score";

        score.textContent =
            `${Number(scan.similarity || 0).toFixed(2)}% similarity`;

        row.append(info, score);

        list.append(row);

    });

}


// ==========================================
// UPDATE ANALYTICS DASHBOARD
// ==========================================

function updateAnalytics() {

    const history = getHistory();

    $("totalScans").textContent = history.length;

    const average = key => {

        return history.length
            ? history.reduce(
                (sum, item) => sum + Number(item[key] || 0),
                0
            ) / history.length
            : 0;

    };

    $("averageSimilarity").textContent =
        `${average("similarity").toFixed(1)}%`;

    $("averageOriginality").textContent =
        `${average("originality").toFixed(1)}%`;

    $("highestSimilarity").textContent =
        `${(
            history.length
                ? Math.max(
                    ...history.map(
                        item => Number(item.similarity) || 0
                    )
                )
                : 0
        ).toFixed(1)}%`;

    drawChart(history.slice(0, 10).reverse());

}


// ==========================================
// DRAW ANALYTICS CHART
// ==========================================

function drawChart(history) {

    const canvas = $("scanChart");

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const width = Math.max(280, rect.width || 600);

    const height = 190;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;

    canvas.height = height * ratio;

    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");

    ctx.scale(ratio, ratio);

    ctx.clearRect(0, 0, width, height);

    const styles = getComputedStyle(document.body);

    const line =
        styles.getPropertyValue("--primary").trim() || "#477fbd";

    const muted =
        styles.getPropertyValue("--muted").trim() || "#aab8ca";

    ctx.strokeStyle = muted;

    ctx.globalAlpha = 0.22;

    ctx.beginPath();

    ctx.moveTo(28, 15);

    ctx.lineTo(28, height - 28);

    ctx.lineTo(width - 10, height - 28);

    ctx.stroke();

    ctx.globalAlpha = 1;

    if (!history.length) {

        ctx.fillStyle = muted;

        ctx.font = "13px Segoe UI";

        ctx.fillText(
            "Your recent comparisons will appear here.",
            40,
            90
        );

        return;
    }

    const points = history.map((item, index) => ({

        x: 35 + index * (
            (width - 60) / Math.max(1, history.length - 1)
        ),

        y: height - 30 - (
            Math.max(
                0,
                Math.min(100, Number(item.similarity) || 0)
            ) / 100
        ) * (height - 55)

    }));

    ctx.strokeStyle = line;

    ctx.lineWidth = 2.5;

    ctx.beginPath();

    points.forEach((point, index) => {

        if (index) {
            ctx.lineTo(point.x, point.y);
        } else {
            ctx.moveTo(point.x, point.y);
        }

    });

    ctx.stroke();

    points.forEach(point => {

        ctx.fillStyle = line;

        ctx.beginPath();

        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);

        ctx.fill();

    });

    ctx.fillStyle = muted;

    ctx.font = "11px Segoe UI";

    ctx.fillText("0%", 3, height - 27);

    ctx.fillText("100%", 2, 17);

}


// ==========================================
// COMPARE TWO DOCUMENTS
// ==========================================

compareButton.addEventListener("click", async () => {

    const text1 = document1.value.trim();

    const text2 = document2.value.trim();

    if (!text1 || !text2) {

        alert("Please enter text in both documents.");

        return;
    }

    compareButton.disabled = true;

    compareButton.textContent = "Analyzing...";

    resultsSection.classList.add("hidden");

    try {

        const body = new URLSearchParams({
            document1: text1,
            document2: text2
        });

        const response = await fetch(
            `${API_URL}/compare`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: body.toString()
            }
        );

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const similarity = Number(
            data.similarityPercentage
        );

        if (!Number.isFinite(similarity)) {

            throw new Error(
                "The analysis engine returned an invalid similarity score."
            );

        }

        const safe = Math.max(
            0,
            Math.min(100, similarity)
        );

        const originality = 100 - safe;

        const passages = Array.isArray(data.matchingSequences)
            ? data.matchingSequences
            : [];

        // DISPLAY SCORES

        scoreElement.textContent =
            `${safe.toFixed(2)}%`;

        originalityElement.textContent =
            `${originality.toFixed(2)}%`;

        progressBar.style.width = `${safe}%`;

        // DISPLAY MATCHING PASSAGES

        matchesList.replaceChildren();

        (
            passages.length
                ? passages
                : ["No matching sequences found."]
        ).forEach(passage => {

            const li = document.createElement("li");

            li.textContent = passage;

            matchesList.append(li);

        });

        // HIGHLIGHT MATCHING TEXT

        showHighlights(
            text1,
            passages,
            matchPreview1
        );

        showHighlights(
            text2,
            passages,
            matchPreview2
        );

        // SAVE LATEST RESULT

        latestResult = {
            similarity: safe,
            originality: originality,
            passages: passages,
            text1: text1,
            text2: text2,
            date: new Date().toISOString()
        };

        // SAVE HISTORY

        saveHistory({
            similarity: safe,
            originality: originality,
            date: latestResult.date
        });

        // SHOW RESULTS

        resultsSection.classList.remove("hidden");

        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        setStatus(
            "Analysis completed using the C++ engine.",
            "success"
        );

    } catch (error) {

        console.error(error);

        setStatus(
            "Unable to complete the comparison. Check your connection and try again.",
            "error"
        );

        alert(
            `Could not compare the documents.\n${error.message}`
        );

    } finally {

        compareButton.disabled = false;

        compareButton.textContent = "Analyze Documents";

    }

});


// ==========================================
// CLEAR ALL DOCUMENTS AND RESULTS
// ==========================================

clearButton.addEventListener("click", () => {

    document1.value = "";

    document2.value = "";

    file1.value = "";

    file2.value = "";

    updateWordCounts();

    latestResult = null;

    scoreElement.textContent = "0%";

    originalityElement.textContent = "0%";

    progressBar.style.width = "0%";

    matchesList.replaceChildren();

    resultsSection.classList.add("hidden");

    [matchPreview1, matchPreview2].forEach(preview => {

        preview.classList.add("hidden");

        preview.querySelector(
            ".highlighted-text"
        ).replaceChildren();

    });

});


// ==========================================
// LIVE WORD COUNT
// ==========================================

document1.addEventListener(
    "input",
    updateWordCounts
);

document2.addEventListener(
    "input",
    updateWordCounts
);


// ==========================================
// CLEAR SCAN HISTORY
// ==========================================

$("clearHistory").addEventListener("click", () => {

    if (!getHistory().length) return;

    if (
        confirm(
            "Clear all saved scan history from this browser?"
        )
    ) {

        localStorage.removeItem(HISTORY_KEY);

        renderHistory();

        updateAnalytics();

    }

});


// ==========================================
// DOWNLOAD PDF REPORT
// ==========================================

$("downloadReport").addEventListener("click", () => {

    if (!latestResult) {

        alert(
            "Please compare two documents before downloading a report."
        );

        return;
    }

    const result = latestResult;

    const safe = value => {

        return String(value).replace(
            /[&<>"']/g,

            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char])

        );

    };

    const report = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>PlagiScan AI Report</title>

<style>

body {
    font-family: Arial, sans-serif;
    color: #202b38;
    padding: 36px;
    line-height: 1.6;
}

h1 {
    color: #244e70;
}

.metric {
    display: inline-block;
    margin: 18px 30px 18px 0;
    padding: 16px;
    border: 1px solid #ccd5df;
    border-radius: 8px;
}

li {
    margin: 8px 0;
}

mark {
    background: #fff0b3;
}

</style>
</head>

<body>

<h1>PlagiScan AI — Similarity Report</h1>

<p>
Generated:
${safe(new Date(result.date).toLocaleString())}
</p>

<div class="metric">
<b>Similarity</b>
<h2>${result.similarity.toFixed(2)}%</h2>
</div>

<div class="metric">
<b>Originality</b>
<h2>${result.originality.toFixed(2)}%</h2>
</div>

<h2>Matching Passages</h2>

<ul>
${
    (
        result.passages.length
            ? result.passages
            : ["No matching sequences found."]
    )
    .map(passage => `<li>${safe(passage)}</li>`)
    .join("")
}
</ul>

<p>
<em>
This similarity result is an aid to review and does not
independently establish plagiarism or misconduct.
</em>
</p>

<script>
window.onload = () => window.print();
<\/script>

</body>
</html>
`;

    const win = window.open("", "_blank");

    if (!win) {

        alert(
            "Please allow pop-ups to generate the report."
        );

        return;
    }

    win.document.open();

    win.document.write(report);

    win.document.close();

});


// ==========================================
// LIGHT AND DARK MODE
// ==========================================

const themeToggle = $("themeToggle");

function applyTheme(theme) {

    const light = theme === "light";

    document.body.classList.toggle(
        "light-mode",
        light
    );

    $("themeIcon").textContent =
        light ? "☾" : "☀";

    $("themeText").textContent =
        light ? "Dark Mode" : "Light Mode";

    localStorage.setItem(
        "plagiscan_theme",
        theme
    );

    updateAnalytics();

}

themeToggle.addEventListener("click", () => {

    const currentTheme =
        document.body.classList.contains("light-mode")
            ? "light"
            : "dark";

    applyTheme(
        currentTheme === "light" ? "dark" : "light"
    );

});


// ==========================================
// WINDOW RESIZE
// ==========================================

window.addEventListener("resize", () => {

    updateAnalytics();

});


// ==========================================
// INITIALIZE WEBSITE
// ==========================================

updateWordCounts();

renderHistory();

applyTheme(
    localStorage.getItem("plagiscan_theme") || "dark"
);

checkEngine();