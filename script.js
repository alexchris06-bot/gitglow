let commitsData = [];
let growthChart = null;
let langChart = null;
let isPlaying = false;
let playInterval = null;
let currentStep = 0;

async function fetchData() {
    const repoInput = document.getElementById('repoInput').value.trim();
    const loadingText = document.getElementById('loadingText');

    if (!repoInput) {
        alert("Masukkan nama repository!");
        return;
    }

    loadingText.style.display = 'block';
    resetUI();

    try {
        // Take data commit & data bahasa secara paralel
        const [commitsRes, repoRes, langRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${repoInput}/commits?per_page=100`),
            fetch(`https://api.github.com/repos/${repoInput}`),
            fetch(`https://api.github.com/repos/${repoInput}/languages`)
        ]);

        if (!commitsRes.ok) throw new Error("Repository tidak ditemukan!");

        const commits = await commitsRes.json();
        const repoInfo = await repoRes.json();
        const languages = await langRes.json();

        loadingText.style.display = 'none';

        // Urutkan commit dari yang paling LAMA ke paling BARU untuk replay
        commitsData = commits.reverse();

        // Render Stats
        document.getElementById('statCommits').innerText = commitsData.length;
        document.getElementById('statCreated').innerText = new Date(repoInfo.created_at).toLocaleDateString('id-ID');

        const topLang = Object.keys(languages)[0] || 'Plain Text';
        document.getElementById('statLanguage').innerText = topLang;

        // Show Elements
        document.getElementById('statsGrid').style.display = 'grid';
        document.getElementById('playerCard').style.display = 'block';
        document.getElementById('chartsGrid').style.display = 'grid';

        // Configure Slider
        const slider = document.getElementById('timelineSlider');
        slider.max = commitsData.length - 1;
        slider.value = commitsData.length - 1;

        // Build Initial Charts
        initGrowthChart();
        renderLangChart(languages);

        // Jump to last state
        updateStep(commitsData.length - 1);

    } catch (err) {
        loadingText.style.display = 'none';
        alert(`Error: ${err.message}`);
    }
}

function initGrowthChart() {
    const ctx = document.getElementById('growthChart').getContext('2d');

    if (growthChart) growthChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(63, 185, 80, 0.4)');
    gradient.addColorStop(1, 'rgba(63, 185, 80, 0.0)');

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Akumulasi Commit',
                data: [],
                borderColor: '#3fb950',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4, // Kurva mulus
                pointRadius: 4,
                pointBackgroundColor: '#3fb950'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#30363d' }, ticks: { color: '#8b949e', stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: '#8b949e' } }
            }
        }
    });
}

function renderLangChart(languages) {
    const ctx = document.getElementById('langChart').getContext('2d');
    if (langChart) langChart.destroy();

    const labels = Object.keys(languages);
    const data = Object.values(languages);

    langChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#238636', '#58a6ff', '#f1e05a', '#e34c26', '#563d7c'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#8b949e', font: { size: 10 } } } }
        }
    });
}

function updateStep(step) {
    currentStep = parseInt(step);
    document.getElementById('timelineSlider').value = currentStep;
    document.getElementById('stepIndicator').innerText = `Commit ${currentStep + 1} / ${commitsData.length}`;

    const currentCommit = commitsData[currentStep];
    const dateStr = new Date(currentCommit.commit.author.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    document.getElementById('commitBox').innerHTML = `
    > <b>[${dateStr}]</b><br>
    "${currentCommit.commit.message}"<br>
    <small style="color: #8b949e;">— ${currentCommit.commit.author.name}</small>
  `;

    // Update Line Chart Progressively
    const activeSubSet = commitsData.slice(0, currentStep + 1);
    growthChart.data.labels = activeSubSet.map((_, idx) => `#${idx + 1}`);
    growthChart.data.datasets[0].data = activeSubSet.map((_, idx) => idx + 1);
    growthChart.update('none'); // smooth update
}

function togglePlay() {
    const btn = document.getElementById('playBtn');

    if (isPlaying) {
        clearInterval(playInterval);
        isPlaying = false;
        btn.innerText = '▶ Play Replay';
    } else {
        if (currentStep >= commitsData.length - 1) currentStep = 0;
        isPlaying = true;
        btn.innerText = '⏸ Pause';

        playInterval = setInterval(() => {
            if (currentStep < commitsData.length - 1) {
                currentStep++;
                updateStep(currentStep);
            } else {
                clearInterval(playInterval);
                isPlaying = false;
                btn.innerText = '🔄 Replay';
            }
        }, 800); // Kecepatan pergantian commit (800ms)
    }
}

function onSliderChange(val) {
    if (isPlaying) togglePlay();
    updateStep(val);
}

function resetUI() {
    if (isPlaying) togglePlay();
    document.getElementById('statsGrid').style.display = 'none';
    document.getElementById('playerCard').style.display = 'none';
    document.getElementById('chartsGrid').style.display = 'none';
}